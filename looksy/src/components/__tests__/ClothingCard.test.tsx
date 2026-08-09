import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClothingCard } from "@/components/clothing/ClothingCard";
import { makeWardrobeItem } from "@/test/fixtures";

vi.mock("@/modules/closet/actions", () => ({
  retryItemFormAction: vi.fn(),
  archiveItemFormAction: vi.fn(),
}));

describe("ClothingCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the item type and brand for a completed item", () => {
    render(<ClothingCard item={makeWardrobeItem()} />);
    expect(screen.getByText("Shirt")).toBeInTheDocument();
    expect(screen.getByText("Uniqlo")).toBeInTheDocument();
    expect(screen.getByText(/AI verified/)).toBeInTheDocument();
  });

  it("shows confidence in the AI status badge", () => {
    render(<ClothingCard item={makeWardrobeItem()} />);
    expect(screen.getByText(/AI verified · 92%/)).toBeInTheDocument();
  });

  it("shows the analyzing state for pending items", () => {
    render(<ClothingCard item={makeWardrobeItem({ aiStatus: "processing" })} />);
    expect(screen.getByText(/LOOKSY is analyzing/)).toBeInTheDocument();
    expect(screen.getByText("Analyzing item…")).toBeInTheDocument();
  });

  it("offers a retry action when analysis failed", () => {
    render(<ClothingCard item={makeWardrobeItem({ aiStatus: "failed", aiError: "boom" })} />);
    expect(screen.getByText("Re-analyze item")).toBeInTheDocument();
    expect(screen.getByText(/Analysis failed/)).toBeInTheDocument();
  });

  it("renders the photo", () => {
    render(<ClothingCard item={makeWardrobeItem()} />);
    const img = screen.getByRole("img", { name: "Shirt photo" });
    expect(img).toHaveAttribute("src", "https://storage.looksy.app/demo/00000000-0000-4000-8000-000000000001.jpg");
  });

  it("opens item details when the card is clicked", () => {
    const item = makeWardrobeItem();
    const onOpenDetails = vi.fn();
    render(<ClothingCard item={item} onOpenDetails={onOpenDetails} />);

    fireEvent.click(screen.getByRole("button", { name: "View details for Shirt" }));
    expect(onOpenDetails).toHaveBeenCalledWith(item);
  });

  it("announces the dialog affordance for keyboard and screen readers", () => {
    render(<ClothingCard item={makeWardrobeItem({ type: "dress" })} />);
    const trigger = screen.getByRole("button", { name: "View details for Dress" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  });
});
