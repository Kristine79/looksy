import { describe, it, expect, vi, beforeEach } from "vitest";

const { getCurrentUserIdMock, revalidatePathMock, feedbackMocks } = vi.hoisted(() => ({
  getCurrentUserIdMock: vi.fn().mockResolvedValue("user-1"),
  revalidatePathMock: vi.fn(),
  feedbackMocks: {
    recordSave: vi.fn(),
    recordWear: vi.fn(),
    recordSwap: vi.fn(),
    recordSkip: vi.fn(),
  },
}));

vi.mock("@/modules/auth/server", () => ({
  getCurrentUserId: getCurrentUserIdMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/db/client", () => ({ db: {} }));

vi.mock("@/modules/outfits", () => ({
  OutfitsRepository: class {},
  FeedbackService: class {
    recordSave = feedbackMocks.recordSave;
    recordWear = feedbackMocks.recordWear;
    recordSwap = feedbackMocks.recordSwap;
    recordSkip = feedbackMocks.recordSkip;
  },
}));

import {
  changeItemAction,
  loveOutfitAction,
  notForMeAction,
  woreOutfitAction,
} from "@/modules/outfits/actions";

const OUTFIT_ID = "00000000-0000-4000-8000-00000000000a";
const ITEM_1 = "00000000-0000-4000-8000-00000000000b";
const ITEM_2 = "00000000-0000-4000-8000-00000000000c";

describe("feedback actions (Feedback Loop)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loveOutfitAction records a save signal", async () => {
    feedbackMocks.recordSave.mockResolvedValue({ id: "feedback-1" });
    const result = await loveOutfitAction(OUTFIT_ID);
    expect(feedbackMocks.recordSave).toHaveBeenCalledWith("user-1", { outfitId: OUTFIT_ID });
    expect(result).toEqual({ ok: true });
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/recommendations");
  });

  it("woreOutfitAction records a wear signal with item ids", async () => {
    feedbackMocks.recordWear.mockResolvedValue({ id: "wear-1" });
    await woreOutfitAction(OUTFIT_ID, [ITEM_1, ITEM_2]);
    expect(feedbackMocks.recordWear).toHaveBeenCalledWith("user-1", {
      outfitId: OUTFIT_ID,
      itemIds: [ITEM_1, ITEM_2],
      source: "recommendation",
    });
  });

  it("changeItemAction records a swap signal", async () => {
    feedbackMocks.recordSwap.mockResolvedValue({ id: "feedback-2" });
    await changeItemAction(OUTFIT_ID, ITEM_1, ITEM_2);
    expect(feedbackMocks.recordSwap).toHaveBeenCalledWith("user-1", {
      outfitId: OUTFIT_ID,
      swapOutItemId: ITEM_1,
      swapInItemId: ITEM_2,
    });
  });

  it("notForMeAction records a skip signal", async () => {
    feedbackMocks.recordSkip.mockResolvedValue({ id: "feedback-3" });
    await notForMeAction(OUTFIT_ID);
    expect(feedbackMocks.recordSkip).toHaveBeenCalledWith("user-1", { outfitId: OUTFIT_ID });
  });

  it("rejects malformed ids", async () => {
    await expect(loveOutfitAction("not-a-uuid")).rejects.toThrow();
    expect(feedbackMocks.recordSave).not.toHaveBeenCalled();
  });
});
