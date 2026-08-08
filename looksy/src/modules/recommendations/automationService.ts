import { logger } from "@/lib/logger";
import { computeStatusFromConfidence } from "./service";
import type { MemoriesRepository } from "./repository";
import type { MemoryEvidenceRow } from "./types";
import type {
  EvidenceType,
  EvidenceSourceType,
  MemoryStatus,
  MemoryType,
} from "./schema";
import type { ClothingItemRow } from "@/modules/closet/types";
import type { OutfitFeedbackRow, WearLogRow } from "@/modules/outfits/types";

/**
 * MemoryAutomationService — Phase 7
 *
 * The write-side intelligence that turns behavioral signals (wear, save, skip,
 * swap, repeated color/category choices) into candidate Fashion Memories with
 * mandatory evidence. Deterministic, no LLM calls — implements the application-
 * layer decay and aggregation promised by ADR-014.
 *
 * Contract with the rest of the system:
 * - It is invoked by `FeedbackService` after each record* action (synchronous,
 *   lightweight). The domain API is shaped so this could later move to a
 *   background job without touching the callers.
 * - It reuses the existing `fashion_memories` / `memory_evidence` schema and
 *   `computeStatusFromConfidence` threshold function — never invents a second
 *   confidence system.
 * - User corrections are final: a memory explicitly rejected by the user
 *   (`status === "deleted"` + `userCorrectedAt`) is not recreated from weak
 *   behavioral evidence (see USER_CORRECTION_OVERRIDE_FRESH_SIGNALS).
 * - Every memory it creates carries at least one evidence row pointing back to
 *   the originating wear_log / outfit_feedback rows, so the Trust Layer can
 *   always explain where a memory came from.
 *
 * Phase 7 boundaries: no scheduling infrastructure, no queues, no workers —
 * the trigger is a synchronous call from the feedback path.
 */

// Decay bands — sourced from LOOKSY_PRODUCT_INNOVATIONS.md §3.5 "Memory Decay".
const FRESHNESS_BANDS: ReadonlyArray<{ maxDays: number; factor: number; label: string }> = [
  { maxDays: 30, factor: 1.0, label: "recent" },
  { maxDays: 90, factor: 0.85, label: "active" },
  { maxDays: 180, factor: 0.7, label: "aging" },
  { maxDays: 365, factor: 0.5, label: "fading" },
  { maxDays: Number.POSITIVE_INFINITY, factor: 0.3, label: "dormant" },
];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Per-signal evidence weights. Each row added to `memory_evidence` carries one
 * of these as its `confidence` field, so the aggregate confidence math stays
 * auditable in the database (Trust Layer requirement).
 */
export const SIGNAL_WEIGHTS = {
  worn_frequency: 0.5,
  saved_preference: 0.6,
  outfit_feedback: 0.5,
  style_pattern: 0.4,
  color_harmony: 0.4,
  negative: 0.5,
} as const satisfies Partial<Record<EvidenceType, number>>;

/** Minimum supporting signals before a brand-new candidate memory is created. */
export const CREATION_SIGNAL_THRESHOLD = 2;

/**
 * After a user explicitly rejects a memory, automation will NOT recreate the
 * same pattern until this many fresh supporting signals accumulate. Honors
 * Phase 7 §14 — explicit user correction overrides weak inference.
 */
export const USER_CORRECTION_OVERRIDE_FRESH_SIGNALS = 5;

/** Minimal feedback signal shape — matches the repository's `findUserFeedback` select. */
type FeedbackSignal = Pick<
  OutfitFeedbackRow,
  "id" | "action" | "rating" | "outfitId" | "context" | "createdAt"
>;

/** Candidate memory derived from a cluster of behavioral signals. */
interface CandidateMemory {
  type: MemoryType;
  /** Normalized key, e.g. `color:navy`, `style:earth-tones`, `negative:formal`. */
  category: string;
  description: string;
  polarity: "positive" | "negative";
  evidence: Array<{
    type: EvidenceType;
    text: string;
    sourceType: EvidenceSourceType;
    sourceId?: string;
    data?: Record<string, unknown>;
    weight: number;
  }>;
}

export class MemoryAutomationService {
  constructor(private readonly repository: MemoriesRepository) {}

  /**
   * Main entry point. Inspects recent user signals, derives candidate memories,
   * upserts them with duplicate / contradiction handling, then runs a decay pass
   * over every active memory. Idempotent and safe to call on every feedback
   * action — re-running with the same data produces the same end state.
   */
  async processSignals(userId: string): Promise<{ candidatesEvaluated: number }> {
    try {
      const candidates = await this.extractCandidates(userId);
      for (const candidate of candidates) {
        await this.upsertCandidate(userId, candidate);
      }
      await this.applyDecay(userId);
      return { candidatesEvaluated: candidates.length };
    } catch (error) {
      logger.warn("memory_automation_failed", {
        userId,
        error: error instanceof Error ? error.message : "unknown error",
      });
      // Automation failure must never break the user-facing action.
      return { candidatesEvaluated: 0 };
    }
  }

  /**
   * Reads recent behavioral signals (wear log, outfit feedback, wardrobe) and
   * derives candidate memories deterministically. No LLM.
   *
   * Signal families:
   *  - repeated color choice (≥CREATION_SIGNAL_THRESHOLD items share a color) → color_preference
   *  - repeated category/type wear (most-worn items share a category) → style_tendency
   *  - repeated skips of a formality band (≥CREATION_SIGNAL_THRESHOLD skips targeting "formal") → negative_preference
   */
  private async extractCandidates(userId: string): Promise<CandidateMemory[]> {
    const [wearHistory, feedback, wardrobe] = await Promise.all([
      this.repository.findWearHistory(userId, 30),
      this.repository.findUserFeedback(userId, 30),
      this.repository.findItems(userId, 50),
    ]);

    const candidates: CandidateMemory[] = [];
    candidates.push(...this.detectColorPreferences(wardrobe, wearHistory));
    candidates.push(...this.detectStyleTendencies(wardrobe, wearHistory));
    candidates.push(...this.detectContextPreferences(feedback));
    candidates.push(...this.detectNegativePreferences(feedback));
    return candidates;
  }

  /**
   * Detects dominant colors across the most-worn items. A color appearing on
   * ≥CREATION_SIGNAL_THRESHOLD worn items becomes a candidate color_preference.
   */
  private detectColorPreferences(
    wardrobe: ClothingItemRow[],
    _wearHistory: WearLogRow[],
  ): CandidateMemory[] {
    const wornItems = wardrobe.filter((item) => item.wearCount > 0);
    const colorCounts = new Map<string, ClothingItemRow[]>();
    for (const item of wornItems) {
      for (const color of item.colors) {
        if (!color.name) continue;
        const slug = normalizeCategory(color.name);
        const list = colorCounts.get(slug) ?? [];
        list.push(item);
        colorCounts.set(slug, list);
      }
    }
    const candidates: CandidateMemory[] = [];
    for (const [colorSlug, items] of colorCounts) {
      if (items.length < CREATION_SIGNAL_THRESHOLD) continue;
      const totalWear = items.reduce((sum, i) => sum + i.wearCount, 0);
      if (totalWear < CREATION_SIGNAL_THRESHOLD) continue;
      candidates.push({
        type: "color_preference",
        category: `color:${colorSlug}`,
        description: `Tends to choose ${colorSlug} items`,
        polarity: "positive",
        evidence: items.slice(0, 8).map((item) => ({
          type: "worn_frequency",
          text: `Worn ${item.wearCount}× — ${item.type}${item.subType ? ` (${item.subType})` : ""} in ${colorSlug}`,
          sourceType: "item",
          sourceId: item.id,
          data: { itemId: item.id, wearCount: item.wearCount, color: colorSlug },
          weight: SIGNAL_WEIGHTS.worn_frequency,
        })),
      });
    }
    return candidates;
  }

  /**
   * Detects dominant clothing categories among most-worn items (e.g. "wears
   * sneakers often", "prefers denim"). Used for a style_tendency memory.
   */
  private detectStyleTendencies(
    wardrobe: ClothingItemRow[],
    _wearHistory: WearLogRow[],
  ): CandidateMemory[] {
    const wornItems = wardrobe
      .filter((item) => item.wearCount > 0)
      .sort((a, b) => b.wearCount - a.wearCount)
      .slice(0, 10);
    const typeCounts = new Map<string, { items: ClothingItemRow[]; wear: number }>();
    for (const item of wornItems) {
      const slug = normalizeCategory(item.type);
      const slot = typeCounts.get(slug) ?? { items: [], wear: 0 };
      slot.items.push(item);
      slot.wear += item.wearCount;
      typeCounts.set(slug, slot);
    }
    const candidates: CandidateMemory[] = [];
    for (const [typeSlug, slot] of typeCounts) {
      if (slot.items.length < CREATION_SIGNAL_THRESHOLD || slot.wear < CREATION_SIGNAL_THRESHOLD) {
        continue;
      }
      candidates.push({
        type: "style_tendency",
        category: `style:${typeSlug}`,
        description: `Often wears ${typeSlug}`,
        polarity: "positive",
        evidence: slot.items.slice(0, 5).map((item) => ({
          type: "worn_frequency",
          text: `${item.type} worn ${item.wearCount}×`,
          sourceType: "item",
          sourceId: item.id,
          data: { itemId: item.id, wearCount: item.wearCount },
          weight: SIGNAL_WEIGHTS.worn_frequency,
        })),
      });
    }
    return candidates;
  }

  /**
   * Detects dominant context tags from previous positive feedback signals. The
   * user's feedback context (occasion / weather) on `save` actions is the
   * positive signal — repeatedly saving outfits for the same context creates a
   * `context_preference` memory (e.g. `context:work` → "prefers work outfits").
   *
   * This is the positive counterpart to `detectNegativePreferences`: negative
   * signals come from repeated `skip` actions, positive from repeated `save`
   * actions, on the same context tag.
   */
  private detectContextPreferences(feedback: FeedbackSignal[]): CandidateMemory[] {
    const saveActions = feedback.filter((row) => row.action === "save");
    const saveContextCounts = new Map<string, FeedbackSignal[]>();
    for (const action of saveActions) {
      const tag = readSkipContext(action);
      if (!tag) continue;
      const slug = normalizeCategory(tag);
      const list = saveContextCounts.get(slug) ?? [];
      list.push(action);
      saveContextCounts.set(slug, list);
    }
    const candidates: CandidateMemory[] = [];
    for (const [contextSlug, actions] of saveContextCounts) {
      if (actions.length < CREATION_SIGNAL_THRESHOLD) continue;
      candidates.push({
        type: "context_preference",
        category: `context:${contextSlug}`,
        description: `Prefers ${contextSlug} outfits`,
        polarity: "positive",
        evidence: actions.slice(0, 6).map((action) => ({
          type: "saved_preference",
          text: `Saved an outfit tagged ${contextSlug}`,
          sourceType: "outfit_feedback",
          sourceId: action.outfitId ?? undefined,
          data: { actionId: action.id, action: "save", tag: contextSlug },
          weight: SIGNAL_WEIGHTS.saved_preference,
        })),
      });
    }
    return candidates;
  }

  /**
   * Detects repeated negative signals. If the user skips outfits tagged with a
   * formality band (here approximated by the outfit's occasion) at least
   * CREATION_SIGNAL_THRESHOLD times, a negative_preference candidate is created.
   * Negative-polarity candidates flow into `negative`-type evidence and DECREASE
   * confidence of any conflicting positive memory.
   */
  private detectNegativePreferences(feedback: FeedbackSignal[]): CandidateMemory[] {
    const skipActions = feedback.filter((row) => row.action === "skip");
    const skipContextCounts = new Map<string, FeedbackSignal[]>();
    for (const action of skipActions) {
      const tag = readSkipContext(action);
      if (!tag) continue;
      const slug = normalizeCategory(tag);
      const list = skipContextCounts.get(slug) ?? [];
      list.push(action);
      skipContextCounts.set(slug, list);
    }
    const candidates: CandidateMemory[] = [];
    for (const [contextSlug, actions] of skipContextCounts) {
      if (actions.length < CREATION_SIGNAL_THRESHOLD) continue;
      candidates.push({
        type: "negative_preference",
        category: `negative:${contextSlug}`,
        description: `Avoids ${contextSlug} outfits`,
        polarity: "negative",
        evidence: actions.slice(0, 6).map((action) => ({
          type: "outfit_feedback",
          text: `Skipped an outfit tagged ${contextSlug}`,
          sourceType: "outfit_feedback",
          sourceId: action.outfitId ?? undefined,
          data: { actionId: action.id, action: "skip", tag: contextSlug },
          weight: SIGNAL_WEIGHTS.outfit_feedback,
        })),
      });
    }
    return candidates;
  }

  /**
   * Upserts a candidate into the user's memory store, applying the duplicate and
   * contradiction rules (Phase 7 §8 / §7):
   *  1. Search existing memories for the same (type, category).
   *  2. If a matching memory was explicitly rejected (status=deleted +
   *     userCorrectedAt), and the candidate has fewer fresh supporting signals
   *     than the override threshold, do NOT recreate (user-control priority).
   *  3. If a matching positive memory exists and the candidate is negative, attach
   *     `negative` evidence to it and let the decay pass reduce its confidence
   *     rather than create a contradictory duplicate.
   *  4. Otherwise attach evidence to the existing memory (or create one as
   *     `emerging`) and update its confidence.
   */
  private async upsertCandidate(userId: string, candidate: CandidateMemory): Promise<void> {
    const existing = await this.repository.findMemoryByTypeCategory(userId, candidate.type, candidate.category);

    const deleted = existing.find((m) => m.status === "deleted" && m.userCorrectedAt !== null);
    if (deleted) {
      const freshSupporting = candidate.evidence.filter(
        (e) => e.sourceId !== undefined,
      ).length;
      if (freshSupporting < USER_CORRECTION_OVERRIDE_FRESH_SIGNALS) {
        // User has explicitly rejected this pattern — respect the verdict.
        return;
      }
      // Strong fresh evidence overrides the rejection: reactivate as emerging.
      // The old `deleted` row stays in history; a fresh memory row will be
      // created below as `emerging`.
    }

    if (candidate.polarity === "negative") {
      // Resolve the negative signal against existing positive preferences with
      // the same tag ("skips formal outfits" ↔ "often wears formal"). The
      // contradiction is recorded as `negative` evidence on the positive memory
      // — its confidence drops through the decay pass instead of the pattern
      // spawning a contradictory duplicate memory.
      const conflictTarget = await this.repository.findPositiveMemoryByTag(
        userId,
        candidate.category.replace(/^negative:/, ""),
      );
      if (conflictTarget) {
        await this.repository.insertEvidence(conflictTarget.id, {
          type: "negative",
          text: `Contradiction: ${candidate.description}`,
          sourceType: candidate.evidence[0]?.sourceType ?? "outfit_feedback",
          sourceId: candidate.evidence[0]?.sourceId ?? null,
          // Polarity travels in the `contradiction` data flag, NOT in negative
          // confidence: `chk_memory_evidence_confidence` constrains the column
          // to [0, 1]. aggregateEvidence re-derives the negative contribution.
          data: { ...candidate.evidence[0]?.data, contradiction: true },
          confidence: SIGNAL_WEIGHTS.negative,
        });
        await this.repository.updateMemory(conflictTarget.id, {
          lastSignalAt: new Date(),
        });
        await this.recomputeConfidence(conflictTarget.id);
        return;
      }
      // No conflicting positive memory: the negative pattern becomes its own
      // negative_preference memory (confidence = strength of the avoidance).
    }

    const target = existing.find((m) => m.status !== "deleted");
    if (target) {
      for (const evidence of candidate.evidence) {
        await this.repository.insertEvidence(target.id, {
          type: evidence.type,
          text: evidence.text,
          sourceType: evidence.sourceType,
          sourceId: evidence.sourceId ?? null,
          data: evidence.data,
          confidence: evidence.weight,
        });
      }
      await this.repository.updateMemory(target.id, { lastSignalAt: new Date() });
      await this.recomputeConfidence(target.id);
      return;
    }

    const created = await this.repository.insertMemory(userId, {
      type: candidate.type,
      category: candidate.category,
      description: candidate.description,
      confidence: 0.2,
      source: "behavioral",
      dataPoints: 0,
    });
    for (const evidence of candidate.evidence) {
      await this.repository.insertEvidence(created.id, {
        type: evidence.type,
        text: evidence.text,
        sourceType: evidence.sourceType,
        sourceId: evidence.sourceId ?? null,
        data: evidence.data,
        confidence: evidence.weight,
      });
    }
    await this.repository.updateMemory(created.id, { lastSignalAt: new Date() });
    await this.recomputeConfidence(created.id);
  }

  /**
   * Decays every active (non-deleted) memory by recomputing its confidence from
   * the freshness-weighted average of its evidence. Implements ADR-014 — the DB
   * stays a dumb store, all decay math lives here.
   *
   * Old evidence naturally loses influence (its freshness factor drops through
   * the bands) — the memory's confidence falls — `computeStatusFromConfidence`
   * re-maps it to `fading` / `dormant`. New evidence injects fresh weight and
   * the memory recovers. Old memories are NOT deleted, only demoted.
   */
  async applyDecay(userId: string): Promise<void> {
    const rows = await this.repository.findMemoriesForDecay(userId);
    if (rows.length === 0) return;
    const now = Date.now();
    for (const { memory, evidence } of rows) {
      if (memory.userConfirmedAt && memory.status === "confirmed") {
        // User-confirmed memories are pinned: they only decay if the user never
        // re-engages AND no evidence arrived in the last 365d.
        const lastActivity = Math.max(
          memory.lastConfirmed?.getTime() ?? 0,
          memory.lastSignalAt?.getTime() ?? 0,
        );
        const daysSince = (now - lastActivity) / DAY_MS;
        if (daysSince <= 365) {
          continue;
        }
      }
      const { confidence, dataPoints, consistency } = this.aggregateEvidence(evidence, now);
      await this.repository.updateMemory(memory.id, {
        confidence,
        dataPoints,
        consistency,
        status: computeStatusFromConfidence(confidence) as MemoryStatus,
        lastInfluenced: new Date(),
      });
    }
  }

  /** Recomputes confidence for a single memory from its evidence — used after insert. */
  private async recomputeConfidence(memoryId: string): Promise<void> {
    const evidence = await this.repository.findEvidence(memoryId);
    const now = Date.now();
    const { confidence, dataPoints, consistency } = this.aggregateEvidence(evidence, now);
    await this.repository.updateMemory(memoryId, {
      confidence,
      dataPoints,
      consistency,
      status: computeStatusFromConfidence(confidence) as MemoryStatus,
    });
  }

  /**
   * Pure confidence aggregation — exposed for unit tests so the decay math can
   * be verified without a database.
   *
   * Math:
   *  - Each evidence row contributes `weight × freshness(ageDays)`.
   *  - Confidence is the average contribution across ALL evidence rows: fresh
   *    evidence pulls it up, old evidence's influence fades through the bands,
   *    and contradictions (negative contributions) subtract.
   *  - Consistency is `supportingSignals / totalSignals` — high when most
   *    evidence agrees, low when contradicting.
   *
   * A memory with no evidence at all decays to confidence 0 / status "dormant".
   */
  aggregateEvidence(
    evidence: MemoryEvidenceRow[],
    now: number,
  ): { confidence: number; dataPoints: number; consistency: number } {
    if (evidence.length === 0) {
      return { confidence: 0, dataPoints: 0, consistency: 0 };
    }
    let weightedSum = 0;
    let supporting = 0;
    let contradicting = 0;
    for (const row of evidence) {
      // Contradictions are stored as positive confidence with a `contradiction`
      // data flag (the schema CHECK constrains confidence to [0, 1]). Negative
      // contributions are derived here, in the app layer (ADR-014).
      const rawWeight = row.confidence ?? 0;
      const weight = row.data?.contradiction === true ? -Math.abs(rawWeight) : rawWeight;
      const ageDays = Math.max(0, (now - row.createdAt.getTime()) / DAY_MS);
      weightedSum += weight * freshnessFactor(ageDays);
      if (weight >= 0) supporting += 1;
      else contradicting += 1;
    }
    const total = supporting + contradicting;
    const confidence = total > 0 ? clamp(0, 1, weightedSum / total) : 0;
    const consistency = total > 0 ? supporting / total : 0;
    return {
      confidence: round3(confidence),
      dataPoints: total,
      consistency: round3(consistency),
    };
  }
}

/** Maps an evidence age (in days) to a freshness weight per the documented decay bands. */
export function freshnessFactor(ageDays: number): number {
  for (const band of FRESHNESS_BANDS) {
    if (ageDays <= band.maxDays) return band.factor;
  }
  return FRESHNESS_BANDS[FRESHNESS_BANDS.length - 1]!.factor;
}

function readSkipContext(action: FeedbackSignal): string | null {
  const ctx = action.context as { occasion?: string; weather?: { condition?: string } } | null;
  return ctx?.occasion ?? ctx?.weather?.condition ?? null;
}

function normalizeCategory(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}