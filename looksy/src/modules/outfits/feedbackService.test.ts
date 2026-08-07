import { describe, expect, it, vi, beforeEach } from "vitest";
import { FeedbackService } from "./feedbackService";
import type { OutfitsRepository } from "./repository";
import type { OutfitRow } from "./types";

const OUTFIT: OutfitRow = {
  id: "outfit-1",
  userId: "user-1",
  name: "Meeting Ready",
  source: "ai",
  status: "generated",
  occasion: "work",
  mood: "confident",
  weather: null,
  explanation: null,
  scores: null,
  evidence: null,
  generationContext: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

function createRepoMock(): OutfitsRepository {
  return {
    findOutfitById: vi.fn(async () => OUTFIT),
    insertWearLog: vi.fn(async () => ({ ...OUTFIT, id: "wear-1" }) as unknown as ReturnType<OutfitsRepository["insertWearLog"]>),
    insertFeedback: vi.fn(async () => ({ id: "fb-1" })),
    updateOutfitStatus: vi.fn(async () => OUTFIT),
    bumpItemWearCounters: vi.fn(async () => undefined),
  } as unknown as OutfitsRepository;
}

describe("FeedbackService", () => {
  let repo: OutfitsRepository;
  let service: FeedbackService;

  beforeEach(() => {
    repo = createRepoMock();
    service = new FeedbackService(repo);
  });

  it("recordWear requires at least one item", async () => {
    await expect(service.recordWear("user-1", { itemIds: [] })).rejects.toThrow("at least one itemId");
  });

  it("recordWear inserts a wear log and bumps item counters", async () => {
    const wornAt = new Date("2026-02-01");
    const result = await service.recordWear("user-1", {
      outfitId: "outfit-1",
      itemIds: ["item-1", "item-2"],
      wornAt,
      occasion: "work",
    });

    expect(result).toBeTruthy();
    expect(repo.insertWearLog).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ itemIds: ["item-1", "item-2"], wornAt })
    );
    expect(repo.bumpItemWearCounters).toHaveBeenCalledWith(["item-1", "item-2"], wornAt);
  });

  it("recordSave saves the outfit and updates its status", async () => {
    await service.recordSave("user-1", { outfitId: "outfit-1", rating: 4 });
    expect(repo.insertFeedback).toHaveBeenCalledWith("user-1", expect.anything(), "save");
    expect(repo.updateOutfitStatus).toHaveBeenCalledWith("outfit-1", "saved");
  });

  it("recordSwap records swap feedback with swapped items", async () => {
    await service.recordSwap("user-1", {
      outfitId: "outfit-1",
      swapOutItemId: "item-1",
      swapInItemId: "item-2",
    });
    expect(repo.insertFeedback).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ swapOutItemId: "item-1", swapInItemId: "item-2" }),
      "swap"
    );
  });

  it("recordSkip dismisses the outfit", async () => {
    await service.recordSkip("user-1", { outfitId: "outfit-1" });
    expect(repo.insertFeedback).toHaveBeenCalledWith("user-1", expect.anything(), "skip");
    expect(repo.updateOutfitStatus).toHaveBeenCalledWith("outfit-1", "dismissed");
  });

  it("throws NotFound when outfit does not exist", async () => {
    (repo.findOutfitById as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    await expect(service.recordSave("user-1", { outfitId: "ghost" })).rejects.toThrow("not found");
  });

  it("throws Forbidden when outfit belongs to another user", async () => {
    (repo.findOutfitById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...OUTFIT,
      userId: "user-2",
    });
    await expect(service.recordWear("user-1", { itemIds: ["i1"], outfitId: "outfit-1" })).rejects.toThrow(
      "another user"
    );
  });
});
