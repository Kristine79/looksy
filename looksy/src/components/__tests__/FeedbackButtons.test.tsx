import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FeedbackButtons } from "@/components/outfits/FeedbackButtons";
import { makeLook } from "@/test/fixtures";

const { loveOutfitActionMock, woreOutfitActionMock, changeItemActionMock, notForMeActionMock } =
  vi.hoisted(() => ({
    loveOutfitActionMock: vi.fn(),
    woreOutfitActionMock: vi.fn(),
    changeItemActionMock: vi.fn(),
    notForMeActionMock: vi.fn(),
  }));

vi.mock("@/modules/outfits/actions", () => ({
  loveOutfitAction: loveOutfitActionMock,
  woreOutfitAction: woreOutfitActionMock,
  changeItemAction: changeItemActionMock,
  notForMeAction: notForMeActionMock,
}));

describe("FeedbackButtons", () => {
  const look = makeLook();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all four feedback actions", () => {
    render(<FeedbackButtons look={look} />);
    expect(screen.getByText("Love")).toBeInTheDocument();
    expect(screen.getByText("Wore it")).toBeInTheDocument();
    expect(screen.getByText("Change item")).toBeInTheDocument();
    expect(screen.getByText("Not for me")).toBeInTheDocument();
  });

  it("records a save when Love is clicked", async () => {
    const onRecorded = vi.fn();
    loveOutfitActionMock.mockResolvedValue({ ok: true });
    render(<FeedbackButtons look={look} onRecorded={onRecorded} />);

    fireEvent.click(screen.getByText("Love"));
    await waitFor(() => {
      expect(loveOutfitActionMock).toHaveBeenCalledWith(look.outfitId);
      expect(onRecorded).toHaveBeenCalledWith("love");
    });
  });

  it("records wear with the look's item ids", async () => {
    woreOutfitActionMock.mockResolvedValue({ ok: true });
    render(<FeedbackButtons look={look} />);

    fireEvent.click(screen.getByText("Wore it"));
    await waitFor(() => {
      expect(woreOutfitActionMock).toHaveBeenCalledWith(
        look.outfitId,
        look.items.map((entry) => entry.item.id)
      );
    });
  });

  it("regenerates the look after Not for me", async () => {
    const onRegenerate = vi.fn().mockResolvedValue(makeLook());
    notForMeActionMock.mockResolvedValue({ ok: true });
    render(<FeedbackButtons look={look} onRegenerate={onRegenerate} />);

    fireEvent.click(screen.getByText("Not for me"));
    await waitFor(() => {
      expect(notForMeActionMock).toHaveBeenCalledWith(look.outfitId, {
        occasion: look.occasion ?? undefined,
      });
      expect(onRegenerate).toHaveBeenCalled();
    });
  });

  it("records a swap when the swap flow is confirmed", async () => {
    changeItemActionMock.mockResolvedValue({ ok: true });
    render(<FeedbackButtons look={look} />);

    fireEvent.click(screen.getByText("Change item"));
    await waitFor(() => {
      expect(screen.getByText(/Swap an item and I'll rebuild the look/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Swap and rebuild look"));
    await waitFor(() => {
      expect(changeItemActionMock).toHaveBeenCalledWith(
        look.outfitId,
        look.items[0]!.item.id,
        null
      );
    });
  });
});
