import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ItemDetailsDrawer } from "@/components/clothing/ItemDetailsDrawer";
import { makeWardrobeItem } from "@/test/fixtures";

const { reprocessItemActionMock, archiveItemFormActionMock, refreshMock } = vi.hoisted(() => ({
  reprocessItemActionMock: vi.fn(),
  archiveItemFormActionMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/modules/closet/actions", () => ({
  reprocessItemAction: reprocessItemActionMock,
  archiveItemFormAction: archiveItemFormActionMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

describe("ItemDetailsDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the full item record for a completed item", () => {
    render(
      <ItemDetailsDrawer
        item={makeWardrobeItem({
          material: "cotton",
          pattern: "solid",
          notes: "favourite jeans",
        })}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Shirt")).toBeInTheDocument();
    expect(screen.getByText("Uniqlo")).toBeInTheDocument();
    expect(screen.getByText("Cotton")).toBeInTheDocument();
    expect(screen.getByText("Solid")).toBeInTheDocument();
    expect(screen.getByText("favourite jeans")).toBeInTheDocument();
    expect(screen.getByText("White")).toBeInTheDocument();
    expect(screen.getByText(/AI verified · 92%/)).toBeInTheDocument();
    expect(screen.getByText("Aug 1, 2026")).toBeInTheDocument();
  });

  it("shows a category fallback for unknown types without placeholders", () => {
    render(
      <ItemDetailsDrawer
        item={makeWardrobeItem({ type: "unknown", subType: null })}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText("Category")).not.toBeInTheDocument();
    expect(screen.queryByText("Unknown")).not.toBeInTheDocument();
  });

  it("omits rows for missing fields instead of showing placeholders", () => {
    render(
      <ItemDetailsDrawer
        item={makeWardrobeItem({ brand: null, notes: null, material: null, pattern: null, colors: [] })}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByText("Brand")).not.toBeInTheDocument();
    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
    expect(screen.queryByText("Material")).not.toBeInTheDocument();
    expect(screen.queryByText("Pattern")).not.toBeInTheDocument();
    expect(screen.queryByText("Unknown")).not.toBeInTheDocument();
    expect(screen.getByText("Added")).toBeInTheDocument();
    expect(screen.getByText(/AI verified/)).toBeInTheDocument();
  });

  it("shows the photo without stretching it", () => {
    render(<ItemDetailsDrawer item={makeWardrobeItem()} onClose={vi.fn()} />);
    const img = screen.getByRole("img", { name: "Button-down photo" });
    expect(img).toHaveAttribute("src", "https://storage.looksy.app/demo/00000000-0000-4000-8000-000000000001.jpg");
    expect(img.className).toContain("object-contain");
  });

  it("offers re-analysis for a failed item and reports the outcome", async () => {
    reprocessItemActionMock.mockResolvedValue({ status: "completed", itemId: "00000000-0000-4000-8000-000000000001" });
    render(
      <ItemDetailsDrawer
        item={makeWardrobeItem({ aiStatus: "failed", aiError: "boom" })}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Re-analyze item" }));

    await waitFor(() => {
      expect(reprocessItemActionMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001");
      expect(screen.getByText("Analysis complete.")).toBeInTheDocument();
    });
  });

  it("does not offer re-analysis for completed items", () => {
    render(<ItemDetailsDrawer item={makeWardrobeItem()} onClose={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Re-analyze item" })).not.toBeInTheDocument();
  });

  it("does not offer re-analysis when the item has no photo", () => {
    render(
      <ItemDetailsDrawer
        item={{ ...makeWardrobeItem({ aiStatus: "failed", aiError: "boom" }), photos: [] }}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: "Re-analyze item" })).not.toBeInTheDocument();
  });

  it("removes the item through the existing archive action and closes", async () => {
    archiveItemFormActionMock.mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<ItemDetailsDrawer item={makeWardrobeItem()} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Remove from wardrobe" }));

    await waitFor(() => {
      expect(archiveItemFormActionMock).toHaveBeenCalledWith("00000000-0000-4000-8000-000000000001");
      expect(onClose).toHaveBeenCalled();
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(<ItemDetailsDrawer item={makeWardrobeItem()} onClose={onClose} />);

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on the X button", () => {
    const onClose = vi.fn();
    render(<ItemDetailsDrawer item={makeWardrobeItem()} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("reserves a quiet future place for looks with this item", () => {
    render(<ItemDetailsDrawer item={makeWardrobeItem()} onClose={vi.fn()} />);
    expect(screen.getByText("Looks with this item — coming soon")).toBeInTheDocument();
  });
});
