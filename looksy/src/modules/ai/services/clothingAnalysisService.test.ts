import { describe, expect, it, vi, beforeEach } from "vitest";
import { ClothingAnalysisService, ANALYSIS_ERROR_MESSAGE } from "./clothingAnalysisService";
import { validateClothingAnalysis } from "../validation";
import type { AIProvider, ClothingAnalysisWithConfidence } from "../types";
import type { EmbeddingsRepository } from "../repository";
import type { ClosetRepository } from "@/modules/closet/repository";
import type { ClothingItemRow } from "@/modules/closet/types";

const ITEM: ClothingItemRow = {
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
  aiStatus: "pending",
  aiConfidence: null,
  aiModelVersion: null,
  aiPayload: null,
  aiError: null,
  aiProcessedAt: null,
  metadata: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const VALID_ANALYSIS: ClothingAnalysisWithConfidence = {
  category: "shirt",
  subcategory: "button-down",
  colors: [{ name: "navy", hex: "#000080", dominance: 1 }],
  material: "cotton",
  pattern: "solid",
  style: "minimal",
  season: ["spring", "fall"],
  formality: 3,
  attributes: { fit: "regular" },
  confidence: 0.95,
  model: "gpt-4o-mini",
};

const VECTOR = new Array(1536).fill(0.01);

function createMockProvider(analysis: ClothingAnalysisWithConfidence = VALID_ANALYSIS): AIProvider {
  return {
    model: "gpt-4o",
    embeddingModel: "text-embedding-3-small",
    visionModel: "gpt-4o-mini",
    embed: vi.fn(async () => ({ vector: VECTOR, model: "text-embedding-3-small", dimensions: 1536 })),
    analyzeClothingImage: vi.fn(async () => analysis),
    generateRecommendation: vi.fn(),
    generateExplanation: vi.fn(),
    generateOutfits: vi.fn(async () => []),
  };
}

function createMockClosetRepo(): ClosetRepository {
  return {
    findItemById: vi.fn(async () => ITEM),
    updateAiMetadata: vi.fn(async () => ({ ...ITEM, aiStatus: "completed" })),
  } as unknown as ClosetRepository;
}

function createMockEmbeddingsRepo(): EmbeddingsRepository {
  return {
    upsertItemEmbedding: vi.fn(async () => ({ id: "emb-1" })),
    findSimilarItems: vi.fn(async () => []),
    findEmbeddingByItemId: vi.fn(async () => null),
    deleteItemEmbedding: vi.fn(async () => undefined),
  } as unknown as EmbeddingsRepository;
}

describe("validateClothingAnalysis", () => {
  it("accepts a valid vision response", () => {
    const result = validateClothingAnalysis(VALID_ANALYSIS);
    expect(result.category).toBe("shirt");
    expect(result.formality).toBe(3);
  });

  it("rejects invalid formality", () => {
    expect(() =>
      validateClothingAnalysis({ ...VALID_ANALYSIS, formality: 9 })
    ).toThrow("failed validation");
  });

  it("rejects invalid color hex", () => {
    expect(() =>
      validateClothingAnalysis({
        ...VALID_ANALYSIS,
        colors: [{ name: "navy", hex: "navy", dominance: 1 }],
      })
    ).toThrow("failed validation");
  });

  it("rejects missing category", () => {
    expect(() =>
      validateClothingAnalysis({ ...VALID_ANALYSIS, category: "" })
    ).toThrow("failed validation");
  });

  it("normalizes model category variants onto enum-compatible values", () => {
    const cases: Record<string, string> = {
      "t-shirt": "tshirt",
      "T-Shirt": "tshirt",
      top: "shirt",
      Clothing: "other",
      shoes: "shoes",
    };
    for (const [raw, expected] of Object.entries(cases)) {
      const result = validateClothingAnalysis({ ...VALID_ANALYSIS, category: raw });
      expect(result.category).toBe(expected);
    }
  });

  it("maps unknown categories to other", () => {
    const result = validateClothingAnalysis({ ...VALID_ANALYSIS, category: "space suit" });
    expect(result.category).toBe("other");
  });
});

describe("ClothingAnalysisService", () => {
  let provider: AIProvider;
  let closetRepo: ClosetRepository;
  let embeddingsRepo: EmbeddingsRepository;
  let service: ClothingAnalysisService;

  beforeEach(() => {
    provider = createMockProvider();
    closetRepo = createMockClosetRepo();
    embeddingsRepo = createMockEmbeddingsRepo();
    service = new ClothingAnalysisService(provider, closetRepo, embeddingsRepo);
  });

  it("runs the full pipeline: processing -> vision -> validate -> save -> embedding -> completed", async () => {
    const outcome = await service.analyzeClothingItem("user-1", "item-1", "https://img.example/photo.jpg");

    expect(outcome).toMatchObject({ status: "completed", itemId: "item-1" });
    expect(outcome.status === "completed" && outcome.analysis.category).toBe("shirt");

    // initial processing mark
    expect(closetRepo.updateAiMetadata).toHaveBeenCalledWith(
      "item-1",
      expect.objectContaining({ aiStatus: "processing" })
    );
    // final completed save
    expect(closetRepo.updateAiMetadata).toHaveBeenCalledWith(
      "item-1",
      expect.objectContaining({
        aiStatus: "completed",
        type: "shirt",
        material: "cotton",
        colors: [{ name: "navy", hex: "#000080", dominance: 1 }],
      })
    );
    expect(embeddingsRepo.upsertItemEmbedding).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "item-1",
        userId: "user-1",
        textRepr: expect.stringContaining("shirt"),
      })
    );
  });

  it("marks the item as failed and persists a sanitized error when vision fails", async () => {
    (provider.analyzeClothingImage as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("vision timeout")
    );

    const outcome = await service.analyzeClothingItem("user-1", "item-1", "https://img.example/photo.jpg");

    expect(outcome).toMatchObject({ status: "failed", itemId: "item-1" });
    expect(outcome).toMatchObject({ error: ANALYSIS_ERROR_MESSAGE });
    expect(closetRepo.updateAiMetadata).toHaveBeenCalledWith(
      "item-1",
      expect.objectContaining({ aiStatus: "failed", aiError: ANALYSIS_ERROR_MESSAGE })
    );
  });

  it("marks the item as failed when validation fails", async () => {
    const provider = createMockProvider({ ...VALID_ANALYSIS, formality: 12 });
    const service = new ClothingAnalysisService(provider, closetRepo, embeddingsRepo);

    const outcome = await service.analyzeClothingItem("user-1", "item-1", "https://img.example/photo.jpg");

    expect(outcome).toMatchObject({ status: "failed", itemId: "item-1" });
    expect(closetRepo.updateAiMetadata).toHaveBeenCalledWith(
      "item-1",
      expect.objectContaining({ aiStatus: "failed" })
    );
  });

  it("reprocesses a failed item (retry-ready)", async () => {
    const outcome = await service.reprocessClothingItem("user-1", "item-1", "https://img.example/photo.jpg");
    expect(outcome.status).toBe("completed");
  });
});
