import { describe, it, expect, vi, beforeEach } from "vitest";

const { getCurrentUserIdMock, revalidatePathMock, recServerMocks } = vi.hoisted(() => ({
  getCurrentUserIdMock: vi.fn().mockResolvedValue("user-1"),
  revalidatePathMock: vi.fn(),
  recServerMocks: {
    getTodayLook: vi.fn(),
    getLatestLook: vi.fn(),
    getLookDetails: vi.fn(),
    getStyleMemories: vi.fn(),
  },
}));

vi.mock("@/modules/auth/server", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/db/client", () => ({ db: {} }));

vi.mock("@/modules/recommendations/server", async () => {
  const actual = await vi.importActual<typeof import("@/modules/recommendations/server")>(
    "@/modules/recommendations/server"
  );
  return {
    todayLookInputSchema: actual.todayLookInputSchema,
    getTodayLook: recServerMocks.getTodayLook,
    getLatestLook: recServerMocks.getLatestLook,
    getLookDetails: recServerMocks.getLookDetails,
    getStyleMemories: recServerMocks.getStyleMemories,
  };
});

import {
  getLatestLookAction,
  getLookDetailsAction,
  getStyleMemoriesAction,
  getTodayLookAction,
} from "@/modules/recommendations/actions";

describe("recommendations actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getTodayLookAction generates and persists a look", async () => {
    recServerMocks.getTodayLook.mockResolvedValue({ outfitId: "outfit-1", name: "Work" });

    const result = await getTodayLookAction({ occasion: "work" });

    expect(getCurrentUserIdMock).toHaveBeenCalled();
    expect(recServerMocks.getTodayLook).toHaveBeenCalledWith("user-1", { occasion: "work" });
    expect(result).toEqual({ outfitId: "outfit-1", name: "Work" });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/recommendations");
  });

  it("rejects unknown occasions", async () => {
    await expect(
      getTodayLookAction({ occasion: "yolo" as never })
    ).rejects.toThrow();
    expect(recServerMocks.getTodayLook).not.toHaveBeenCalled();
  });

  it("getLatestLookAction returns the latest outfit without AI", async () => {
    recServerMocks.getLatestLook.mockResolvedValue({ outfitId: "outfit-1" });
    const result = await getLatestLookAction();
    expect(result).toEqual({ outfitId: "outfit-1" });
  });

  it("getLookDetailsAction resolves a full look", async () => {
    recServerMocks.getLookDetails.mockResolvedValue({ outfitId: "outfit-1" });
    const result = await getLookDetailsAction("00000000-0000-4000-8000-00000000000a");
    expect(recServerMocks.getLookDetails).toHaveBeenCalledWith("user-1", "00000000-0000-4000-8000-00000000000a");
    expect(result).toEqual({ outfitId: "outfit-1" });
  });

  it("getStyleMemoriesAction returns memories", async () => {
    recServerMocks.getStyleMemories.mockResolvedValue([{ id: "memory-1" }]);
    const result = await getStyleMemoriesAction();
    expect(result).toEqual([{ id: "memory-1" }]);
  });
});
