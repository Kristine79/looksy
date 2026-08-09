import { describe, expect, it, vi, beforeEach } from "vitest";
import { RecommendationService } from "./recommendationService";
import { PromptBuilder } from "./promptBuilder";
import { InvalidAIResponseError } from "@/modules/ai/errors";
import type { AIProvider, RetrievalResult } from "@/modules/ai/types";
import type { RetrievalService } from "@/modules/ai/services";
import type { ClothingItemRow } from "@/modules/closet/types";
import type { UserStyleContext } from "@/modules/recommendations/types";

const ITEM: ClothingItemRow = {
  id: "item-1",
  userId: "user-1",
  type: "shirt",
  subType: "oxford",
  brand: "Uniqlo",
  material: "cotton",
  pattern: "solid",
  colors: [{ name: "navy", hex: "#000080", dominance: 1 }],
  seasons: ["spring", "autumn"],
  formality: 3,
  condition: "good",
  status: "active",
  wearCount: 5,
  lastWorn: new Date("2026-07-01"),
  notes: null,
  aiStatus: "completed",
  aiConfidence: 0.9,
  aiModelVersion: "gpt-4o-mini",
  aiPayload: null,
  aiError: null,
  aiProcessedAt: new Date("2026-07-01"),
  metadata: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const VALID_RESPONSE = JSON.stringify({
  outfit: [{ itemId: "item-1", reason: "navy oxford matches your palette" }],
  explanation: {
    whyChosen: "A single navy shirt is your most reliable base",
    styleMatch: "Matches your preferred navy palette",
    contextMatch: "Fits a business meeting",
  },
  confidence: 0.85,
});

function createStyleContext(): UserStyleContext {
  return {
    userId: "user-1",
    wardrobe: [ITEM],
    recentOutfits: [],
    wearHistory: [],
    feedback: [{ action: "wear", rating: 4, createdAt: new Date("2026-07-03") }],
    memories: [],
    styleProfile: {
      userId: "user-1",
      styleVec: new Array(1536).fill(0.01),
      dna: {
        primaryDirection: "minimal",
        colors: [{ name: "navy", share: 0.4 }],
      },
      itemsAnalyzed: 12,
      outfitsAnalyzed: 0,
      model: "text-embedding-3-small",
      computedAt: new Date("2026-06-01"),
      createdAt: new Date("2026-06-01"),
      updatedAt: new Date("2026-06-01"),
    },
  };
}

function createRetrievalResult(overrides: Partial<RetrievalResult> = {}): RetrievalResult {
  return {
    userId: "user-1",
    query: "business meeting outfit",
    queryEmbedding: [0.1],
    similarItems: [{ item: ITEM, distance: 0.2 }],
    context: createStyleContext(),
    ...overrides,
  };
}

function createMocks() {
  const provider = {
    embed: vi.fn(async () => ({ vector: [0.1], model: "text-embedding-3-small", dimensions: 1536 })),
    analyzeClothingImage: vi.fn(),
    generateRecommendation: vi.fn(async () => ({ content: VALID_RESPONSE, model: "gpt-4o" })),
    generateExplanation: vi.fn(),
    generateOutfits: vi.fn(),
    model: "gpt-4o",
    embeddingModel: "text-embedding-3-small",
    visionModel: "gpt-4o-mini",
  } as unknown as AIProvider;

  const retrieval = {
    retrieve: vi.fn(async () => createRetrievalResult()),
  } as unknown as RetrievalService;

  const service = new RecommendationService(provider, retrieval, new PromptBuilder());
  return { provider, retrieval, service };
}

describe("RecommendationService.recommend", () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it("runs the full flow and returns a validated, explainable recommendation", async () => {
    const result = await mocks.service.recommend({
      userId: "user-1",
      query: "business meeting outfit",
      occasion: "business meeting",
      weather: { tempC: 18, condition: "clear" },
    });

    expect(mocks.retrieval.retrieve).toHaveBeenCalledOnce();
    expect(mocks.provider.generateRecommendation).toHaveBeenCalledOnce();
    expect(result.recommendation.outfit).toEqual([
      { itemId: "item-1", reason: "navy oxford matches your palette" },
    ]);
    expect(result.recommendation.explanation.styleMatch).toContain("navy");
    expect(result.recommendation.confidence).toBe(0.85);
    expect(result.items.map((i) => i.id)).toEqual(["item-1"]);
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.evidence.some((e) => e.en.includes("Preferred color palette: navy"))).toBe(true);
    expect(result.model).toBe("gpt-4o");
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it("prefers retrieval candidates over the full wardrobe", async () => {
    const candidate = { ...ITEM, id: "item-rag", type: "jacket" };
    mocks.retrieval.retrieve = vi.fn(async () =>
      createRetrievalResult({
        similarItems: [{ item: candidate, distance: 0.1 }],
      })
    ) as never;

    mocks.provider.generateRecommendation = vi.fn(async () => ({
      content: VALID_RESPONSE.replace("item-1", "item-rag"),
      model: "gpt-4o",
    })) as never;

    const result = await mocks.service.recommend({ userId: "user-1", query: "meeting" });
    expect(result.items.map((i) => i.id)).toEqual(["item-rag"]);
  });

  it("retries once when the first response is invalid JSON", async () => {
    mocks.provider.generateRecommendation = vi
      .fn()
      .mockResolvedValueOnce({ content: "not json at all", model: "gpt-4o" })
      .mockResolvedValueOnce({ content: VALID_RESPONSE, model: "gpt-4o" }) as never;

    const result = await mocks.service.recommend({ userId: "user-1", query: "meeting" });
    expect(mocks.provider.generateRecommendation).toHaveBeenCalledTimes(2);
    expect(result.recommendation.outfit.length).toBe(1);
  });

  it("throws when both attempts are invalid JSON", async () => {
    mocks.provider.generateRecommendation = vi.fn(async () => ({
      content: "not json at all",
      model: "gpt-4o",
    })) as never;

    await expect(mocks.service.recommend({ userId: "user-1", query: "meeting" })).rejects.toThrow(
      InvalidAIResponseError
    );
    expect(mocks.provider.generateRecommendation).toHaveBeenCalledTimes(2);
  });

  it("throws when confidence is out of range", async () => {
    mocks.provider.generateRecommendation = vi.fn(async () => ({
      content: VALID_RESPONSE.replace("0.85", "1.5"),
      model: "gpt-4o",
    })) as never;

    await expect(mocks.service.recommend({ userId: "user-1", query: "meeting" })).rejects.toThrow(
      InvalidAIResponseError
    );
  });

  it("filters out items the user does not own", async () => {
    mocks.provider.generateRecommendation = vi.fn(async () => ({
      content: JSON.stringify({
        outfit: [
          { itemId: "foreign-item", reason: "not yours" },
          { itemId: "item-1", reason: "yours" },
        ],
        explanation: {
          whyChosen: "w",
          styleMatch: "s",
          contextMatch: "c",
        },
        confidence: 0.5,
      }),
      model: "gpt-4o",
    })) as never;

    const result = await mocks.service.recommend({ userId: "user-1", query: "meeting" });
    expect(result.recommendation.outfit.map((o) => o.itemId)).toEqual(["item-1"]);
  });

  it("throws when the model references no owned items at all", async () => {
    mocks.provider.generateRecommendation = vi.fn(async () => ({
      content: VALID_RESPONSE.replace("item-1", "foreign-item"),
      model: "gpt-4o",
    })) as never;

    await expect(mocks.service.recommend({ userId: "user-1", query: "meeting" })).rejects.toThrow(
      "no items from the user's wardrobe"
    );
  });

  it("returns an empty result without calling the LLM when the wardrobe is empty", async () => {
    mocks.retrieval.retrieve = vi.fn(async () =>
      createRetrievalResult({
        similarItems: [],
        context: { ...createStyleContext(), wardrobe: [] },
      })
    ) as never;

    const result = await mocks.service.recommend({ userId: "user-1", query: "meeting" });
    expect(mocks.provider.generateRecommendation).not.toHaveBeenCalled();
    expect(result.recommendation.outfit).toEqual([]);
    expect(result.recommendation.confidence).toBe(0);
    expect(result.recommendation.explanation.whyChosen).toContain("wardrobe is empty");
  });

  it("parses JSON wrapped in a markdown code fence", async () => {
    mocks.provider.generateRecommendation = vi.fn(async () => ({
      content: `Here you go:\n\`\`\`json\n${VALID_RESPONSE}\n\`\`\``,
      model: "gpt-4o",
    })) as never;

    const result = await mocks.service.recommend({ userId: "user-1", query: "meeting" });
    expect(result.recommendation.outfit.length).toBe(1);
  });
});

describe("RecommendationService candidate pool", () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  it("Test A: archived/donated items are excluded from the candidate pool", async () => {
    const archived = { ...ITEM, id: "item-archived", status: "archived" as const, type: "coat" };
    const donated = { ...ITEM, id: "item-donated", status: "donated" as const, type: "dress" };
    mocks.retrieval.retrieve = vi.fn(async () =>
      createRetrievalResult({
        similarItems: [
          { item: { ...ITEM, id: "item-active", type: "shirt" }, distance: 0.1 },
          { item: archived, distance: 0.2 },
          { item: donated, distance: 0.3 },
        ],
      })
    ) as never;

    mocks.provider.generateRecommendation = vi.fn(async (request: {
      systemPrompt: string;
      userPrompt: string;
    }) => {
      // Return one of whatever items actually made it into the prompt.
      const ids = [...request.userPrompt.matchAll(/itemId=([\w-]+)/g)].map((m) => m[1]);
      return {
        content: JSON.stringify({
          outfit: [{ itemId: ids[0], reason: "picked" }],
          explanation: { whyChosen: "w", styleMatch: "s", contextMatch: "c" },
          confidence: 0.5,
        }),
        model: "gpt-4o",
      };
    }) as never;

    const result = await mocks.service.recommend({ userId: "user-1", query: "meeting" });
    // Archived/donated items never reach the candidate pool (buildCandidates guards
    // status=active), so the model could not have referenced them.
    expect(result.items.some((i) => ["item-archived", "item-donated"].includes(i.id))).toBe(false);
  });

  it("Test B: an active item without an embedding is added from wardrobe when candidates are short", async () => {
    const semantic = { ...ITEM, id: "item-semantic", type: "jacket", aiStatus: "completed" as const };
    const noEmbedding = { ...ITEM, id: "item-fresh", type: "hoodie", aiStatus: "pending" as const };
    mocks.retrieval.retrieve = vi.fn(async () =>
      createRetrievalResult({
        // Only 1 semantic candidate — the wear history lookup returns both, and
        // wardrobe holds the fresh item with no embedding.
        similarItems: [{ item: semantic, distance: 0.1 }],
        context: { ...createStyleContext(), wardrobe: [semantic, noEmbedding] },
      })
    ) as never;

    mocks.provider.generateRecommendation = vi.fn(async (request: {
      systemPrompt: string;
      userPrompt: string;
    }) => {
      const ids = [...request.userPrompt.matchAll(/itemId=([\w-]+)/g)].map((m) => m[1]);
      await expect(ids).toContain("item-fresh");
      return {
        content: JSON.stringify({
          outfit: [{ itemId: "item-fresh", reason: "pick the fresh item" }],
          explanation: { whyChosen: "w", styleMatch: "s", contextMatch: "c" },
          confidence: 0.5,
        }),
        model: "gpt-4o",
      };
    }) as never;

    const result = await mocks.service.recommend({ userId: "user-1", query: "meeting" });
    expect(result.recommendation.outfit.map((o) => o.itemId)).toContain("item-fresh");
  });

  it("Test B2: candidate pool is capped at the candidatesLimit and dedupes", async () => {
    const semantic = { ...ITEM, id: "item-1", type: "shirt" };
    const extra = [
      { ...ITEM, id: "item-2", type: "pants" },
      { ...ITEM, id: "item-3", type: "shoes" },
    ];
    mocks.retrieval.retrieve = vi.fn(async () =>
      createRetrievalResult({
        similarItems: [{ item: semantic, distance: 0.1 }],
        context: { ...createStyleContext(), wardrobe: [semantic, ...extra] },
      })
    ) as never;

    let userPrompt = "";
    mocks.provider.generateRecommendation = vi.fn(async (request: {
      systemPrompt: string;
      userPrompt: string;
    }) => {
      userPrompt = request.userPrompt;
      return { content: VALID_RESPONSE, model: "gpt-4o" };
    }) as never;

    await mocks.service.recommend({ userId: "user-1", query: "meeting", candidatesLimit: 2 });

    const listed = [...userPrompt.matchAll(/itemId=([\w-]+)/g)].map((m) => m[1]);
    expect(listed.length).toBeLessThanOrEqual(2);
    // duplicates removed: item-1 appears exactly once
    expect(listed.filter((id) => id === "item-1")).toHaveLength(1);
  });
});

describe("RecommendationService.whyNotRecommended", () => {
  it("is a contract stub for now", async () => {
    const { service } = createMocks();
    await expect(
      service.whyNotRecommended({ userId: "user-1", itemId: "item-2", query: "meeting" })
    ).rejects.toThrow("not implemented");
  });
});

describe("PromptBuilder context assembly with RecommendationService", () => {
  it("passes occasion and weather through to the prompt", async () => {
    const { service, provider } = createMocks();
    let userPrompt = "";
    provider.generateRecommendation = vi.fn(
      async (request: { systemPrompt: string; userPrompt: string }) => {
        userPrompt = request.userPrompt;
        return { content: VALID_RESPONSE, model: "gpt-4o" };
      }
    ) as never;

    await service.recommend({
      userId: "user-1",
      query: "outfit for rain",
      occasion: "casual",
      weather: { tempC: 12, condition: "rain" },
    });

    expect(userPrompt).toContain("Occasion: casual");
    expect(userPrompt).toContain("12°C");
    expect(userPrompt).toContain("rain");
  });
});
