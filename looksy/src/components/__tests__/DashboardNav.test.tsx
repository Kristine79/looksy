import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard/wardrobe",
}));

function mediaMock() {
  return {
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };
}

function renderNav() {
  return render(
    <ThemeProvider>
      <DashboardNav />
    </ThemeProvider>
  );
}

describe("DashboardNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("matchMedia", vi.fn(mediaMock));
  });

  it("opens the Help dialog from the header button", async () => {
    renderNav();
    fireEvent.click(screen.getByRole("button", { name: /help/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("renders the dialog OUTSIDE the sticky header (viewport overlay, not header-contained)", async () => {
    const { container } = renderNav();
    fireEvent.click(screen.getByRole("button", { name: /help/i }));
    const dialog = await screen.findByRole("dialog");
    const header = container.querySelector("header")!;
    expect(header).not.toBeNull();
    expect(header.contains(dialog)).toBe(false);
  });

  it("restores focus to the Help button after closing with Escape", async () => {
    renderNav();
    const trigger = screen.getByRole("button", { name: /help/i });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = await screen.findByRole("dialog");
    fireEvent.keyDown(dialog, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
    expect(trigger).toHaveFocus();
  });

  it("closes the dialog when clicking the backdrop", async () => {
    const { container } = renderNav();
    fireEvent.click(screen.getByRole("button", { name: /help/i }));
    await screen.findByRole("dialog");
    const overlay = container.querySelector(".animate-dialog-overlay")!;
    fireEvent.mouseDown(overlay);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });
});
