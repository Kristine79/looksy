import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EvidenceList, evidenceIcon } from "@/components/outfits/EvidenceList";

describe("EvidenceList", () => {
  it("renders the reason text", () => {
    render(<EvidenceList items={["You wore navy blazers 14 times"]} />);
    expect(screen.getByText("You wore navy blazers 14 times")).toBeInTheDocument();
  });

  it("renders the section heading", () => {
    render(<EvidenceList items={["A reason"]} />);
    expect(screen.getByText("Why this works")).toBeInTheDocument();
  });

  it("maps keywords to icons", () => {
    expect(evidenceIcon("Preferred color palette: navy")).toBe("sparkle");
    expect(evidenceIcon("Most worn items: shirt — worn 5x")).toBe("shirt");
    expect(evidenceIcon("Based on your saved outfits: 3 saved")).toBe("heart");
    expect(evidenceIcon("Weather: 18°C, partly cloudy")).toBe("tag");
    expect(evidenceIcon("Your feedback actions: save ×1")).toBe("tag");
    expect(evidenceIcon("Learned from your history: earth tones")).toBe("tag");
    expect(evidenceIcon("Some generic fact")).toBe("check");
  });
});