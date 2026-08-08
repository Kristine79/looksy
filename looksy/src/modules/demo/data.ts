/**
 * Demo content definitions — sample wardrobe used by the "Load demo wardrobe"
 * onboarding path. Kept fully local: photos are SVG data URLs and item
 * embeddings are deterministic, so the demo works without any AI provider.
 *
 * This is intentionally a compact set (unlike the full `npm run db:seed`
 * dataset) — enough to show wardrobe, Today's Look, Trust Layer and Fashion
 * Memory within a minute.
 */

export const EMBEDDING_DIMENSIONS = 1536;

export interface DemoItemDef {
  type: string;
  subType: string | null;
  brand: string;
  material: string;
  pattern: string;
  colors: Array<{ name: string; hex: string; dominance: number }>;
  seasons: string[];
  formality: number;
  hex: string;
  notes: string | null;
}

export const DEMO_ITEMS: DemoItemDef[] = [
  {
    type: "top",
    subType: "oxford shirt",
    brand: "Uniqlo",
    material: "cotton",
    pattern: "solid",
    colors: [{ name: "White", hex: "#F4F4F4", dominance: 1 }],
    seasons: ["all"],
    formality: 4,
    hex: "#E8E6E3",
    notes: "Wardrobe staple — pairs with everything",
  },
  {
    type: "outerwear",
    subType: "blazer",
    brand: "COS",
    material: "wool blend",
    pattern: "solid",
    colors: [{ name: "Navy", hex: "#1F2A44", dominance: 1 }],
    seasons: ["autumn", "winter", "spring"],
    formality: 5,
    hex: "#232F4B",
    notes: "Structured piece for meetings",
  },
  {
    type: "bottom",
    subType: "slim jeans",
    brand: "Levi's",
    material: "denim",
    pattern: "solid",
    colors: [{ name: "Dark Blue", hex: "#2B3A55", dominance: 1 }],
    seasons: ["all"],
    formality: 3,
    hex: "#34405A",
    notes: null,
  },
  {
    type: "knitwear",
    subType: "crewneck sweater",
    brand: "Muji",
    material: "merino wool",
    pattern: "solid",
    colors: [{ name: "Grey", hex: "#8A8F98", dominance: 1 }],
    seasons: ["autumn", "winter"],
    formality: 2,
    hex: "#7C828C",
    notes: "Favorite weekend layer",
  },
  {
    type: "bottom",
    subType: "chinos",
    brand: "Everlane",
    material: "cotton twill",
    pattern: "solid",
    colors: [{ name: "Beige", hex: "#C8B49A", dominance: 1 }],
    seasons: ["all"],
    formality: 3,
    hex: "#C4B093",
    notes: null,
  },
  {
    type: "shoes",
    subType: "leather shoes",
    brand: "Clarks",
    material: "leather",
    pattern: "solid",
    colors: [{ name: "Brown", hex: "#6B4A2F", dominance: 1 }],
    seasons: ["all"],
    formality: 4,
    hex: "#6E4E32",
    notes: "Goes with chinos and jeans",
  },
];

export interface DemoOutfitDef {
  name: string;
  occasion: string | null;
  explanation: string;
  itemIndexes: number[];
  evidence: Array<{ type: string; text: string }>;
}

export const DEMO_OUTFITS: DemoOutfitDef[] = [
  {
    name: "Weekend Casual",
    occasion: "casual",
    explanation:
      "A relaxed weekend look: the grey merino sweater keeps it soft, dark slim jeans anchor the silhouette, and brown leather shoes ground the outfit.",
    itemIndexes: [3, 2, 5],
    evidence: [
      { type: "color_harmony", text: "Grey, dark blue and brown form a low-contrast, harmonious palette." },
      { type: "style_pattern", text: "You tend to reach for knitwear on weekends." },
    ],
  },
  {
    name: "Meeting Ready",
    occasion: "work",
    explanation:
      "Structured and clean: the white oxford shirt under a navy blazer signals formality, beige chinos keep it modern, and leather shoes finish the look.",
    itemIndexes: [0, 1, 4, 5],
    evidence: [
      { type: "style_pattern", text: "Structured pieces appear in your most-worn outfits." },
      { type: "color_harmony", text: "Navy, white and beige — a classic neutral combination." },
    ],
  },
];

export interface DemoMemoryDef {
  type: "color_preference" | "style_tendency" | "context_preference" | "brand_preference";
  category: string;
  description: string;
  confidence: number;
  consistency: number;
  dataPoints: number;
  source: "behavioral" | "explicit";
  confirmed: boolean;
  evidence: Array<{
    type:
      | "worn_frequency"
      | "saved_preference"
      | "style_pattern"
      | "color_harmony"
      | "outfit_feedback"
      | "user_edit";
    text: string;
    sourceType: "wear_log" | "outfit_feedback" | "outfit" | "item" | "user_edit";
  }>;
}

export const DEMO_MEMORIES: DemoMemoryDef[] = [
  {
    type: "color_preference",
    category: "palette",
    description: "You tend to choose neutral, versatile pieces",
    confidence: 0.82,
    consistency: 0.8,
    dataPoints: 6,
    source: "behavioral",
    confirmed: true,
    evidence: [
      { type: "style_pattern", text: "5 of 6 wardrobe items are in neutral tones.", sourceType: "item" },
      { type: "saved_preference", text: "Saved looks all share a neutral palette.", sourceType: "outfit_feedback" },
    ],
  },
  {
    type: "style_tendency",
    category: "formality",
    description: "Structured pieces dominate your wardrobe",
    confidence: 0.6,
    consistency: 0.66,
    dataPoints: 4,
    source: "behavioral",
    confirmed: false,
    evidence: [
      { type: "style_pattern", text: "3 of 6 wardrobe items are structured (blazer, oxford shirt, leather shoes).", sourceType: "item" },
    ],
  },
];

/** SVG placeholder photo as a data URL — demo wardrobe stays fully local. */
export function demoPhoto(hex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="${hex}"/><rect x="100" y="100" width="400" height="400" rx="32" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="6"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

/** Deterministic normalized vector — same seed always yields the same embedding. */
export function makeDemoVector(seed: number): number[] {
  let state = seed >>> 0;
  const vector: number[] = [];
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    state = (state * 1664525 + 1013904223) >>> 0;
    vector.push((state % 1000) / 1000 - 0.5);
  }
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return vector.map((value) => value / norm);
}
