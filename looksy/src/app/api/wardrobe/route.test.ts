import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnauthorizedError } from "@/lib/errors";

const { getCurrentUserIdMock, wardrobeServerMocks } = vi.hoisted(() => ({
  getCurrentUserIdMock: vi.fn().mockResolvedValue("user-1"),
  wardrobeServerMocks: {
    addClothingItemWithAnalysis: vi.fn(),
    getWardrobeForPage: vi.fn(),
  },
}));

vi.mock("@/modules/auth/server", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("@/modules/closet/server", async () => {
  const actual = await vi.importActual<typeof import("@/modules/closet/server")>(
    "@/modules/closet/server"
  );
  return {
    addToWardrobeInputSchema: actual.addToWardrobeInputSchema,
    imageDataSchema: actual.imageDataSchema,
    addClothingItemWithAnalysis: wardrobeServerMocks.addClothingItemWithAnalysis,
    getWardrobeForPage: wardrobeServerMocks.getWardrobeForPage,
  };
});

import { GET, POST } from "@/app/api/wardrobe/route";

const VALID_IMAGE = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";

describe("/api/wardrobe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns the wardrobe", async () => {
    wardrobeServerMocks.getWardrobeForPage.mockResolvedValue([{ id: "item-1" }]);
    const response = await GET(
      new Request("http://localhost/api/wardrobe?type=shirt")
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: "item-1" }]);
    expect(wardrobeServerMocks.getWardrobeForPage).toHaveBeenCalledWith("user-1", {
      type: "shirt",
      status: undefined,
    });
  });

  it("POST adds an item and runs analysis", async () => {
    wardrobeServerMocks.addClothingItemWithAnalysis.mockResolvedValue({
      item: { id: "item-1" },
      analysis: { status: "completed" },
    });
    const response = await POST(
      new Request("http://localhost/api/wardrobe", {
        method: "POST",
        body: JSON.stringify({ imageData: VALID_IMAGE, notes: "favorite" }),
      })
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.analysis.status).toBe("completed");
    expect(wardrobeServerMocks.addClothingItemWithAnalysis).toHaveBeenCalledWith("user-1", {
      imageData: VALID_IMAGE,
      notes: "favorite",
    });
  });

  it("POST returns 400 for invalid image data", async () => {
    const response = await POST(
      new Request("http://localhost/api/wardrobe", {
        method: "POST",
        body: JSON.stringify({ imageData: "garbage" }),
      })
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(wardrobeServerMocks.addClothingItemWithAnalysis).not.toHaveBeenCalled();
  });

  it("POST returns 401 without a resolvable user", async () => {
    getCurrentUserIdMock.mockRejectedValue(new UnauthorizedError());
    const response = await POST(
      new Request("http://localhost/api/wardrobe", {
        method: "POST",
        body: JSON.stringify({ imageData: VALID_IMAGE }),
      })
    );
    expect(response.status).toBe(401);
  });
});
