import { describe, expect, it } from "vitest";
import { PromptBuilder } from "./promptBuilder";
import type { RecommendationContext } from "./types";
import type { ClothingItemRow } from "@/modules/closet/types";
import type { UserStyleContext } from "@/modules/recommendations/types";

const ITEM: ClothingItemRow = {
  id: "item-1",
  userId: "user-1",
  type: "shirt",
  subType: "oxford",
  brand: "Uniqlo",
  material: "cotton",
  pattern: "solid",
  colors: [{ name: "navy", hex: "#000080", dominance: 1 }],
  seasons: ["spring", "autumn"],
  formality: 3,
  condition: "good",
  status: "active",
  wearCount: 5,
  lastWorn: new Date("2026-07-01"),
  notes: null,
  aiStatus: "completed",
  aiConfidence: 0.9,
  aiModelVersion: "gpt-4o-mini",
  aiPayload: null,
  aiError: null,
  aiProcessedAt: new Date("2026-07-01"),
  metadata: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

function createContext(overrides: Partial<RecommendationContext> = {}): RecommendationContext {
  const style: UserStyleContext = {
    userId: "user-1",
    wardrobe: [ITEM],
    recentOutfits: [
      {
        id: "outfit-1",
        userId: "user-1",
        name: "Office look",
        source: "ai",
        status: "saved",
        occasion: "work",
        mood: null,
        weather: null,
        explanation: null,
        scores: null,
        evidence: null,
        generationContext: null,
        createdAt: new Date("2026-07-02"),
        updatedAt: new Date("2026-07-02"),
      },
    ],
    wearHistory: [],
    feedback: [
      { action: "wear", rating: 4, createdAt: new Date("2026-07-03") },
      { action: "save", rating: 3, createdAt: new Date("2026-07-04") },
    ],
    memories: [
      {
        id: "memory-1",
        userId: "user-1",
        type: "color_preference",
        category: "colors",
        description: "You prefer earth tones",
        confidence: 0.8,
        status: "confirmed",
        dataPoints: 10,
        consistency: 0.9,
        source: "behavioral",
        lastSignalAt: null,
        lastConfirmed: new Date("2026-06-01"),
        lastInfluenced: null,
        userConfirmedAt: new Date("2026-06-01"),
        userCorrectedAt: null,
        correctionText: null,
        deletedAt: null,
        createdAt: new Date("2026-06-01"),
        updatedAt: new Date("2026-06-01"),
      },
    ],
    styleProfile: {
      userId: "user-1",
      styleVec: new Array(1536).fill(0.01),
      dna: {
        primaryDirection: "minimal",
        colors: [
          { name: "navy", share: 0.4 },
          { name: "beige", share: 0.3 },
        ],
        formalityByOccasion: { work: 3 },
      },
      itemsAnalyzed: 12,
      outfitsAnalyzed: 4,
      model: "text-embedding-3-small",
      computedAt: new Date("2026-06-01"),
      createdAt: new Date("2026-06-01"),
      updatedAt: new Date("2026-06-01"),
    },
  };

  return {
    query: "What to wear to a business meeting?",
    occasion: "business meeting",
    weather: { tempC: 18, condition: "light rain", humidity: 70 },
    style,
    candidates: [ITEM],
    ...overrides,
  };
}

describe("PromptBuilder.buildEvidence", () => {
  it("derives palette, ratings, saved outfits, memories and worn items as facts", () => {
    const evidence = new PromptBuilder().buildEvidence(createContext());

    expect(evidence).toContain("Preferred color palette: navy, beige");
    expect(evidence.some((e) => e.includes("Most worn items") && e.includes("worn 5x"))).toBe(true);
    expect(evidence.some((e) => e.includes("Based on your saved outfits"))).toBe(true);
    expect(evidence.some((e) => e.includes("Average outfit rating: 3.5/4"))).toBe(true);
    expect(evidence.some((e) => e.includes("You prefer earth tones"))).toBe(true);
  });

  it("returns empty list when there is no user data", () => {
    const context = createContext();
    context.style.feedback = [];
    context.style.memories = [];
    context.style.styleProfile = null;
    context.style.recentOutfits = [];
    context.style.wardrobe = [{ ...ITEM, wearCount: 0, lastWorn: null }];

    expect(new PromptBuilder().buildEvidence(context)).toEqual([]);
  });
});

describe("PromptBuilder.buildSystemPrompt", () => {
  it("forbids generic advice and demands JSON only", () => {
    const { systemPrompt } = new PromptBuilder().build(createContext());

    expect(systemPrompt).toContain("Never suggest buying");
    expect(systemPrompt).toContain("Return ONLY a valid JSON object");
    expect(systemPrompt).toContain("exact itemId");
    expect(systemPrompt).toContain("Verified evidence about this user");
  });

  it("includes evidence facts in the system prompt", () => {
    const { systemPrompt } = new PromptBuilder().build(createContext());
    expect(systemPrompt).toContain("Preferred color palette: navy, beige");
  });
});

describe("PromptBuilder.buildUserPrompt", () => {
  it("includes request, occasion, weather and every candidate itemId", () => {
    const { userPrompt } = new PromptBuilder().build(createContext());

    expect(userPrompt).toContain("What to wear to a business meeting?");
    expect(userPrompt).toContain("Occasion: business meeting");
    expect(userPrompt).toContain("18°C");
    expect(userPrompt).toContain("itemId=item-1");
    expect(userPrompt).toContain("Pick 2-6 items");
  });

  it("handles missing occasion and weather", () => {
    const context = createContext({ occasion: null, weather: null });
    const { userPrompt } = new PromptBuilder().build(context);

    expect(userPrompt).toContain("Occasion: not specified");
    expect(userPrompt).toContain("Weather: not specified");
  });
});

describe("PromptBuilder.buildExplanationPrompt", () => {
  it("focuses on the selected items and keeps evidence", () => {
    const builder = new PromptBuilder();
    const context = createContext();
    const { systemPrompt, userPrompt } = builder.buildExplanationPrompt(context, ["item-1"]);

    expect(systemPrompt).toContain("why a specific set of items works");
    expect(userPrompt).toContain("itemId=item-1");
    expect(userPrompt).toContain("Preferred color palette: navy, beige");
  });

  it("marks itemIds that are not in the provided wardrobe", () => {
    const context = createContext();
    const { userPrompt } = new PromptBuilder().buildExplanationPrompt(context, [
      "item-1",
      "unknown-id",
    ]);

    expect(userPrompt).toContain("not in the provided wardrobe: unknown-id");
  });
});
