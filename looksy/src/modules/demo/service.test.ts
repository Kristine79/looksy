import { describe, it, expect, vi, beforeEach } from "vitest";

const { insertItemMock, findItemsMock, updateAiMetadataMock, insertPhotoMock, upsertEmbeddingMock, createOutfitMock, insertWearLogMock, insertMemoryMock, updateMemoryMock, insertEvidenceMock, emitEventMock } = vi.hoisted(() => ({
  insertItemMock: vi.fn(),
  findItemsMock: vi.fn(),
  updateAiMetadataMock: vi.fn(),
  insertPhotoMock: vi.fn(),
  upsertEmbeddingMock: vi.fn(),
  createOutfitMock: vi.fn(),
  insertWearLogMock: vi.fn(),
  insertMemoryMock: vi.fn(),
  updateMemoryMock: vi.fn(),
  insertEvidenceMock: vi.fn(),
  emitEventMock: vi.fn(),
}));

vi.mock("@/lib/db/client", () => ({
  db: { transaction: (fn: (tx: unknown) => unknown) => fn({}) },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/modules/analytics", () => ({
  ANALYTICS_EVENTS: {
    DEMO_CONTENT_LOADED: "demo_content_loaded",
  },
  emitEvent: emitEventMock,
}));

vi.mock("@/modules/closet", async () => {
  const actual = await vi.importActual<typeof import("@/modules/closet")>("@/modules/closet");
  return {
    ...actual,
    ClosetRepository: class {
      findItems = findItemsMock;
      insertItem = insertItemMock;
      updateAiMetadata = updateAiMetadataMock;
      insertPhoto = insertPhotoMock;
    },
  };
});

vi.mock("@/modules/ai", async () => {
  const actual = await vi.importActual<typeof import("@/modules/ai")>("@/modules/ai");
  return {
    ...actual,
    EmbeddingsRepository: class {
      upsertItemEmbedding = upsertEmbeddingMock;
    },
  };
});

vi.mock("@/modules/outfits", async () => {
  const actual = await vi.importActual<typeof import("@/modules/outfits")>("@/modules/outfits");
  return {
    ...actual,
    OutfitsRepository: class {
      insertWearLog = insertWearLogMock;
    },
    OutfitService: class {
      createOutfit = createOutfitMock;
    },
  };
});

vi.mock("@/modules/recommendations", async () => {
  const actual = await vi.importActual<typeof import("@/modules/recommendations")>(
    "@/modules/recommendations"
  );
  return {
    ...actual,
    MemoriesRepository: class {
      insertMemory = insertMemoryMock;
      updateMemory = updateMemoryMock;
      insertEvidence = insertEvidenceMock;
    },
  };
});

import { loadDemoContent } from "@/modules/demo/service";

describe("demo service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertItemMock.mockImplementation(async (_userId: string, input: { type: string }) => ({
      id: `item-${input.type}`,
    }));
    createOutfitMock.mockResolvedValue({ id: "outfit-1" });
    insertMemoryMock.mockImplementation(async (_userId: string, input: { description: string }) => ({
      id: `memory-${input.description.slice(0, 8)}`,
    }));
  });

  it("loads items, outfit, wear log and memories for an empty account", async () => {
    findItemsMock.mockResolvedValue([]);

    const result = await loadDemoContent("user-1");

    expect(result.status).toBe("loaded");
    expect(result.itemCount).toBe(6);
    expect(result.outfitCount).toBe(2);
    expect(result.memoryCount).toBe(2);
    expect(insertItemMock).toHaveBeenCalledTimes(6);
    expect(insertPhotoMock).toHaveBeenCalledTimes(6);
    expect(upsertEmbeddingMock).toHaveBeenCalledTimes(6);
    expect(createOutfitMock).toHaveBeenCalledTimes(2);
    expect(insertWearLogMock).toHaveBeenCalledTimes(2);
    expect(insertMemoryMock).toHaveBeenCalledTimes(2);
    expect(insertEvidenceMock).toHaveBeenCalled();
    expect(emitEventMock).toHaveBeenCalledWith("user-1", "demo_content_loaded", {
      itemCount: 6,
      outfitCount: 2,
      memoryCount: 2,
    });
  });

  it("marks demo items as AI completed with metadata", async () => {
    findItemsMock.mockResolvedValue([]);

    await loadDemoContent("user-1");

    expect(updateAiMetadataMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ aiStatus: "completed", aiConfidence: 0.9 })
    );
  });

  it("is idempotent — skips when the user already has active items", async () => {
    findItemsMock.mockResolvedValue([{ id: "existing-item" }]);

    const result = await loadDemoContent("user-1");

    expect(result).toEqual({ status: "skipped", itemCount: 0, outfitCount: 0, memoryCount: 0 });
    expect(insertItemMock).not.toHaveBeenCalled();
    expect(insertMemoryMock).not.toHaveBeenCalled();
  });

  it("uses deterministic embeddings and local photo data URLs", async () => {
    findItemsMock.mockResolvedValue([]);

    await loadDemoContent("user-1");

    expect(upsertEmbeddingMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: "demo-v1", dimension: 1536 })
    );
    expect(insertPhotoMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ url: expect.stringMatching(/^data:image\/svg\+xml;base64,/) })
    );
  });

  it("runs all writes inside a single db transaction", async () => {
    findItemsMock.mockResolvedValue([]);
    const transactionMock = vi.fn(async (fn: (tx: unknown) => unknown) => fn({}));
    const dbModule = await import("@/lib/db/client");
    (dbModule.db as unknown as { transaction: unknown }).transaction = transactionMock;

    await loadDemoContent("user-1");

    expect(transactionMock).toHaveBeenCalledTimes(1);
  });
});
