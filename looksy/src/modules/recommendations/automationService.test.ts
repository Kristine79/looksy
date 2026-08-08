import { describe, expect, it, vi, beforeEach } from "vitest";
import { MemoryAutomationService, freshnessFactor, SIGNAL_WEIGHTS } from "./automationService";
import { RecommendationContextService } from "./contextService";
import type { MemoriesRepository } from "./repository";
import type { FashionMemoryRow, MemoryEvidenceRow } from "./types";
import type { ClothingItemRow } from "@/modules/closet/types";
import type { OutfitFeedbackRow } from "@/modules/outfits/types";

const MEMORY: FashionMemoryRow = {
  id: "memory-1",
  userId: "user-1",
  type: "style_tendency",
  category: "style:formal",
  description: "Often wears formal",
  confidence: 0.9,
  status: "confirmed",
  dataPoints: 10,
  consistency: 1,
  source: "behavioral",
  lastSignalAt: new Date("2026-08-01"),
  lastConfirmed: null,
  lastInfluenced: null,
  userConfirmedAt: null,
  userCorrectedAt: null,
  correctionText: null,
  deletedAt: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-08-01"),
};

function makeItem(overrides: Partial<ClothingItemRow>): ClothingItemRow {
  return {
    id: "item-1",
    userId: "user-1",
    type: "shirt",
    subType: null,
    brand: null,
    material: null,
    pattern: null,
    colors: [],
    seasons: [],
    formality: 3,
    condition: "good",
    status: "active",
    wearCount: 0,
    lastWorn: null,
    notes: null,
    aiStatus: "completed",
    aiConfidence: null,
    aiModelVersion: null,
    aiPayload: null,
    aiError: null,
    aiProcessedAt: null,
    metadata: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

function makeSkip(overrides: Partial<OutfitFeedbackRow>): OutfitFeedbackRow {
  return {
    id: "fb-1",
    userId: "user-1",
    outfitId: "outfit-1",
    action: "skip",
    rating: null,
    feedbackTags: null,
    notes: null,
    context: { occasion: "formal" },
    createdAt: new Date("2026-08-01"),
    ...overrides,
  } as OutfitFeedbackRow;
}

function makeEvidence(overrides: Partial<MemoryEvidenceRow> = {}): MemoryEvidenceRow {
  return {
    id: "ev-1",
    memoryId: "memory-1",
    type: "worn_frequency",
    text: "Worn 5x",
    sourceType: "item",
    sourceId: "item-1",
    data: null,
    confidence: 0.5,
    createdAt: new Date("2026-08-01"),
    ...overrides,
  };
}

function createRepoMock(): MemoriesRepository {
  return {
    insertMemory: vi.fn(async (userId, input) => ({ ...MEMORY, ...input }) as FashionMemoryRow),
    findMemoryById: vi.fn(async () => MEMORY),
    findMemories: vi.fn(async () => [MEMORY]),
    findMemoryByTypeCategory: vi.fn(async () => []),
    findPositiveMemoryByTag: vi.fn(async () => null),
    findMemoriesForDecay: vi.fn(async () => []),
    findActiveMemories: vi.fn(async () => []),
    insertEvidence: vi.fn(async () => makeEvidence()),
    findEvidence: vi.fn(async () => []),
    updateMemory: vi.fn(async (memoryId, patch) => ({ ...MEMORY, ...patch }) as FashionMemoryRow),
    findStyleProfile: vi.fn(async () => null),
    findUserFeedback: vi.fn(async () => []),
    findItems: vi.fn(async () => []),
    findOutfits: vi.fn(async () => []),
    findWearHistory: vi.fn(async () => []),
  } as unknown as MemoriesRepository;
}

function getRepo(repo: MemoriesRepository) {
  return repo as unknown as {
    insertMemory: ReturnType<typeof vi.fn>;
    findMemoryByTypeCategory: ReturnType<typeof vi.fn>;
    findPositiveMemoryByTag: ReturnType<typeof vi.fn>;
    findMemoriesForDecay: ReturnType<typeof vi.fn>;
    findActiveMemories: ReturnType<typeof vi.fn>;
    insertEvidence: ReturnType<typeof vi.fn>;
    updateMemory: ReturnType<typeof vi.fn>;
    findItems: ReturnType<typeof vi.fn>;
    findUserFeedback: ReturnType<typeof vi.fn>;
  };
}

const navy = (id: string, type: string, wearCount: number) =>
  makeItem({
    id,
    type,
    colors: [{ name: "navy", hex: "#000080", dominance: 1 }],
    wearCount,
  });

describe("freshnessFactor", () => {
  it("maps age to documented decay bands", () => {
    expect(freshnessFactor(1)).toBe(1);
    expect(freshnessFactor(30)).toBe(1);
    expect(freshnessFactor(31)).toBe(0.85);
    expect(freshnessFactor(100)).toBe(0.7);
    expect(freshnessFactor(200)).toBe(0.5);
    expect(freshnessFactor(400)).toBe(0.3);
  });
});

describe("MemoryAutomationService.aggregateEvidence", () => {
  const service = new MemoryAutomationService(createRepoMock());

  it("returns zeros for a memory with no evidence", () => {
    const result = service.aggregateEvidence([], Date.now());
    expect(result).toEqual({ confidence: 0, dataPoints: 0, consistency: 0 });
  });

  it("averages fresh positive evidence", () => {
    const result = service.aggregateEvidence(
      [
        makeEvidence({ confidence: 0.6, createdAt: new Date("2026-08-01") }),
        makeEvidence({ confidence: 0.4, createdAt: new Date("2026-08-02") }),
      ],
      new Date("2026-08-03").getTime(),
    );
    expect(result.confidence).toBeCloseTo(0.5, 3);
    expect(result.dataPoints).toBe(2);
    expect(result.consistency).toBe(1);
  });

  it("treats contradiction-flagged evidence as a negative contribution", () => {
    const result = service.aggregateEvidence(
      [
        makeEvidence({ confidence: 0.6, createdAt: new Date("2026-08-01") }),
        makeEvidence({
          confidence: 0.5,
          data: { contradiction: true },
          createdAt: new Date("2026-08-01"),
        }),
      ],
      new Date("2026-08-02").getTime(),
    );
    expect(result.confidence).toBeLessThan(0.6);
    expect(result.consistency).toBe(0.5);
  });

  it("ages evidence through the freshness bands", () => {
    const fresh = service.aggregateEvidence(
      [makeEvidence({ confidence: 0.5, createdAt: new Date("2026-08-01") })],
      new Date("2026-08-02").getTime(),
    );
    const old = service.aggregateEvidence(
      [makeEvidence({ confidence: 0.5, createdAt: new Date("2025-01-01") })],
      new Date("2026-08-02").getTime(),
    );
    expect(fresh.confidence).toBe(0.5);
    expect(old.confidence).toBeLessThan(fresh.confidence);
    expect(old.confidence).toBeCloseTo(0.5 * freshnessFactor(579), 3);
  });
});

describe("MemoryAutomationService.processSignals", () => {
  let repo: MemoriesRepository;
  let service: MemoryAutomationService;

  beforeEach(() => {
    repo = createRepoMock();
    service = new MemoryAutomationService(repo);
  });

  it("creates a color_preference memory from repeated worn color with evidence", async () => {
    getRepo(repo).findItems.mockResolvedValue([
      navy("item-1", "shirt", 5),
      navy("item-2", "pants", 3),
    ]);
    const result = await service.processSignals("user-1");
    expect(result).toEqual({ candidatesEvaluated: 1 });
    expect(getRepo(repo).insertMemory).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ type: "color_preference", category: "color:navy" }),
    );
  });

  it("attaches source-linked evidence to every created memory", async () => {
    getRepo(repo).findItems.mockResolvedValue([
      navy("item-1", "shirt", 5),
      navy("item-2", "pants", 3),
    ]);
    await service.processSignals("user-1");
    expect(getRepo(repo).insertEvidence).toHaveBeenCalledWith(
      "memory-1",
      expect.objectContaining({
        type: "worn_frequency",
        sourceType: "item",
        sourceId: "item-1",
        confidence: SIGNAL_WEIGHTS.worn_frequency,
      }),
    );
  });

  it("accumulates on an existing memory instead of duplicating", async () => {
    getRepo(repo).findItems.mockResolvedValue([
      navy("item-1", "shirt", 5),
      navy("item-2", "pants", 3),
    ]);
    getRepo(repo).findMemoryByTypeCategory.mockResolvedValue([MEMORY]);
    await service.processSignals("user-1");
    expect(getRepo(repo).insertMemory).not.toHaveBeenCalled();
    expect(getRepo(repo).insertEvidence).toHaveBeenCalledWith(
      "memory-1",
      expect.objectContaining({ sourceId: "item-1" }),
    );
  });

  it("records a contradiction against the positive memory instead of duplicating", async () => {
    getRepo(repo).findItems.mockResolvedValue([
      makeItem({ id: "item-1", type: "suit", colors: [{ name: "black", hex: "#000000", dominance: 1 }], wearCount: 4 }),
      makeItem({ id: "item-2", type: "suit", colors: [{ name: "grey", hex: "#808080", dominance: 1 }], wearCount: 3 }),
    ]);
    getRepo(repo).findUserFeedback.mockResolvedValue([
      makeSkip({ id: "fb-1", outfitId: "outfit-1" }),
      makeSkip({ id: "fb-2", outfitId: "outfit-2" }),
    ]);
    getRepo(repo).findPositiveMemoryByTag.mockResolvedValue(MEMORY);
    const result = await service.processSignals("user-1");
    expect(result.candidatesEvaluated).toBe(2);
    expect(getRepo(repo).insertEvidence).toHaveBeenCalledWith(
      "memory-1",
      expect.objectContaining({
        type: "negative",
        data: expect.objectContaining({ contradiction: true }),
      }),
    );
    expect(getRepo(repo).insertMemory).toHaveBeenCalledTimes(1);
  });

  it("creates a negative_preference memory when no positive memory conflicts", async () => {
    getRepo(repo).findUserFeedback.mockResolvedValue([
      makeSkip({ id: "fb-1", outfitId: "outfit-1" }),
      makeSkip({ id: "fb-2", outfitId: "outfit-2" }),
    ]);
    const result = await service.processSignals("user-1");
    expect(result.candidatesEvaluated).toBe(1);
    expect(getRepo(repo).insertMemory).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ type: "negative_preference", category: "negative:formal" }),
    );
  });

  it("respects a user-rejected memory until fresh signals exceed the override", async () => {
    const rejected = { ...MEMORY, status: "deleted", userCorrectedAt: new Date("2026-07-01") };
    getRepo(repo).findItems.mockResolvedValue([
      navy("item-1", "shirt", 5),
      navy("item-2", "pants", 3),
    ]);
    getRepo(repo).findMemoryByTypeCategory.mockResolvedValue([rejected]);
    await service.processSignals("user-1");
    expect(getRepo(repo).insertMemory).not.toHaveBeenCalled();
    expect(getRepo(repo).insertEvidence).not.toHaveBeenCalled();
  });

  it("overrides a user rejection when fresh supporting signals are strong enough", async () => {
    const rejected = { ...MEMORY, status: "deleted", userCorrectedAt: new Date("2026-07-01") };
    const items = ["shirt", "pants", "jacket", "hoodie", "sweater"].map((type, i) =>
      navy(`item-${i + 1}`, type, 2),
    );
    getRepo(repo).findItems.mockResolvedValue(items);
    getRepo(repo).findMemoryByTypeCategory.mockResolvedValue([rejected]);
    await service.processSignals("user-1");
    expect(getRepo(repo).insertMemory).toHaveBeenCalledTimes(1);
    expect(getRepo(repo).insertMemory).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ category: "color:navy" }),
    );
  });

  it("swallows repository failures and never throws", async () => {
    getRepo(repo).findItems.mockRejectedValue(new Error("db down"));
    await expect(service.processSignals("user-1")).resolves.toEqual({ candidatesEvaluated: 0 });
  });
});

describe("MemoryAutomationService.applyDecay", () => {
  let repo: MemoriesRepository;
  let service: MemoryAutomationService;

  beforeEach(() => {
    repo = createRepoMock();
    service = new MemoryAutomationService(repo);
  });

  it("does nothing when there are no memories", async () => {
    await service.applyDecay("user-1");
    expect(getRepo(repo).updateMemory).not.toHaveBeenCalled();
  });

  it("recomputes confidence from aged evidence", async () => {
    const oldEvidence = makeEvidence({
      confidence: 0.5,
      createdAt: new Date("2025-01-01"),
    });
    getRepo(repo).findMemoriesForDecay.mockResolvedValue([{ memory: MEMORY, evidence: [oldEvidence] }]);
    await service.applyDecay("user-1");
    expect(getRepo(repo).updateMemory).toHaveBeenCalledWith(
      "memory-1",
      expect.objectContaining({ confidence: expect.any(Number) }),
    );
    const patch = getRepo(repo).updateMemory.mock.calls[0]![1];
    expect(patch.confidence).toBeLessThan(0.5);
    expect(patch.status).toBe("dormant");
  });

  it("pins user-confirmed memories with recent activity", async () => {
    const confirmed = { ...MEMORY, userConfirmedAt: new Date("2026-07-01") };
    getRepo(repo).findMemoriesForDecay.mockResolvedValue([
      { memory: confirmed, evidence: [makeEvidence({ createdAt: new Date("2025-01-01") })] },
    ]);
    await service.applyDecay("user-1");
    expect(getRepo(repo).updateMemory).not.toHaveBeenCalled();
  });

  it("lets stale user-confirmed memories decay too", async () => {
    const confirmed = {
      ...MEMORY,
      userConfirmedAt: new Date("2024-01-01"),
      lastConfirmed: new Date("2024-01-01"),
      lastSignalAt: null,
    };
    getRepo(repo).findMemoriesForDecay.mockResolvedValue([
      { memory: confirmed, evidence: [makeEvidence({ createdAt: new Date("2024-01-01") })] },
    ]);
    await service.applyDecay("user-1");
    expect(getRepo(repo).updateMemory).toHaveBeenCalledWith(
      "memory-1",
      expect.objectContaining({ confidence: expect.any(Number) }),
    );
  });
});

describe("RecommendationContextService", () => {
  it("loads only active memories for the prompt", async () => {
    const repo = createRepoMock();
    const service = new RecommendationContextService(repo);
    const context = await service.buildUserStyleContext("user-1");
    expect(context.memories).toEqual([]);
    expect(getRepo(repo).findActiveMemories).toHaveBeenCalledWith("user-1", 20);
  });
});
