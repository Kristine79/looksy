import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OnboardingBanner } from "@/components/onboarding/OnboardingBanner";

const { completeOnboardingMock, loadDemoMock, refreshMock } = vi.hoisted(() => ({
  completeOnboardingMock: vi.fn(),
  loadDemoMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("@/modules/users/actions", () => ({
  completeOnboardingAction: completeOnboardingMock,
}));

vi.mock("@/modules/demo/actions", () => ({
  loadDemoWardrobeAction: loadDemoMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

describe("OnboardingBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the welcome message and three value steps", () => {
    render(<OnboardingBanner hasItems={false} />);

    expect(
      screen.getByText("Your personal stylist, learning your style.")
    ).toBeInTheDocument();
    expect(screen.getByText("Add your clothes")).toBeInTheDocument();
    expect(screen.getByText("I analyze them")).toBeInTheDocument();
    expect(screen.getByText("Looks improve over time")).toBeInTheDocument();
  });

  it("offers a demo wardrobe for an empty account", () => {
    render(<OnboardingBanner hasItems={false} />);

    expect(screen.getByText("Explore with a sample wardrobe")).toBeInTheDocument();
  });

  it("hides the demo button when the account already has items", () => {
    render(<OnboardingBanner hasItems={true} />);

    expect(screen.queryByText("Explore with a sample wardrobe")).not.toBeInTheDocument();
    expect(screen.getByText("Got it")).toBeInTheDocument();
  });

  it("loads the demo wardrobe and confirms on success", async () => {
    loadDemoMock.mockResolvedValue({ status: "loaded", itemCount: 6, outfitCount: 2, memoryCount: 2 });
    render(<OnboardingBanner hasItems={false} />);

    fireEvent.click(screen.getByText("Explore with a sample wardrobe"));

    await waitFor(() => {
      expect(loadDemoMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(
        screen.getByText("Sample wardrobe loaded. Check Wardrobe and Today's Look.")
      ).toBeInTheDocument();
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows a friendly error when the demo load fails", async () => {
    loadDemoMock.mockRejectedValue(new Error("boom"));
    render(<OnboardingBanner hasItems={false} />);

    fireEvent.click(screen.getByText("Explore with a sample wardrobe"));

    await waitFor(() => {
      expect(
        screen.getByText("Couldn't load the sample wardrobe right now. You can try again.")
      ).toBeInTheDocument();
    });
  });

  it("dismisses on start and never exposes technical errors", async () => {
    completeOnboardingMock.mockRejectedValue(new Error("db exploded"));
    render(<OnboardingBanner hasItems={true} />);

    fireEvent.click(screen.getByText("Got it"));

    await waitFor(() => {
      expect(completeOnboardingMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(
        screen.queryByText("Your personal stylist, learning your style.")
      ).not.toBeInTheDocument();
    });
  });
});
