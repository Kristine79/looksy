import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TodayLookExperience } from "@/components/recommendations/TodayLookExperience";
import type { LookItem } from "@/modules/recommendations/server";

const { getTodayLookActionMock } = vi.hoisted(() => ({
  getTodayLookActionMock: vi.fn(),
}));

vi.mock("@/modules/recommendations/actions", () => ({
  getTodayLookAction: getTodayLookActionMock,
}));

vi.mock("@/components/outfits/OutfitCard", () => ({
  OutfitCard: ({ look }: { look: { name: string } }) => <div>OutfitCard: {look.name}</div>,
}));

const emptyLook = {
  outfitId: "outfit-empty",
  name: "Today's Look",
  occasion: null,
  status: "generated",
  recommendation: {
    outfit: [],
    explanation: { whyChosen: "", styleMatch: "", contextMatch: "" },
    confidence: 0,
  },
  items: [],
  evidence: [],
  scores: null,
  model: "empty",
  createdAt: new Date(),
};

const lookWithItems = {
  ...emptyLook,
  outfitId: "outfit-1",
  name: "Work",
  items: [{ item: { id: "item-1", type: "top" } as unknown as LookItem["item"], photos: [] }],
};

describe("TodayLookExperience empty look guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an empty state instead of a broken outfit card when the look has 0 items", () => {
    render(
      <TodayLookExperience initialLook={emptyLook} wardrobeCount={0} swapCandidates={[]} />
    );

    expect(screen.getByText("Your wardrobe is empty")).toBeInTheDocument();
    expect(screen.queryByText(/OutfitCard/)).not.toBeInTheDocument();
  });

  it("renders the outfit card for a look with items", () => {
    render(
      <TodayLookExperience initialLook={lookWithItems} wardrobeCount={3} swapCandidates={[]} />
    );

    expect(screen.getByText("OutfitCard: Work")).toBeInTheDocument();
  });

  it("shows a friendly error and a retry action when generation fails", async () => {
    getTodayLookActionMock.mockResolvedValue({
      error: true,
      degraded: false,
      look: null,
      message: "We couldn't build a look right now. Please try again in a moment.",
    });
    render(<TodayLookExperience initialLook={null} wardrobeCount={3} swapCandidates={[]} />);

    fireEvent.click(screen.getByText("Generate my first look"));

    await waitFor(() => {
      expect(
        screen.getByText("We couldn't build a look right now. Please try again in a moment.")
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });
});
