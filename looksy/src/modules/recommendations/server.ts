import { z } from "zod";
import { db } from "@/lib/db/client";
import { logger } from "@/lib/logger";
import { OCCASIONS } from "@/lib/occasions";
import { AIError } from "@/modules/ai/errors";
import { ClosetRepository } from "@/modules/closet";
import {
  EmbeddingsRepository,
  OpenAIProvider,
  RetrievalService,
  getAIProviderConfig,
} from "@/modules/ai";
import { OutfitService, OutfitsRepository } from "@/modules/outfits";
import type {
  EvidenceItem,
  OutfitScores,
  WeatherSnapshot,
} from "@/modules/outfits";
import { FALLBACK_MESSAGE, buildEmptyResult, buildFallbackRecommendation } from "./fallback";
import {
  FashionMemoryService,
  MemoriesRepository,
  MemoryAutomationService,
  PromptBuilder,
  RecommendationContextService,
  RecommendationService,
} from "@/modules/recommendations";
import type { ClothingItemRow } from "@/modules/closet";
import type { FashionMemoryRow } from "@/modules/recommendations";
import type {
  OutfitRecommendation,
  RecommendationResult,
} from "@/modules/recommendations";
import type { MemoryAutomationHook } from "@/modules/outfits/feedbackService";
import { ANALYTICS_EVENTS, emitEvent } from "@/modules/analytics";

export const OCCASIONS_LIST = OCCASIONS;

export const todayLookInputSchema = z.object({
  occasion: z.enum(OCCASIONS).nullable().optional(),
  mood: z.string().max(50).nullable().optional(),
  weather: z
    .object({
      tempC: z.number().optional(),
      condition: z.string().max(100).optional(),
      humidity: z.number().optional(),
      windKph: z.number().optional(),
      uvIndex: z.number().optional(),
    })
    .nullable()
    .optional(),
});

export type TodayLookInput = z.infer<typeof todayLookInputSchema>;

export interface LookItem {
  item: ClothingItemRow;
  photos: Array<{ url: string; thumbnailUrl: string | null; storagePath: string | null }>;
}

export interface TodayLookResult {
  outfitId: string;
  name: string;
  occasion: string | null;
  status: string;
  recommendation: OutfitRecommendation;
  items: LookItem[];
  evidence: EvidenceItem[];
  scores: OutfitScores | null;
  model: string;
  createdAt: Date;
  /** True when the AI provider was unavailable and a deterministic fallback was used. */
  degraded?: boolean;
  /** Non-technical user-facing notice shown alongside a degraded look. */
  message?: string | null;
}

export interface LookCard {
  outfitId: string;
  name: string;
  occasion: string | null;
  status: string;
  explanation: string | null;
  scores: OutfitScores | null;
  createdAt: Date;
}

function buildRecommendationEngine() {
  const provider = new OpenAIProvider(undefined, getAIProviderConfig());
  const embeddingsRepository = new EmbeddingsRepository(db);
  const contextService = new RecommendationContextService(new MemoriesRepository(db));
  const retrieval = new RetrievalService(provider, embeddingsRepository, contextService);
  const promptBuilder = new PromptBuilder();
  return new RecommendationService(provider, retrieval, promptBuilder);
}

function evidenceStringsToItems(evidence: string[]): EvidenceItem[] {
  return evidence.map((text) => ({
    type: "user_data",
    text,
    source: "style_context",
    confidence: 0.9,
  }));
}

/**
 * Generates a fresh recommendation, persists it as an outfit and returns a
 * fully resolved look (items + photos) ready for the UI.
 *
 * Resilience contract: this function NEVER throws on AI/provider failure. When
 * the AI provider is unavailable (auth, timeout, 5xx, network, rate limit), a
 * deterministic fallback outfit is built from the user's wardrobe and returned
 * with `degraded: true` + a non-technical `message`. Only non-AI failures
 * (e.g. database outage) propagate.
 */
export async function getTodayLook(
  userId: string,
  input: TodayLookInput = {}
): Promise<TodayLookResult> {
  const parsed = todayLookInputSchema.parse(input);
  const occasion = parsed.occasion ?? null;
  const weather = (parsed.weather ?? null) as WeatherSnapshot | null;
  const query = occasion ? `a ${occasion} outfit` : "an outfit for today";

  const closetRepository = new ClosetRepository(db);
  const outfitService = new OutfitService(new OutfitsRepository(db));

  // Early empty-wardrobe check — avoids the embedding/retrieval call entirely
  // when the user has no active items.
  const probe = await closetRepository.findItems(userId, { status: "active", limit: 1 });
  if (probe.length === 0) {
    const empty = buildEmptyResult();
    const outfit = await outfitService.createOutfit(
      userId,
      {
        name: lookName(empty.recommendation, occasion),
        source: "ai",
        occasion,
        mood: parsed.mood ?? null,
        weather: weather ?? undefined,
        explanation: empty.recommendation.explanation.whyChosen,
        scores: { total: empty.recommendation.confidence },
        evidence: evidenceStringsToItems(empty.evidence),
        generationContext: { candidatesCount: 0, model: empty.model, promptVersion: "phase-6" },
      },
      [],
    );
    return {
      outfitId: outfit.id,
      name: outfit.name ?? "Today's Look",
      occasion,
      status: outfit.status,
      recommendation: empty.recommendation,
      items: [],
      evidence: [],
      scores: { total: empty.recommendation.confidence },
      model: empty.model,
      createdAt: outfit.createdAt,
      degraded: false,
      message: null,
    };
  }

  let result: RecommendationResult;
  let degraded = false;
  let message: string | null = null;

  try {
    result = await buildRecommendationEngine().recommend({
      userId,
      query,
      occasion,
      weather,
      candidatesLimit: 12,
    });
  } catch (error) {
    // Only AI/provider failures degrade into the deterministic fallback.
    // Everything else (DB outage, validation, bugs) must propagate so it is
    // not masked as "AI is unavailable" and can be surfaced correctly.
    if (!(error instanceof AIError)) {
      throw error;
    }
    const code = error.code;
    const retryable = error.retryable;
    logger.warn("recommendation_fallback", {
      code,
      retryable,
      model: getAIProviderConfig().generationModel,
      error: error instanceof Error ? error.message : "unknown error",
      timestamp: new Date().toISOString(),
    });

    const activeItems = await closetRepository.findItems(userId, { status: "active" });
    const fallback = buildFallbackRecommendation(activeItems);
    result = {
      userId,
      query,
      recommendation: fallback.recommendation,
      items: fallback.items,
      evidence: [],
      model: fallback.model,
      createdAt: new Date(),
    };
    degraded = true;
    message = FALLBACK_MESSAGE;
  }

  const outfit = await outfitService.createOutfit(
    userId,
    {
      name: lookName(result.recommendation, occasion),
      source: "ai",
      occasion,
      mood: parsed.mood ?? null,
      weather: weather ?? undefined,
      explanation: result.recommendation.explanation.whyChosen,
      scores: { total: result.recommendation.confidence },
      evidence: evidenceStringsToItems(result.evidence),
      generationContext: {
        candidatesCount: result.items.length,
        model: result.model,
        promptVersion: "phase-6",
        degraded,
      },
    },
    result.recommendation.outfit.map((entry, index) => ({
      itemId: entry.itemId,
      position: index,
    }))
  );

  const items = await resolveLookItems(userId, result.items);

  emitEvent(userId, ANALYTICS_EVENTS.OUTFIT_GENERATED, {
    outfitId: outfit.id,
    degraded,
    model: result.model,
    itemCount: items.length,
  });

  return {
    outfitId: outfit.id,
    name: outfit.name ?? "Today's Look",
    occasion,
    status: outfit.status,
    recommendation: result.recommendation,
    items,
    evidence: result.evidence.map((text) => ({ type: "user_data", text, source: "style_context" })),
    scores: { total: result.recommendation.confidence },
    model: result.model,
    createdAt: outfit.createdAt,
    degraded,
    message,
  };
}

/**
 * Latest non-dismissed outfit without any AI call — safe for server-rendered pages.
 */
export async function getLatestLook(userId: string): Promise<LookCard | null> {
  const repository = new OutfitsRepository(db);
  const recent = await repository.findOutfits(userId, { limit: 10 });
  const latest = recent.find((outfit) => outfit.status !== "dismissed") ?? recent[0] ?? null;
  if (!latest) {
    return null;
  }
  return {
    outfitId: latest.id,
    name: latest.name ?? "Today's Look",
    occasion: latest.occasion,
    status: latest.status,
    explanation: latest.explanation,
    scores: latest.scores,
    createdAt: latest.createdAt,
  };
}

export async function getLookDetails(
  userId: string,
  outfitId: string
): Promise<TodayLookResult | null> {
  const outfitService = new OutfitService(new OutfitsRepository(db));
  const outfit = await outfitService.getOutfit(userId, outfitId).catch(() => null);
  if (!outfit) {
    return null;
  }

  const items = await resolveLookItems(
    userId,
    outfit.items.map((entry) => entry.item).filter((item): item is ClothingItemRow => item !== null)
  );

  return {
    outfitId: outfit.id,
    name: outfit.name ?? "Today's Look",
    occasion: outfit.occasion,
    status: outfit.status,
    recommendation: {
      outfit: outfit.items.map((entry) => ({
        itemId: entry.itemId,
        reason: "",
      })),
      explanation: {
        whyChosen: outfit.explanation ?? "",
        styleMatch: "",
        contextMatch: "",
      },
      confidence: outfit.scores?.total ?? 0,
    },
    items,
    evidence: outfit.evidence ?? [],
    scores: outfit.scores,
    model: outfit.generationContext?.model ?? "",
    createdAt: outfit.createdAt,
  };
}

/**
 * Fashion memory snapshots shown on the recommendations screen.
 */
export async function getStyleMemories(
  userId: string,
  limit = 8
): Promise<FashionMemoryRow[]> {
  const service = new FashionMemoryService(new MemoriesRepository(db));
  const [confirmed, possible, emerging] = await Promise.all([
    service.getMemories(userId, { status: "confirmed", limit }),
    service.getMemories(userId, { status: "possible", limit }),
    service.getMemories(userId, { status: "emerging", limit }),
  ]);
  return [...confirmed, ...possible, ...emerging]
    .filter((memory, index, all) => all.findIndex((m) => m.id === memory.id) === index)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

async function resolveLookItems(userId: string, items: ClothingItemRow[]): Promise<LookItem[]> {
  if (items.length === 0) {
    return [];
  }
  const photos = await new ClosetRepository(db).findPhotosByItemIds(userId, items.map((i) => i.id));
  const photosByItem = new Map<string, LookItem["photos"]>();
  for (const photo of photos) {
    const list = photosByItem.get(photo.itemId) ?? [];
    list.push({
      url: photo.url,
      thumbnailUrl: photo.thumbnailUrl,
      storagePath: photo.storagePath,
    });
    photosByItem.set(photo.itemId, list);
  }
  return items.map((item) => ({
    item,
    photos: photosByItem.get(item.id) ?? [],
  }));
}

function lookName(recommendation: OutfitRecommendation, occasion: string | null): string {
  if (occasion) {
    return occasion[0]!.toUpperCase() + occasion.slice(1);
  }
  return "Today's Look";
}

/**
 * Composition root for the Fashion Memory automation trigger. Returns a no-arg
 * hook the Outfits feedback actions inject into FeedbackService so every wear /
 * save / swap / skip event flows into the memory-learning pipeline.
 *
 * Lives here (rather than in the outfits module) to keep the import direction
 * one-way: outfits ← recommendations. The hook is a thin closure over the
 * MemoryAutomationService — the domain contract of FeedbackService stays a
 * function-shaped dependency, so the outfits module never imports the
 * recommendations types directly.
 */
export function createMemoryAutomationHook(): MemoryAutomationHook {
  const automation = new MemoryAutomationService(new MemoriesRepository(db));
  return async (userId: string) => {
    await automation.processSignals(userId);
  };
}
