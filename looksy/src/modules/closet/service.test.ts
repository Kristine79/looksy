import { describe, expect, it, vi, beforeEach } from "vitest";
import { ClosetService } from "./service";
import type { ClosetRepository } from "./repository";
import type { ClothingItemRow } from "./types";

const ITEM: ClothingItemRow = {
  id: "item-1",
  userId: "user-1",
  type: "shirt",
  subType: null,
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

function createRepoMock(): ClosetRepository {
  return {
    insertItem: vi.fn(async () => ITEM),
    findItemById: vi.fn(async () => ITEM),
    findItems: vi.fn(async () => [ITEM]),
    findItemsWithPhotos: vi.fn(async () => [{ ...ITEM, photos: [] }]),
    updateItem: vi.fn(async () => ITEM),
    updateStatus: vi.fn(async () => ({ ...ITEM, status: "archived" })),
  } as unknown as ClosetRepository;
}

describe("ClosetService", () => {
  let repo: ClosetRepository;
  let service: ClosetService;

  beforeEach(() => {
    repo = createRepoMock();
    service = new ClosetService(repo);
  });

  it("adds an item to the wardrobe", async () => {
    const item = await service.addToWardrobe("user-1", {
      type: "shirt",
      brand: "Uniqlo",
      seasons: ["spring"],
    });
    expect(item.id).toBe("item-1");
    expect(repo.insertItem).toHaveBeenCalledWith("user-1", expect.objectContaining({ type: "shirt" }));
  });

  it("returns the wardrobe for the user", async () => {
    const wardrobe = await service.getWardrobe("user-1");
    expect(wardrobe).toHaveLength(1);
    expect(repo.findItemsWithPhotos).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ status: "active" })
    );
  });

  it("throws NotFound when item does not exist", async () => {
    (repo.findItemById as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    await expect(service.getItem("user-1", "missing")).rejects.toThrow("not found");
  });

  it("throws Forbidden when item belongs to another user", async () => {
    (repo.findItemById as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ...ITEM,
      userId: "user-2",
    });
    await expect(service.getItem("user-1", "item-1")).rejects.toThrow("another user");
  });

  it("updates metadata via updateClothingMetadata", async () => {
    await service.updateClothingMetadata("user-1", "item-1", { brand: "COS" });
    expect(repo.updateItem).toHaveBeenCalledWith("item-1", { brand: "COS" });
  });

  it("archives the item on removeFromWardrobe", async () => {
    const result = await service.removeFromWardrobe("user-1", "item-1");
    expect(repo.updateStatus).toHaveBeenCalledWith("item-1", "archived");
    expect(result?.status).toBe("archived");
  });
});
