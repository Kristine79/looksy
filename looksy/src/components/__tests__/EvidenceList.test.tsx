import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EvidenceList, evidenceIcon } from "@/components/outfits/EvidenceList";
import type { EvidenceItem } from "@/modules/outfits";

function legacy(text: string): EvidenceItem {
  return { type: "user_data", text, source: "style_context", confidence: 0.9 };
}

describe("EvidenceList", () => {
  it("renders the legacy reason text", () => {
    render(<EvidenceList items={[legacy("You wore navy blazers 14 times")]} />);
    expect(screen.getByText("You wore navy blazers 14 times")).toBeInTheDocument();
  });

  it("renders the section heading", () => {
    render(<EvidenceList items={[legacy("A reason")]} />);
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

  it("localizes structured evidence via key + params", () => {
    render(
      <EvidenceList
        items={[
          {
            type: "user_data",
            text: "Most worn items: shirt (oxford) — worn 5x",
            key: "mostWorn",
            params: { items: [{ type: "shirt", subType: "oxford", wearCount: 5 }] },
            source: "style_context",
            confidence: 0.9,
          },
        ]}
      />
    );
    expect(screen.getByText(/Most worn items: Shirt \(Oxford\) — 5×/)).toBeInTheDocument();
  });

  it("renders formality evidence as object entries", () => {
    render(
      <EvidenceList
        items={[
          {
            type: "user_data",
            text: "Formality per occasion: work=3/5, weekend=2/5",
            key: "formality",
            params: {
              entries: [
                { occasion: "work", level: "3/5" },
                { occasion: "weekend", level: "2/5" },
              ],
            },
            source: "style_context",
            confidence: 0.9,
          },
        ]}
      />
    );
    expect(screen.getByText(/Formality per occasion:.*work=3\/5.*weekend=2\/5/)).toBeInTheDocument();
  });

  it("normalizes legacy tuple formality entries from persisted data", () => {
    render(
      <EvidenceList
        items={[
          {
            type: "user_data",
            text: "Formality per occasion: work=3/5",
            key: "formality",
            params: { entries: [["work", "3/5"]] },
            source: "style_context",
          },
        ]}
      />
    );
    expect(screen.getByText(/Formality per occasion:.*work=3\/5/)).toBeInTheDocument();
  });
});