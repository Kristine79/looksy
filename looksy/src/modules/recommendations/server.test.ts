import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIError } from "@/modules/ai/errors";
import { FALLBACK_MESSAGE } from "./fallback";

const { findItemsMock, findPhotosMock, createOutfitMock, recommendMock, emitEventMock } =
  vi.hoisted(() => ({
    findItemsMock: vi.fn(),
    findPhotosMock: vi.fn(),
    createOutfitMock: vi.fn(),
    recommendMock: vi.fn(),
    emitEventMock: vi.fn(),
  }));

vi.mock("@/lib/db/client", () => ({ db: {} }));

vi.mock("@/modules/analytics", () => ({
  ANALYTICS_EVENTS: { OUTFIT_GENERATED: "outfit_generated" },
  emitEvent: emitEventMock,
}));

vi.mock("@/modules/ai", async () => {
  const { AIError: ActualAIError } = await import("@/modules/ai/errors");
  return {
    AIError: ActualAIError,
    EmbeddingsRepository: class {},
    RetrievalService: class {},
    OpenAIProvider: class {},
    getAIProviderConfig: () => ({ generationModel: "test-model" }),
  };
});

vi.mock("@/modules/recommendations", async () => {
  const actual = await vi.importActual<typeof import("@/modules/recommendations")>(
    "@/modules/recommendations"
  );
  return {
    ...actual,
    RecommendationContextService: class {},
    PromptBuilder: class {},
    RecommendationService: class {
      recommend = recommendMock;
    },
  };
});

vi.mock("@/modules/closet", async () => {
  const actual = await vi.importActual<typeof import("@/modules/closet")>("@/modules/closet");
  return {
    ...actual,
    ClosetRepository: class {
      findItems = findItemsMock;
      findPhotosByItemIds = findPhotosMock;
    },
  };
});

vi.mock("@/modules/outfits", async () => {
  const actual = await vi.importActual<typeof import("@/modules/outfits")>("@/modules/outfits");
  return {
    ...actual,
    OutfitsRepository: class {},
    OutfitService: class {
      createOutfit = createOutfitMock;
    },
  };
});

import { getTodayLook } from "./server";

const activeItem = {
  id: "item-1",
  userId: "user-1",
  type: "top",
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
  aiConfidence: 0.9,
  aiModelVersion: "test",
  aiPayload: null,
  aiError: null,
  aiProcessedAt: null,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("getTodayLook fallback contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findItemsMock.mockResolvedValue([activeItem]);
    findPhotosMock.mockResolvedValue([]);
    createOutfitMock.mockResolvedValue({
      id: "outfit-1",
      name: "Today's Look",
      status: "generated",
      occasion: null,
      explanation: null,
      scores: null,
      evidence: [],
      generationContext: null,
      createdAt: new Date(),
    });
  });

  it("degrades into a deterministic fallback when the AI provider fails", async () => {
    recommendMock.mockRejectedValue(new AIError("provider down", "PROVIDER_TIMEOUT", true));

    const result = await getTodayLook("user-1", {});

    expect(result.degraded).toBe(true);
    expect(result.message).toBe(FALLBACK_MESSAGE);
    expect(result.model).toBe("fallback");
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.item).toEqual(activeItem);
    expect(createOutfitMock).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        generationContext: expect.objectContaining({ degraded: true }),
      }),
      expect.any(Array)
    );
  });

  it("propagates non-AI failures instead of masking them as AI unavailability", async () => {
    recommendMock.mockRejectedValue(new Error("database connection lost"));

    await expect(getTodayLook("user-1", {})).rejects.toThrow("database connection lost");
  });

  it("returns an empty result without calling the engine when the wardrobe is empty", async () => {
    findItemsMock.mockResolvedValue([]);

    const result = await getTodayLook("user-1", {});

    expect(recommendMock).not.toHaveBeenCalled();
    expect(result.items).toEqual([]);
    expect(result.degraded).toBe(false);
    expect(createOutfitMock).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ generationContext: expect.objectContaining({ candidatesCount: 0 }) }),
      []
    );
  });
});
