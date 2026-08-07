import { describe, expect, it, vi, beforeEach } from "vitest";
import { EmbeddingService, buildItemTextRepresentation } from "../services/embeddingService";
import type { AIProvider } from "../types";
import type { EmbeddingsRepository } from "../repository";
import type { ClosetRepository } from "@/modules/closet/repository";
import type { ClothingItemRow } from "@/modules/closet/types";

const ITEM: ClothingItemRow = {
  id: "item-1",
  userId: "user-1",
  type: "shirt",
  subType: "button-down",
  brand: "Uniqlo",
  material: "cotton",
  pattern: "solid",
  colors: [{ name: "navy", hex: "#000080", dominance: 1 }],
  seasons: ["spring", "fall"],
  formality: 3,
  condition: "good",
  status: "active",
  wearCount: 0,
  lastWorn: null,
  notes: null,
  aiStatus: "completed",
  aiConfidence: 0.95,
  aiModelVersion: "gpt-4o-v1",
  aiPayload: null,
  aiError: null,
  aiProcessedAt: new Date(),
  metadata: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const VECTOR = new Array(1536).fill(0.01);

function createMockProvider(): AIProvider {
  return {
    model: "gpt-4o",
    embeddingModel: "text-embedding-3-small",
    visionModel: "gpt-4o-mini",
    embed: vi.fn(async () => ({ vector: VECTOR, model: "text-embedding-3-small", dimensions: 1536 })),
    analyzeClothingImage: vi.fn(),
    generateRecommendation: vi.fn(),
    generateExplanation: vi.fn(),
    generateOutfits: vi.fn(async () => []),
  };
}

function createMockEmbeddingsRepo(): EmbeddingsRepository {
  return {
    upsertItemEmbedding: vi.fn(async () => ({ id: "emb-1" })),
    findSimilarItems: vi.fn(async () => []),
    findEmbeddingByItemId: vi.fn(async () => null),
    deleteItemEmbedding: vi.fn(async () => undefined),
  } as unknown as EmbeddingsRepository;
}

function createMockClosetRepo(): ClosetRepository {
  return {
    findItemById: vi.fn(async () => ITEM),
    updateAiMetadata: vi.fn(async () => ITEM),
  } as unknown as ClosetRepository;
}

describe("buildItemTextRepresentation", () => {
  it("builds a descriptive text from item metadata", () => {
    const text = buildItemTextRepresentation(ITEM);
    expect(text).toContain("shirt");
    expect(text).toContain("button-down");
    expect(text).toContain("Uniqlo");
    expect(text).toContain("navy");
    expect(text).toContain("formality 3/5");
  });
});

describe("EmbeddingService", () => {
  let provider: AIProvider;
  let embeddingsRepo: EmbeddingsRepository;
  let closetRepo: ClosetRepository;
  let service: EmbeddingService;

  beforeEach(() => {
    provider = createMockProvider();
    embeddingsRepo = createMockEmbeddingsRepo();
    closetRepo = createMockClosetRepo();
    service = new EmbeddingService(provider, embeddingsRepo, closetRepo);
  });

  it("generates an embedding via provider", async () => {
    const result = await service.generateEmbedding("navy cotton shirt");
    expect(result.vector).toHaveLength(1536);
    expect(provider.embed).toHaveBeenCalledWith({ text: "navy cotton shirt", model: undefined });
  });

  it("embeds a clothing item and persists it", async () => {
    await service.embedClothingItem("user-1", "item-1");
    expect(embeddingsRepo.upsertItemEmbedding).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "item-1",
        userId: "user-1",
        textRepr: expect.stringContaining("Uniqlo"),
        dimension: 1536,
      })
    );
  });

  it("throws NotFound for unknown item", async () => {
    (closetRepo.findItemById as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    await expect(service.embedClothingItem("user-1", "ghost")).rejects.toThrow("not found");
  });

  it("throws Forbidden for another user's item", async () => {
    (closetRepo.findItemById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...ITEM,
      userId: "user-2",
    });
    await expect(service.embedClothingItem("user-1", "item-1")).rejects.toThrow("another user");
  });
});
