import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HelpDialog } from "@/components/dashboard/HelpDialog";

describe("HelpDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the dialog with the guide title", () => {
    render(<HelpDialog open onClose={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: "How LOOKSY works" })).toBeInTheDocument();
  });

  it("opens the first section by default", () => {
    const { container } = render(<HelpDialog open onClose={vi.fn()} />);
    expect(screen.getByText(/photograph any piece/)).toBeInTheDocument();
    const panel = container.querySelector('[id="help-panel-0"]');
    expect(panel).not.toHaveAttribute("hidden");
  });

  it("collapses the open section on click", () => {
    const { container } = render(<HelpDialog open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Getting started" }));
    const panel = container.querySelector('[id="help-panel-0"]');
    expect(panel).toHaveAttribute("hidden");
  });

  it("expands another section on click", () => {
    const { container } = render(<HelpDialog open onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "How LOOKSY works" }));
    const panel = container.querySelector('[id="help-panel-1"]');
    expect(panel).not.toHaveAttribute("hidden");
    expect(screen.getByText(/Every piece starts as a photo/)).toBeInTheDocument();
  });

  it("describes every section title", () => {
    render(<HelpDialog open onClose={vi.fn()} />);
    const titles = [
      "Getting started",
      "How LOOKSY works",
      "Your Wardrobe",
      "Today's Look",
      "Teach LOOKSY",
      "Fashion Memory",
      "When analysis doesn't complete",
      "Demo wardrobe",
      "Your data",
    ];
    for (const title of titles) {
      expect(screen.getByRole("button", { name: title })).toBeInTheDocument();
    }
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(<HelpDialog open onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on the X button", () => {
    const onClose = vi.fn();
    render(<HelpDialog open onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("does not render anything when closed", () => {
    const { container } = render(<HelpDialog open={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps the header outside the scrollable content area", () => {
    const { container } = render(<HelpDialog open onClose={vi.fn()} />);
    const panel = screen.getByRole("dialog");
    const scrollArea = container.querySelector(".overflow-y-auto");
    expect(scrollArea).not.toBeNull();
    expect(scrollArea!.querySelector("header")).toBeNull();
    expect(panel.querySelector("header")).not.toBeNull();
    expect(panel.classList.contains("overflow-hidden")).toBe(true);
  });
});
