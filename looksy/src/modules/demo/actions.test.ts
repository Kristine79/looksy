import { describe, it, expect, vi, beforeEach } from "vitest";

const { getCurrentUserIdMock, loadDemoContentMock, revalidatePathMock } = vi.hoisted(() => ({
  getCurrentUserIdMock: vi.fn().mockResolvedValue("user-1"),
  loadDemoContentMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/modules/auth/server", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("./service", () => ({
  loadDemoContent: loadDemoContentMock,
}));

import { loadDemoWardrobeAction } from "@/modules/demo/actions";

describe("loadDemoWardrobeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads demo content for the current user and revalidates pages", async () => {
    loadDemoContentMock.mockResolvedValue({
      status: "loaded",
      itemCount: 6,
      outfitCount: 2,
      memoryCount: 2,
    });

    const result = await loadDemoWardrobeAction();

    expect(getCurrentUserIdMock).toHaveBeenCalled();
    expect(loadDemoContentMock).toHaveBeenCalledWith("user-1");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/wardrobe");
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/recommendations");
    expect(result).toEqual({
      status: "loaded",
      itemCount: 6,
      outfitCount: 2,
      memoryCount: 2,
    });
  });

  it("reports skipped when the account already has items (idempotent)", async () => {
    loadDemoContentMock.mockResolvedValue({
      status: "skipped",
      itemCount: 0,
      outfitCount: 0,
      memoryCount: 0,
    });

    const result = await loadDemoWardrobeAction();

    expect(result.status).toBe("skipped");
  });
});
