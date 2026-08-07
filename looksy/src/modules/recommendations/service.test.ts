import { describe, expect, it, vi, beforeEach } from "vitest";
import { FashionMemoryService, computeStatusFromConfidence } from "./service";
import type { MemoriesRepository } from "./repository";
import type { FashionMemoryRow } from "./types";

const MEMORY: FashionMemoryRow = {
  id: "memory-1",
  userId: "user-1",
  type: "color_preference",
  category: "colors",
  description: "You prefer earth tones",
  confidence: 0.7,
  status: "possible",
  dataPoints: 10,
  consistency: 0.8,
  source: "behavioral",
  lastSignalAt: null,
  lastConfirmed: null,
  lastInfluenced: null,
  userConfirmedAt: null,
  userCorrectedAt: null,
  correctionText: null,
  deletedAt: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

function createRepoMock(): MemoriesRepository {
  return {
    insertMemory: vi.fn(async (userId, input) => ({ ...MEMORY, ...input }) as FashionMemoryRow),
    findMemoryById: vi.fn(async () => MEMORY),
    findMemories: vi.fn(async () => [MEMORY]),
    insertEvidence: vi.fn(async () => ({ id: "ev-1" })),
    findEvidence: vi.fn(async () => []),
    updateMemory: vi.fn(async (memoryId, patch) => ({ ...MEMORY, ...patch }) as FashionMemoryRow),
    findStyleProfile: vi.fn(async () => null),
    findUserFeedback: vi.fn(async () => []),
    findItems: vi.fn(async () => []),
    findOutfits: vi.fn(async () => []),
    findWearHistory: vi.fn(async () => []),
  } as unknown as MemoriesRepository;
}

describe("computeStatusFromConfidence", () => {
  it("maps confidence to memory status", () => {
    expect(computeStatusFromConfidence(0.9)).toBe("confirmed");
    expect(computeStatusFromConfidence(0.7)).toBe("possible");
    expect(computeStatusFromConfidence(0.5)).toBe("emerging");
    expect(computeStatusFromConfidence(0.3)).toBe("fading");
    expect(computeStatusFromConfidence(0.1)).toBe("dormant");
  });
});

describe("FashionMemoryService", () => {
  let repo: MemoriesRepository;
  let service: FashionMemoryService;

  beforeEach(() => {
    repo = createRepoMock();
    service = new FashionMemoryService(repo);
  });

  it("adds a memory record", async () => {
    const memory = await service.addMemory("user-1", {
      type: "color_preference",
      category: "colors",
      description: "You prefer earth tones",
    });
    expect(memory.id).toBe("memory-1");
    expect(repo.insertMemory).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ type: "color_preference" })
    );
  });

  it("rejects invalid confidence", async () => {
    await expect(
      service.addMemory("user-1", {
        type: "style_tendency",
        category: "silhouette",
        description: "x",
        confidence: 1.5,
      })
    ).rejects.toThrow("between 0 and 1");
  });

  it("adds evidence to a memory", async () => {
    const evidence = await service.addEvidence("user-1", "memory-1", {
      type: "worn_frequency",
      text: "Worn 14 times",
      sourceType: "wear_log",
    });
    expect(evidence).toBeTruthy();
    expect(repo.insertEvidence).toHaveBeenCalledWith(
      "memory-1",
      expect.objectContaining({ sourceType: "wear_log" })
    );
  });

  it("confirms a memory: boosts confidence and sets confirmed status", async () => {
    await service.confirmMemory("user-1", "memory-1");
    expect(repo.updateMemory).toHaveBeenCalledWith(
      "memory-1",
      expect.objectContaining({
        status: "confirmed",
        confidence: 0.8,
        userConfirmedAt: expect.any(Date),
      })
    );
  });

  it("rejects a memory: soft deletes it", async () => {
    await service.rejectMemory("user-1", "memory-1", "Not true");
    expect(repo.updateMemory).toHaveBeenCalledWith(
      "memory-1",
      expect.objectContaining({
        status: "deleted",
        deletedAt: expect.any(Date),
        correctionText: "Not true",
      })
    );
  });

  it("updates confidence and recomputes status", async () => {
    await service.updateConfidence("user-1", "memory-1", 0.95);
    expect(repo.updateMemory).toHaveBeenCalledWith(
      "memory-1",
      expect.objectContaining({ confidence: 0.95, status: "confirmed" })
    );
  });

  it("throws NotFound for unknown memory", async () => {
    (repo.findMemoryById as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    await expect(service.confirmMemory("user-1", "ghost")).rejects.toThrow("not found");
  });

  it("throws Forbidden when memory belongs to another user", async () => {
    (repo.findMemoryById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...MEMORY,
      userId: "user-2",
    });
    await expect(service.getMemoryWithEvidence("user-1", "memory-1")).rejects.toThrow("another user");
  });
});
