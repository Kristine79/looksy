import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EvidenceBadge, evidenceIcon } from "@/components/outfits/EvidenceBadge";

describe("EvidenceBadge", () => {
  it("renders the evidence text", () => {
    render(<EvidenceBadge text="You wore navy blazers 14 times" />);
    expect(screen.getByText("You wore navy blazers 14 times")).toBeInTheDocument();
  });

  it("maps keywords to icons", () => {
    expect(evidenceIcon("Preferred color palette: navy").icon).toBe("🎨");
    expect(evidenceIcon("Most worn items: shirt — worn 5x").icon).toBe("⏱️");
    expect(evidenceIcon("Based on your saved outfits: 3 saved").icon).toBe("⭐");
    expect(evidenceIcon("Weather: 18°C, partly cloudy").icon).toBe("🌤️");
    expect(evidenceIcon("Your feedback actions: save ×1").icon).toBe("👍");
    expect(evidenceIcon("Learned from your history: earth tones").icon).toBe("🧠");
    expect(evidenceIcon("Some generic fact").icon).toBe("✓");
  });
});
