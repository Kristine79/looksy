import { describe, it, expect, vi, beforeEach } from "vitest";

const { getCurrentUserIdMock, revalidatePathMock, closetServerMocks } = vi.hoisted(() => ({
  getCurrentUserIdMock: vi.fn().mockResolvedValue("user-1"),
  revalidatePathMock: vi.fn(),
  closetServerMocks: {
    addClothingItemWithAnalysis: vi.fn(),
    getWardrobeForPage: vi.fn(),
    reprocessClothingAnalysis: vi.fn(),
  },
}));

vi.mock("@/modules/auth/server", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/db/client", () => ({ db: {} }));

vi.mock("@/modules/closet/server", async () => {
  const actual = await vi.importActual<typeof import("@/modules/closet/server")>(
    "@/modules/closet/server"
  );
  return {
    addToWardrobeInputSchema: actual.addToWardrobeInputSchema,
    imageDataSchema: actual.imageDataSchema,
    addClothingItemWithAnalysis: closetServerMocks.addClothingItemWithAnalysis,
    getWardrobeForPage: closetServerMocks.getWardrobeForPage,
    reprocessClothingAnalysis: closetServerMocks.reprocessClothingAnalysis,
  };
});

import { addToWardrobeAction, getWardrobeAction, reprocessItemAction } from "@/modules/closet/actions";

describe("closet actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getWardrobeAction returns the wardrobe for the current user", async () => {
    closetServerMocks.getWardrobeForPage.mockResolvedValue([{ id: "item-1" }]);
    const result = await getWardrobeAction({ type: "shirt" });
    expect(getCurrentUserIdMock).toHaveBeenCalled();
    expect(closetServerMocks.getWardrobeForPage).toHaveBeenCalledWith("user-1", { type: "shirt" });
    expect(result).toEqual([{ id: "item-1" }]);
  });

  it("addToWardrobeAction validates and runs the full pipeline", async () => {
    closetServerMocks.addClothingItemWithAnalysis.mockResolvedValue({
      item: { id: "item-1" },
      analysis: { status: "completed" },
    });

    const result = await addToWardrobeAction({
      imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
    });

    expect(closetServerMocks.addClothingItemWithAnalysis).toHaveBeenCalledWith("user-1", {
      imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
    });
    expect(result.analysis.status).toBe("completed");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/wardrobe");
  });

  it("rejects invalid image data", async () => {
    await expect(addToWardrobeAction({ imageData: "not-an-image" })).rejects.toThrow();
    expect(closetServerMocks.addClothingItemWithAnalysis).not.toHaveBeenCalled();
  });

  it("reprocessItemAction re-runs analysis", async () => {
    closetServerMocks.reprocessClothingAnalysis.mockResolvedValue({
      status: "completed",
      itemId: "item-1",
      analysis: {},
    });
    const result = await reprocessItemAction("item-1");
    expect(closetServerMocks.reprocessClothingAnalysis).toHaveBeenCalledWith("user-1", "item-1");
    expect(result.status).toBe("completed");
  });
});
