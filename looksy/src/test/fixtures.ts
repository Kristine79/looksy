import type { WardrobeItemWithPhotos, ClothingItemRow } from "@/modules/closet";
import type { FashionMemoryRow } from "@/modules/recommendations";
import type { TodayLookResult, LookItem } from "@/modules/recommendations/server";

export const UUID = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;

export function makeClothingItem(overrides: Partial<ClothingItemRow> = {}): ClothingItemRow {
  return {
    id: UUID(1),
    userId: "user-1",
    type: "shirt",
    subType: "button-down",
    brand: "Uniqlo",
    material: "cotton",
    pattern: "solid",
    colors: [{ name: "white", hex: "#FFFFFF", dominance: 0.9 }],
    seasons: ["spring"],
    formality: 3,
    condition: "good",
    status: "active",
    wearCount: 2,
    lastWorn: new Date("2026-08-01T10:00:00Z"),
    notes: null,
    aiStatus: "completed",
    aiConfidence: 0.92,
    aiModelVersion: "gpt-4o-mini",
    aiPayload: null,
    aiError: null,
    aiProcessedAt: new Date("2026-08-01T10:00:00Z"),
    metadata: null,
    createdAt: new Date("2026-08-01T10:00:00Z"),
    updatedAt: new Date("2026-08-01T10:00:00Z"),
    ...overrides,
  };
}

export function makeWardrobeItem(
  overrides: Partial<ClothingItemRow> = {}
): WardrobeItemWithPhotos {
  const item = makeClothingItem(overrides);
  return {
    ...item,
    photos: [
      {
        id: UUID(9),
        itemId: item.id,
        url: `https://storage.looksy.app/demo/${item.id}.jpg`,
        thumbnailUrl: `https://storage.looksy.app/demo/${item.id}-thumb.jpg`,
        storagePath: null,
        isPrimary: true,
        sortOrder: 0,
        metadata: null,
        createdAt: new Date("2026-08-01T10:00:00Z"),
      },
    ],
  };
}

export function makeLookItem(overrides: Partial<LookItem> = {}): LookItem {
  const item = makeClothingItem(overrides.item ? { ...overrides.item } : {});
  return {
    item,
    photos: [
      {
        url: `https://storage.looksy.app/demo/${item.id}.jpg`,
        thumbnailUrl: null,
        storagePath: null,
      },
    ],
    ...overrides,
  };
}

export function makeLook(overrides: Partial<TodayLookResult> = {}): TodayLookResult {
  const items = [makeLookItem({ item: makeClothingItem({ type: "shirt" }) })];
  return {
    outfitId: UUID(2),
    name: "Work",
    occasion: "work",
    status: "generated",
    recommendation: {
      outfit: [{ itemId: UUID(1), reason: "Matches your preferred palette" }],
      explanation: {
        whyChosen: "Navy oxford with olive chinos — a combination you have saved before.",
        styleMatch: "Matches your neutral palette",
        contextMatch: "Fits a work occasion",
      },
      confidence: 0.87,
    },
    items,
    evidence: [
      { type: "user_data", text: "Preferred color palette: navy, olive, cream", source: "style_context" },
      { type: "user_data", text: "Based on your saved outfits: 2 saved", source: "style_context" },
    ],
    scores: { total: 0.87 },
    model: "gpt-4o",
    createdAt: new Date("2026-08-07T10:00:00Z"),
    ...overrides,
  };
}

export function makeMemory(overrides: Partial<FashionMemoryRow> = {}): FashionMemoryRow {
  return {
    id: UUID(3),
    userId: "user-1",
    type: "color_preference",
    category: "earth_tones",
    description: "You tend to choose earth tones",
    confidence: 0.82,
    status: "confirmed",
    dataPoints: 23,
    consistency: 0.9,
    source: "behavioral",
    lastSignalAt: new Date("2026-08-01T10:00:00Z"),
    lastConfirmed: new Date("2026-07-20T10:00:00Z"),
    lastInfluenced: null,
    userConfirmedAt: null,
    userCorrectedAt: null,
    correctionText: null,
    deletedAt: null,
    createdAt: new Date("2026-07-01T10:00:00Z"),
    updatedAt: new Date("2026-08-01T10:00:00Z"),
    ...overrides,
  };
}
