import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users, userPreferences } from "@/modules/users/schema";
import { clothingItems, itemPhotos } from "@/modules/closet/schema";
import { itemEmbeddings } from "@/modules/ai/schema";
import {
  outfits,
  outfitItems,
  wearLog,
  wearLogItems,
  outfitFeedback,
} from "@/modules/outfits/schema";
import { fashionMemories, memoryEvidence, userStyleProfiles } from "@/modules/recommendations/schema";
import { uuidv7 } from "@/lib/db/uuidv7";

const DEMO_CLERK_ID = "demo_user";
const DEMO_EMAIL = "demo@looksy.app";
const EMBEDDING_DIMENSIONS = 1536;

function makeVector(seed: number): number[] {
  let state = seed >>> 0;
  const vector: number[] = [];
  for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
    state = (state * 1664525 + 1013904223) >>> 0;
    vector.push((state % 1000) / 1000 - 0.5);
  }
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return vector.map((v) => v / norm);
}

async function seedUser() {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, DEMO_CLERK_ID))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Demo user already exists (${existing[0]!.id}). Skipping seed.`);
    return null;
  }

  const [user] = await db
    .insert(users)
    .values({
      id: uuidv7(),
      clerkUserId: DEMO_CLERK_ID,
      email: DEMO_EMAIL,
      name: "Demo User",
      location: { city: "San Francisco", lat: 37.7749, lon: -122.4194 },
    })
    .returning();

  await db.insert(userPreferences).values({
    userId: user!.id,
    stylePreferences: {
      aesthetics: ["minimal", "earthy"],
      formality: 3,
      colors: ["navy", "olive", "cream"],
      brands: [],
      silhouette: "relaxed",
    },
    quizCompleted: true,
  });

  return user!;
}

const ITEM_SEEDS = [
  {
    type: "shirt",
    subType: "button-down",
    brand: "Uniqlo",
    material: "cotton",
    pattern: "solid",
    colors: [
      { name: "white", hex: "#FFFFFF", dominance: 0.9 },
      { name: "off-white", hex: "#F5F5DC", dominance: 0.1 },
    ],
    seasons: ["spring", "summer", "fall"],
    formality: 3,
    notes: "Everyday office shirt",
  },
  {
    type: "pants",
    subType: "slim-fit",
    brand: "Levi's",
    material: "denim",
    pattern: "solid",
    colors: [{ name: "black", hex: "#000000", dominance: 1 }],
    seasons: ["fall", "winter", "spring"],
    formality: 2,
    notes: "Stretchy, very comfortable",
  },
  {
    type: "jacket",
    subType: "blazer",
    brand: "COS",
    material: "wool",
    pattern: "solid",
    colors: [{ name: "beige", hex: "#E8DCC8", dominance: 0.85 }],
    seasons: ["spring", "fall"],
    formality: 4,
    notes: "Smart casual blazer",
  },
  {
    type: "shoes",
    subType: "sneakers",
    brand: "Nike",
    material: "leather",
    pattern: "solid",
    colors: [{ name: "white", hex: "#FFFFFF", dominance: 1 }],
    seasons: ["spring", "summer", "fall"],
    formality: 1,
  },
  {
    type: "coat",
    subType: "wool overcoat",
    brand: "Massimo Dutti",
    material: "wool",
    pattern: "solid",
    colors: [{ name: "charcoal", hex: "#36454F", dominance: 0.95 }],
    seasons: ["fall", "winter"],
    formality: 4,
  },
  {
    type: "shirt",
    subType: "oxford",
    brand: "J.Crew",
    material: "cotton",
    pattern: "solid",
    colors: [{ name: "navy", hex: "#000080", dominance: 0.9 }],
    seasons: ["fall", "spring", "winter"],
    formality: 3,
  },
  {
    type: "pants",
    subType: "chinos",
    brand: "Everlane",
    material: "cotton",
    pattern: "solid",
    colors: [{ name: "olive", hex: "#708238", dominance: 0.9 }],
    seasons: ["spring", "summer", "fall"],
    formality: 3,
  },
  {
    type: "sweater",
    subType: "crew-neck",
    brand: "Uniqlo",
    material: "merino wool",
    pattern: "solid",
    colors: [{ name: "cream", hex: "#FFFDD0", dominance: 0.95 }],
    seasons: ["fall", "winter"],
    formality: 2,
  },
  {
    type: "jacket",
    subType: "denim jacket",
    brand: "Levi's",
    material: "denim",
    pattern: "solid",
    colors: [{ name: "blue", hex: "#3B5998", dominance: 0.9 }],
    seasons: ["spring", "fall"],
    formality: 2,
  },
  {
    type: "shoes",
    subType: "loafers",
    brand: "Loake",
    material: "leather",
    pattern: "solid",
    colors: [{ name: "brown", hex: "#654321", dominance: 1 }],
    seasons: ["spring", "summer", "fall"],
    formality: 4,
  },
  {
    type: "accessory",
    subType: "leather belt",
    brand: "Everlane",
    material: "leather",
    pattern: "solid",
    colors: [{ name: "brown", hex: "#654321", dominance: 1 }],
    seasons: ["spring", "summer", "fall", "winter"],
    formality: 3,
  },
  {
    type: "dress",
    subType: "midi dress",
    brand: "COS",
    material: "linen",
    pattern: "striped",
    colors: [
      { name: "navy", hex: "#000080", dominance: 0.6 },
      { name: "white", hex: "#FFFFFF", dominance: 0.4 },
    ],
    seasons: ["spring", "summer"],
    formality: 3,
  },
];

async function seedCloset(userId: string) {
  const items = [];
  for (let i = 0; i < ITEM_SEEDS.length; i++) {
    const seed = ITEM_SEEDS[i]!;
    const [item] = await db
      .insert(clothingItems)
      .values({
        id: uuidv7(),
        userId,
        type: seed.type,
        subType: seed.subType,
        brand: seed.brand,
        material: seed.material,
        pattern: seed.pattern,
        colors: seed.colors.map((c) => ({ ...c })),
        seasons: [...seed.seasons],
        formality: seed.formality,
        notes: "notes" in seed ? seed.notes : undefined,
        aiStatus: "completed",
        aiConfidence: 0.92,
        aiModelVersion: "gpt-4o-v1",
        aiProcessedAt: new Date(),
        aiPayload: { type: seed.type, confidence: 0.92 },
        metadata: { fit: "regular" },
      })
      .returning();

    const itemId = item!.id;
    items.push(item!);

    await db.insert(itemPhotos).values({
      id: uuidv7(),
      itemId,
      url: `https://storage.looksy.app/demo/${itemId}.jpg`,
      thumbnailUrl: `https://storage.looksy.app/demo/${itemId}-thumb.jpg`,
      storagePath: `demo/${itemId}.jpg`,
      isPrimary: true,
      sortOrder: 0,
    });

    await db.insert(itemEmbeddings).values({
      id: uuidv7(),
      itemId,
      userId,
      embedding: makeVector(i + 1),
      textRepr: `${seed.colors[0]!.name} ${seed.material} ${seed.type} ${seed.pattern}`,
      model: "text-embedding-3-small",
      dimension: EMBEDDING_DIMENSIONS,
    });
  }
  return items;
}

interface OutfitSeedDef {
  name: string;
  occasion: string;
  mood?: string;
  source: "ai" | "manual";
  status: "generated" | "saved" | "archived" | "dismissed";
  weather: { tempC: number; condition: string; humidity?: number };
  explanation: string;
  scores?: {
    colorHarmony: number;
    styleCoherence: number;
    weatherFit: number;
    rotationScore: number;
    total: number;
  };
  evidence?: Array<{
    type: string;
    text: string;
    source: string;
    confidence?: number;
  }>;
  generationContext?: { candidatesCount?: number; model?: string; promptVersion?: string };
  itemPositions: Array<{ item: Awaited<ReturnType<typeof seedCloset>>[number]; position: number }>;
}

interface MemorySeedDef {
  type: string;
  category: string;
  description: string;
  confidence: number;
  status: string;
  dataPoints: number;
  consistency: number;
  source: string;
  lastSignalAt: Date;
  lastConfirmed?: Date;
  evidence: Array<{
    type: string;
    text: string;
    sourceType: string;
    data?: Record<string, unknown>;
  }>;
}

async function seedOutfits(userId: string, items: Awaited<ReturnType<typeof seedCloset>>) {
  const [whiteShirt, blackJeans, beigeBlazer, sneakers, charcoalCoat, navyOxford, oliveChinos, creamSweater, loafers, belt, midiDress] =
    items;

  const outfitDefs: OutfitSeedDef[] = [
    {
      name: "Meeting Ready",
      occasion: "work",
      mood: "confident",
      source: "ai",
      status: "saved",
      weather: { tempC: 18, condition: "partly cloudy", humidity: 55 },
      explanation: "Navy oxford grounds the look while the beige blazer adds structure — smart casual with a crisp finish.",
      scores: { colorHarmony: 4, styleCoherence: 5, weatherFit: 4, rotationScore: 3, total: 4.1 },
      evidence: [
        { type: "worn_frequency", text: "You wore navy blazers 14 times in the last month", source: "wear_log", confidence: 0.95 },
        { type: "saved_preference", text: "You saved 8 outfits with relaxed tailoring", source: "outfit_feedback", confidence: 0.9 },
        { type: "weather", text: "Weather: 18°C, partly cloudy", source: "weather_api", confidence: 1 },
      ],
      generationContext: { candidatesCount: 50, model: "gpt-4o", promptVersion: "v1" },
      itemPositions: [
        { item: navyOxford!, position: 0 },
        { item: oliveChinos!, position: 1 },
        { item: beigeBlazer!, position: 2 },
        { item: loafers!, position: 3 },
        { item: belt!, position: 4 },
      ],
    },
    {
      name: "Weekend Casual",
      occasion: "casual",
      mood: "relaxed",
      source: "ai",
      status: "saved",
      weather: { tempC: 22, condition: "sunny", humidity: 40 },
      explanation: "White shirt with black jeans is a timeless contrast — cream sweater in the bag for cooler evenings.",
      scores: { colorHarmony: 4, styleCoherence: 4, weatherFit: 5, rotationScore: 4, total: 4.2 },
      evidence: [
        { type: "style_pattern", text: "You tend to choose neutral colors", source: "fashion_memory", confidence: 0.85 },
        { type: "rotation", text: "You haven't worn these sneakers in 12 days", source: "wear_log", confidence: 1 },
      ],
      generationContext: { candidatesCount: 50, model: "gpt-4o", promptVersion: "v1" },
      itemPositions: [
        { item: whiteShirt!, position: 0 },
        { item: blackJeans!, position: 1 },
        { item: sneakers!, position: 2 },
      ],
    },
    {
      name: "Warm Layers",
      occasion: "casual",
      source: "ai",
      status: "generated",
      weather: { tempC: 6, condition: "windy", humidity: 70 },
      explanation: "Charcoal overcoat over a cream sweater keeps the palette warm while protecting against the wind.",
      scores: { colorHarmony: 5, styleCoherence: 4, weatherFit: 5, rotationScore: 2, total: 4.0 },
      evidence: [
        { type: "weather", text: "Weather: 6°C, windy", source: "weather_api", confidence: 1 },
        { type: "rotation", text: "You haven't worn this coat in 30 days", source: "wear_log", confidence: 1 },
      ],
      generationContext: { candidatesCount: 50, model: "gpt-4o", promptVersion: "v1" },
      itemPositions: [
        { item: creamSweater!, position: 0 },
        { item: blackJeans!, position: 1 },
        { item: charcoalCoat!, position: 2 },
        { item: belt!, position: 3 },
      ],
    },
    {
      name: "Summer Brunch",
      occasion: "casual",
      source: "manual",
      status: "saved",
      weather: { tempC: 25, condition: "sunny", humidity: 45 },
      explanation: "Navy-striped linen midi dress — breezy and effortlessly put together.",
      scores: { colorHarmony: 4, styleCoherence: 4, weatherFit: 5, rotationScore: 5, total: 4.4 },
      itemPositions: [{ item: midiDress!, position: 0 }],
    },
  ];

  const createdOutfits = [];
  for (const def of outfitDefs) {
    const [outfit] = await db
      .insert(outfits)
      .values({
        id: uuidv7(),
        userId,
        name: def.name,
        occasion: def.occasion,
        mood: def.mood,
        source: def.source,
        status: def.status,
        weather: def.weather,
        explanation: def.explanation,
        scores: def.scores,
        evidence: def.evidence,
        generationContext: def.generationContext,
      })
      .returning();
    createdOutfits.push(outfit!);

    for (const { item, position } of def.itemPositions) {
      await db.insert(outfitItems).values({
        id: uuidv7(),
        outfitId: outfit!.id,
        itemId: item!.id,
        position,
      });
    }
  }
  return createdOutfits;
}

async function seedWearLog(userId: string, outfitsArr: Awaited<ReturnType<typeof seedOutfits>>) {
  const wearDefs = [
    { outfit: outfitsArr[0], daysAgo: 1, occasion: "work" },
    { outfit: outfitsArr[1], daysAgo: 3, occasion: "casual" },
    { outfit: outfitsArr[0], daysAgo: 8, occasion: "work" },
  ];

  for (const def of wearDefs) {
    const [log] = await db
      .insert(wearLog)
      .values({
        id: uuidv7(),
        userId,
        outfitId: def.outfit!.id,
        wornAt: new Date(Date.now() - def.daysAgo * 24 * 60 * 60 * 1000),
        occasion: def.occasion,
        weather: def.outfit!.weather,
      })
      .returning();

    const outfitItemRows = await db
      .select({ itemId: outfitItems.itemId, position: outfitItems.position })
      .from(outfitItems)
      .where(eq(outfitItems.outfitId, def.outfit!.id));

    for (const row of outfitItemRows) {
      await db.insert(wearLogItems).values({
        id: uuidv7(),
        wearLogId: log!.id,
        itemId: row.itemId,
        position: row.position,
      });
    }

    for (const row of outfitItemRows) {
      await db
        .update(clothingItems)
        .set({
          wearCount: sql`${clothingItems.wearCount} + 1`,
          lastWorn: log!.wornAt,
        })
        .where(eq(clothingItems.id, row.itemId));
    }
  }
}

async function seedFeedback(userId: string, outfitsArr: Awaited<ReturnType<typeof seedOutfits>>, items: Awaited<ReturnType<typeof seedCloset>>) {
  const [savedOutfit, casualOutfit, generatedOutfit] = outfitsArr;
  const [whiteShirt, blackJeans] = items;

  await db.insert(outfitFeedback).values([
    {
      id: uuidv7(),
      userId,
      outfitId: savedOutfit!.id,
      action: "wear",
      rating: 4,
      feedbackTags: ["too_formal"],
      context: { occasion: "work" },
    },
    {
      id: uuidv7(),
      userId,
      outfitId: savedOutfit!.id,
      action: "save",
      context: { occasion: "work" },
    },
    {
      id: uuidv7(),
      userId,
      outfitId: casualOutfit!.id,
      action: "wear",
      rating: 4,
      context: { occasion: "casual" },
    },
    {
      id: uuidv7(),
      userId,
      outfitId: generatedOutfit!.id,
      action: "skip",
      context: { occasion: "casual" },
    },
    {
      id: uuidv7(),
      userId,
      outfitId: generatedOutfit!.id,
      action: "swap",
      swapOutItemId: whiteShirt!.id,
      swapInItemId: blackJeans!.id,
      context: { occasion: "casual" },
    },
  ]);
}

async function seedMemories(userId: string) {
  const now = new Date();
  const memoryDefs: MemorySeedDef[] = [
    {
      type: "color_preference",
      category: "earth_tones",
      description: "You tend to choose earth tones",
      confidence: 0.82,
      status: "confirmed",
      dataPoints: 23,
      consistency: 0.9,
      source: "behavioral",
      lastSignalAt: now,
      lastConfirmed: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      evidence: [
        { type: "worn_frequency", text: "23 outfits selected with earth-tone items", sourceType: "wear_log", data: { count: 23 } },
        { type: "saved_preference", text: "7 saved combinations feature earth tones", sourceType: "outfit_feedback", data: { count: 7 } },
        { type: "worn_frequency", text: "12 worn items in the last 30 days", sourceType: "wear_log", data: { count: 12 } },
      ],
    },
    {
      type: "style_tendency",
      category: "structured_fit",
      description: "Structured pieces appear in 73% of your saved outfits",
      confidence: 0.75,
      status: "confirmed",
      dataPoints: 28,
      consistency: 0.8,
      source: "behavioral",
      lastSignalAt: now,
      evidence: [
        { type: "saved_preference", text: "Structured pieces in 73% of saved outfits", sourceType: "outfit_feedback", data: { count: 28 } },
      ],
    },
    {
      type: "negative_preference",
      category: "bold_prints",
      description: "You rarely choose bold prints",
      confidence: 0.68,
      status: "possible",
      dataPoints: 42,
      consistency: 0.75,
      source: "behavioral",
      lastSignalAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      evidence: [
        { type: "negative", text: "You've worn prints in 4 of 42 outfits", sourceType: "wear_log", data: { count: 42 } },
      ],
    },
    {
      type: "context_preference",
      category: "monday_work",
      description: "On Mondays you tend to choose structured, neutral outfits",
      confidence: 0.6,
      status: "emerging",
      dataPoints: 8,
      consistency: 0.7,
      source: "behavioral",
      lastSignalAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      evidence: [
        { type: "style_pattern", text: "8 Monday outfits, 6 featured structured pieces", sourceType: "wear_log", data: { count: 8 } },
      ],
    },
  ];

  for (const def of memoryDefs) {
    const [memory] = await db
      .insert(fashionMemories)
      .values({
        id: uuidv7(),
        userId,
        type: def.type,
        category: def.category,
        description: def.description,
        confidence: def.confidence,
        status: def.status,
        dataPoints: def.dataPoints,
        consistency: def.consistency,
        source: def.source,
        lastSignalAt: def.lastSignalAt,
        lastConfirmed: def.lastConfirmed,
      })
      .returning();

    for (const ev of def.evidence) {
      await db.insert(memoryEvidence).values({
        id: uuidv7(),
        memoryId: memory!.id,
        type: ev.type,
        text: ev.text,
        sourceType: ev.sourceType,
        data: ev.data,
        confidence: 0.9,
      });
    }
  }
}

async function seedStyleProfile(userId: string) {
  await db.insert(userStyleProfiles).values({
    userId,
    styleVec: makeVector(999),
    dna: {
      primaryDirection: "Minimal Premium",
      colors: [
        { name: "navy", share: 0.23 },
        { name: "cream", share: 0.18 },
        { name: "olive", share: 0.15 },
      ],
      silhouette: "relaxed tailoring",
      fabrics: ["cotton", "linen", "merino wool"],
      formalityByOccasion: { work: 3.8, weekend: 2.1, evening: 3.5 },
      styleWords: ["Effortless", "Curated", "Earthy", "Understated"],
      paletteTemperature: "warm neutral",
    },
    itemsAnalyzed: 12,
    outfitsAnalyzed: 46,
    model: "text-embedding-3-small",
    computedAt: new Date(),
  });
}

async function main() {
  const user = await seedUser();
  if (!user) return;

  const items = await seedCloset(user.id);
  console.log(`Created ${items.length} clothing items`);

  const outfitsArr = await seedOutfits(user.id, items);
  console.log(`Created ${outfitsArr.length} outfits`);

  await seedWearLog(user.id, outfitsArr);
  console.log("Created wear_log entries");

  await seedFeedback(user.id, outfitsArr, items);
  console.log("Created outfit_feedback entries");

  await seedMemories(user.id);
  console.log("Created fashion memories with evidence");

  await seedStyleProfile(user.id);
  console.log("Created user style profile");

  console.log("Seed completed successfully.");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
