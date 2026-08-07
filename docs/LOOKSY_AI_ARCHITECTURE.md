# LOOKSY — AI Architecture

> Version: 1.0 | Status: Active | Last updated: 2026-07-22
> Role: AI/ML Technical Lead | Fashion AI System Design

---

## Table of Contents

1. [AI System Overview](#1-ai-system-overview)
2. [AI Abstraction Layer](#2-ai-abstraction-layer)
3. [Vision Pipeline](#3-vision-pipeline)
4. [Embedding System](#4-embedding-system)
5. [Outfit Generation](#5-outfit-generation)
6. [Fashion Memory Engine](#6-fashion-memory-engine)
7. [Prompt Architecture](#7-prompt-architecture)
8. [Cost Management](#8-cost-management)
9. [Quality Assurance](#9-quality-assurance)
10. [Provider Migration Strategy](#10-provider-migration-strategy)

---

## 1. AI System Overview

### 1.1 AI in LOOKSY

AI is not a feature in LOOKSY — it's the foundation. Every recommendation, classification, and suggestion flows through AI. The architecture must be:

- **Reliable** — AI failures cannot break core functionality
- **Cost-efficient** — OpenAI costs scale with users
- **Swappable** — Provider switching without business logic changes
- **Transparent** — Every AI decision must be explainable

### 1.2 AI Touchpoints

| Touchpoint | AI Model | Latency Target | Failure Mode |
|-----------|----------|---------------|--------------|
| Photo classification | GPT-4o Vision | < 4s | Manual entry fallback |
| Embedding generation | text-embedding-3-small | < 1s | Queue for retry |
| Outfit generation | GPT-4o | < 8s | Cached suggestions |
| Style analysis | GPT-4o | < 5s | Default profile |
| Similarity search | pgvector (no AI) | < 200ms | N/A |

### 1.3 Data Flow

```
User Photo ──→ Vision Pipeline ──→ Metadata + Embedding ──→ Database
                                                              │
User Request ──→ Context Gathering ──→ Outfit Generation ──→ Ranked Outfits
                     │                      │
                     │                      └──→ Fashion Memory (preferences)
                     │
                     └──→ Weather API
                     └──→ Wear History
                     └──→ User Preferences
```

---

## 2. AI Abstraction Layer

### 2.1 Interface Definitions

```typescript
// modules/ai/types.ts

interface ClothingMetadata {
  type: ClothingType;
  subType: string;
  colors: Color[];
  pattern: Pattern;
  material: Material;
  seasons: Season[];
  formality: number; // 1-5
  brand: string | null;
  confidence: number; // 0-1
}

interface Color {
  name: string;
  hex: string;
  dominance: number; // 0-1, how dominant this color is
}

type ClothingType = 'shirt' | 'pants' | 'dress' | 'jacket' | 'shoes' | 'accessory' | 'bag' | 'jewelry';
type Pattern = 'solid' | 'striped' | 'plaid' | 'floral' | 'abstract' | 'geometric' | 'animal' | 'other';
type Material = 'cotton' | 'denim' | 'leather' | 'silk' | 'wool' | 'linen' | 'synthetic' | 'other';
type Season = 'spring' | 'summer' | 'fall' | 'winter';

interface OutfitSuggestion {
  items: string[]; // item IDs
  name: string;
  explanation: string;
  scores: {
    colorHarmony: number; // 1-5
    styleCoherence: number; // 1-5
    weatherFit: number; // 1-5
    rotationScore: number; // 1-5
  };
  evidence: Evidence[];
}

interface Evidence {
  type: 'worn_frequency' | 'saved_preference' | 'style_pattern' | 'weather' | 'rotation' | 'color_harmony' | 'negative';
  text: string;
  source: string;
  confidence: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}
```

### 2.2 Provider Interface

```typescript
// modules/ai/providers/types.ts

interface AIVisionProvider {
  analyzeClothingItem(imageUrl: string): Promise<ClothingMetadata>;
}

interface AIEmbeddingProvider {
  generateTextEmbedding(text: string): Promise<number[]>;
  generateImageEmbedding(imageUrl: string): Promise<number[]>;
  batchGenerateEmbeddings(texts: string[]): Promise<number[][]>;
}

interface AIStylistProvider {
  generateOutfits(context: OutfitContext): Promise<OutfitSuggestion[]>;
  explainOutfit(items: ClothingItem[], context: OutfitContext): Promise<string>;
  chat(messages: ChatMessage[], context: UserContext): AsyncIterable<string>;
  detectStyleShift(profile: StyleProfile, recentItems: ClothingItem[]): Promise<StyleShift | null>;
}
```

### 2.3 Provider Registry

```typescript
// modules/ai/providers/registry.ts

const providers = {
  vision: new OpenAIVisionProvider(),
  embedding: new OpenAIEmbeddingProvider(),
  stylist: new OpenAIStylistProvider(),
};

export function getVisionProvider(): AIVisionProvider {
  return providers.vision;
}

export function getEmbeddingProvider(): AIEmbeddingProvider {
  return providers.embedding;
}

export function getStylistProvider(): AIStylistProvider {
  return providers.stylist;
}
```

### 2.4 OpenAI Implementation

```typescript
// modules/ai/providers/openai.ts

import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3,
  timeout: 30_000,
});

export class OpenAIVisionProvider implements AIVisionProvider {
  async analyzeClothingItem(imageUrl: string): Promise<ClothingMetadata> {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageUrl, detail: 'high' },
            },
            {
              type: 'text',
              text: CLASSIFICATION_PROMPT,
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 500,
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content) as ClothingMetadata;
  }
}

export class OpenAIEmbeddingProvider implements AIEmbeddingProvider {
  async generateTextEmbedding(text: string): Promise<number[]> {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536,
    });
    return response.data[0].embedding;
  }

  async batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
      dimensions: 1536,
    });
    return response.data.map((item) => item.embedding);
  }
}
```

---

## 3. Vision Pipeline

### 3.1 Photo Classification Flow

```
User uploads photo
│
├── 1. Validate image
│   ├── Check file size (< 20MB)
│   ├── Check format (jpg, png, webp)
│   └── Check dimensions (> 200x200)
│
├── 2. Upload to Supabase Storage
│   ├── Generate unique filename
│   ├── Upload with metadata
│   └── Get public URL
│
├── 3. AI Classification (GPT-4o Vision)
│   ├── Send image with structured prompt
│   ├── Receive JSON with metadata
│   └── Parse and validate response
│
├── 4. Quality check
│   ├── Confidence > 0.6? → Accept
│   ├── Confidence 0.4-0.6? → Flag for review
│   └── Confidence < 0.4? → Manual entry required
│
├── 5. Generate embedding
│   ├── Create text description from metadata
│   ├── Generate vector embedding
│   └── Store in pgvector
│
└── 6. Return to client
    ├── Full item data
    └── AI confidence score
```

### 3.2 Image Preprocessing

Before sending to AI, images should be optimized:

| Step | Action | Reason |
|------|--------|--------|
| Resize | Max 1024px longest side | Reduce token cost |
| Compress | Quality 85% | Reduce upload time |
| Strip metadata | Remove EXIF | Privacy |
| Validate | Check for clothing | Avoid wasting API calls |

### 3.3 Classification Prompt

```
Analyze this clothing item photo. Return a JSON object with:

{
  "type": "shirt|pants|dress|jacket|shoes|accessory|bag|jewelry",
  "subType": "specific variant (e.g., button-down, slim-fit chinos, Oxford)",
  "colors": [
    {
      "name": "common color name",
      "hex": "#hex code",
      "dominance": 0.0-1.0
    }
  ],
  "pattern": "solid|striped|plaid|floral|abstract|geometric|animal|other",
  "material": "cotton|denim|leather|silk|wool|linen|synthetic|other",
  "seasons": ["spring", "summer", "fall", "winter"],
  "formality": 1-5,
  "brand": "brand name if visible, otherwise null",
  "confidence": 0.0-1.0
}

Rules:
- Identify the dominant colors (max 3)
- Estimate formality: 1=very casual (gym wear), 5=very formal (tuxedo)
- Seasons: which seasons is this item suitable for?
- Material: best guess based on visual texture and drape
- Confidence: your overall certainty in this classification
```

### 3.4 Confidence Thresholds

| Confidence | Action | UX |
|-----------|--------|-----|
| > 0.8 | Auto-accept | Show: "AI identified this as navy cotton shirt" |
| 0.6 - 0.8 | Auto-accept with note | Show: "AI thinks this is a navy shirt (edit if wrong)" |
| 0.4 - 0.6 | Suggest + ask | Show: "Is this a navy button-down?" with edit options |
| < 0.4 | Manual entry | Show: "Help us identify this item" with form |

---

## 4. Embedding System

### 4.1 Embedding Strategy

Each clothing item gets an embedding that captures its visual and semantic properties. The embedding enables:

- **Similarity search** — "Find items like this"
- **Style profiling** — Aggregate user's style vector
- **Outfit coherence** — Measure how well items work together
- **Recommendation** — Find complementary items

### 4.2 Embedding Generation

```
Clothing Metadata → Text Description → Embedding

Example:
Input: { type: "shirt", colors: [{name: "navy", hex: "#000080"}], pattern: "solid", material: "cotton", formality: 3 }

Text: "Navy solid cotton shirt, smart casual, suitable for spring and fall"

Embedding: [0.023, -0.045, 0.089, ...] (1536 dimensions)
```

### 4.3 Embedding Schema

```sql
-- Item embeddings table
CREATE TABLE item_embeddings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id     UUID NOT NULL REFERENCES clothing_items(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id),
    embedding   vector(1536),
    text_repr   TEXT, -- the text used to generate embedding (for debugging)
    model       VARCHAR(50) DEFAULT 'text-embedding-3-small',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for similarity search
CREATE INDEX idx_item_embeddings_user 
    ON item_embeddings USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);

-- User style vector (aggregated)
CREATE TABLE user_style_vectors (
    user_id     UUID PRIMARY KEY REFERENCES users(id),
    style_vec   vector(1536),
    computed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 Similarity Search

```sql
-- Find similar items to a reference item
SELECT 
    ci.*,
    ip.url as photo_url,
    ie.embedding <=> $1 as distance
FROM item_embeddings ie
JOIN clothing_items ci ON ci.id = ie.item_id
JOIN item_photos ip ON ip.item_id = ci.id AND ip.is_primary = TRUE
WHERE ie.user_id = $2
    AND ci.id != $3  -- exclude the reference item
    AND ci.status = 'active'
ORDER BY ie.embedding <=> $1
LIMIT 10;

-- $1: reference embedding vector
-- $2: user_id
-- $3: reference item_id (to exclude self)
```

### 4.5 User Style Vector

The user style vector is an aggregate of all their item embeddings, weighted by:

- **Recency** — Recent items weighted higher
- **Frequency** — Worn items weighted higher
- **Saves** — Saved items weighted higher

```typescript
async function computeUserStyleVector(userId: string): Promise<number[]> {
  const items = await db
    .select({
      embedding: item_embeddings.embedding,
      weight: sql`CASE 
        WHEN ci.last_worn > NOW() - INTERVAL '30 days' THEN 2.0
        WHEN ci.last_worn > NOW() - INTERVAL '90 days' THEN 1.5
        ELSE 1.0
      END * (1 + LEAST(ci.wear_count, 10) / 10)`.as('weight'),
    })
    .from(item_embeddings)
    .innerJoin(clothing_items, eq(clothing_items.id, item_embeddings.item_id))
    .where(eq(item_embeddings.user_id, userId));

  // Weighted average of embeddings
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const styleVec = new Array(1536).fill(0);

  for (const item of items) {
    const embedding = item.embedding as number[];
    for (let i = 0; i < 1536; i++) {
      styleVec[i] += (embedding[i] * item.weight) / totalWeight;
    }
  }

  return styleVec;
}
```

---

## 5. Outfit Generation

### 5.1 Generation Flow

```
User requests outfit
│
├── 1. Gather context
│   ├── User's closet items (filtered by season/weather)
│   ├── Current weather (temperature, conditions)
│   ├── Recent outfit history (avoid repeats)
│   ├── User style preferences (from Fashion Memory)
│   └── Occasion (if specified)
│
├── 2. Filter candidates
│   ├── Season-appropriate items only
│   ├── Weather-suitable materials
│   ├── Exclude items worn in last 7 days
│   └── Respect user's stated preferences
│
├── 3. Generate with AI
│   ├── System prompt with style rules
│   ├── User's filtered items (with metadata)
│   ├── Context (weather, occasion, mood)
│   └── Receive: 3-5 outfit combinations
│
├── 4. Score and rank
│   ├── Color harmony (computed)
│   ├── Style coherence (computed)
│   ├── Weather fit (computed)
│   ├── Rotation score (computed)
│   └── AI suggestion score (from AI)
│
├── 5. Add evidence
│   ├── Generate "Why LOOKSY picked this" for each
│   ├── Include negative reasoning
│   └── Link to Fashion Memory patterns
│
└── 6. Return to client
    └── Ranked outfit suggestions with explanations
```

### 5.2 Generation Prompt

```
You are a personal stylist AI. Generate outfit combinations from the user's wardrobe.

USER CONTEXT:
- Style preferences: {style_preferences}
- Weather: {temperature}°C, {conditions}
- Occasion: {occasion}
- Recent outfits (avoid repeats): {recent_outfits}

AVAILABLE ITEMS:
{items_list}

RULES:
1. Select 3-6 items that work together
2. Consider color harmony (complementary, analogous, or neutral + accent)
3. Match formality to occasion
4. Consider material suitability for weather
5. Prioritize items not worn recently
6. Vary combinations from recent outfits

FOR EACH OUTFIT, PROVIDE:
- Item IDs (3-6 items)
- Outfit name (creative, descriptive)
- Explanation (why this works, 2-3 sentences)
- Scores: colorHarmony (1-5), styleCoherence (1-5), weatherFit (1-5)
- Evidence: array of reasons (data-backed)

OUTPUT FORMAT: JSON array of outfit suggestions.
```

### 5.3 Scoring Algorithm

```typescript
function scoreOutfit(outfit: OutfitCandidate, context: OutfitContext): OutfitScore {
  const colorScore = computeColorHarmony(outfit.items);
  const styleScore = computeStyleCoherence(outfit.items, context.userStyle);
  const weatherScore = computeWeatherFit(outfit.items, context.weather);
  const rotationScore = computeRotationScore(outfit.items, context.recentOutfits);

  // Weighted average (weights can be tuned)
  const totalScore = 
    colorScore * 0.3 +
    styleScore * 0.3 +
    weatherScore * 0.2 +
    rotationScore * 0.2;

  return { colorScore, styleScore, weatherScore, rotationScore, totalScore };
}

function computeColorHarmony(items: ClothingItem[]): number {
  // Extract all colors
  const colors = items.flatMap(item => item.colors);
  
  // Check for:
  // - Complementary colors (opposite on wheel)
  // - Analogous colors (adjacent on wheel)
  // - Neutral + accent pattern
  // - Color distribution (not too many competing colors)
  
  // Return 1-5 score
}

function computeWeatherFit(items: ClothingItem[], weather: Weather): number {
  // Check:
  // - Material breathability vs temperature
  // - Layering appropriateness
  // - Season match
  // - Rain/snow protection
  
  // Return 1-5 score
}

function computeRotationScore(items: ClothingItem[], recentOutfits: Outfit[]): number {
  // Prefer items that:
  // - Haven't been worn recently
  // - Have low wear_count relative to closet size
  // - Are versatile (can be used in many combinations)
  
  // Return 1-5 score
}
```

### 5.4 Evidence Generation

```typescript
function generateEvidence(outfit: OutfitCandidate, context: OutfitContext): Evidence[] {
  const evidence: Evidence[] = [];

  // Color evidence
  const colorPattern = analyzeColorPattern(outfit.items, context.userStyle);
  if (colorPattern) {
    evidence.push({
      type: 'color_harmony',
      text: `${colorPattern.description}`,
      source: 'color_analysis',
      confidence: colorPattern.confidence,
    });
  }

  // Weather evidence
  const weatherFit = analyzeWeatherFit(outfit.items, context.weather);
  evidence.push({
    type: 'weather',
    text: `Weather: ${context.weather.temperature}°C, ${context.weather.conditions}`,
    source: 'weather_api',
    confidence: 1.0,
  });

  // Rotation evidence
  const rotation = analyzeRotation(outfit.items, context.recentOutfits);
  if (rotation) {
    evidence.push({
      type: 'rotation',
      text: `You haven't worn ${rotation.itemName} in ${rotation.days} days`,
      source: 'wear_log',
      confidence: 1.0,
    });
  }

  // Style pattern evidence
  const styleMatch = analyzeStyleMatch(outfit.items, context.stylePreferences);
  if (styleMatch) {
    evidence.push({
      type: 'style_pattern',
      text: styleMatch.description,
      source: 'fashion_memory',
      confidence: styleMatch.confidence,
    });
  }

  return evidence;
}
```

---

## 6. Fashion Memory Engine

### 6.1 Memory Architecture

```
Fashion Memory Engine
│
├── Signal Capture
│   ├── Explicit: user confirms/corrects/deletes
│   ├── Behavioral: wear, save, dismiss, swap
│   └── Contextual: occasion + choice correlation
│
├── Pattern Detection
│   ├── Color preferences (dominant colors over time)
│   ├── Style tendencies (silhouette, formality)
│   ├── Context patterns (occasion → style correlation)
│   └── Negative patterns (what user avoids)
│
├── Confidence Scoring
│   ├── Data points: number of observations
│   ├── Consistency: how aligned are observations
│   ├── Recency: how recent is the pattern
│   └── Confirmation: has user confirmed this pattern
│
├── Decay Management
│   ├── Last confirmed date
│   ├── Time-based decay
│   └── Reactivation on re-engagement
│
└── Transparency
    ├── Evidence chain for each memory
    ├── Confidence level for user display
    └── "Is this accurate?" prompts
```

### 6.2 Memory Types

```typescript
interface Memory {
  id: string;
  userId: string;
  type: MemoryType;
  category: string;
  description: string; // "You tend to choose earth tones"
  evidence: Evidence[];
  confidence: number; // 0-1
  dataPoints: number;
  lastConfirmed: Date | null;
  lastInfluenced: Date | null;
  status: 'emerging' | 'possible' | 'confirmed' | 'fading' | 'dormant';
  createdAt: Date;
  updatedAt: Date;
}

type MemoryType = 
  | 'color_preference'
  | 'style_tendency'
  | 'context_preference'
  | 'negative_preference'
  | 'brand_preference'
  | 'successful_combination'
  | 'rejected_combination';
```

### 6.3 Confidence Calculation

```typescript
function calculateConfidence(memory: MemoryUpdate): number {
  const dataPointsScore = Math.min(memory.dataPoints / 20, 1); // Max at 20 data points
  const consistencyScore = memory.consistency; // 0-1, how aligned are signals
  const recencyScore = calculateRecencyScore(memory.lastSignal);
  const confirmationBonus = memory.userConfirmed ? 0.2 : 0;

  const rawConfidence = 
    dataPointsScore * 0.3 +
    consistencyScore * 0.4 +
    recencyScore * 0.1 +
    confirmationBonus;

  return Math.min(rawConfidence, 1);
}

function calculateRecencyScore(lastSignal: Date): number {
  const daysSince = daysBetween(lastSignal, new Date());
  if (daysSince < 7) return 1;
  if (daysSince < 30) return 0.8;
  if (daysSince < 90) return 0.6;
  if (daysSince < 180) return 0.4;
  return 0.2;
}
```

### 6.4 Decay Algorithm

```typescript
function applyDecay(memory: Memory): Memory {
  const daysSinceLastConfirmed = memory.lastConfirmed
    ? daysBetween(memory.lastConfirmed, new Date())
    : daysBetween(memory.createdAt, new Date());

  let decayFactor: number;
  if (daysSinceLastConfirmed < 30) decayFactor = 1.0;
  else if (daysSinceLastConfirmed < 90) decayFactor = 0.8;
  else if (daysSinceLastConfirmed < 180) decayFactor = 0.5;
  else decayFactor = 0.2;

  const newConfidence = memory.confidence * decayFactor;
  const newStatus = getStatus(newConfidence, daysSinceLastConfirmed);

  return {
    ...memory,
    confidence: newConfidence,
    status: newStatus,
  };
}

function getStatus(confidence: number, daysSinceConfirmed: number): Memory['status'] {
  if (confidence < 0.2) return 'dormant';
  if (confidence < 0.4) return 'fading';
  if (daysSinceConfirmed > 180) return 'fading';
  if (confidence < 0.6) return 'emerging';
  if (confidence < 0.8) return 'possible';
  return 'confirmed';
}
```

### 6.5 Memory in Outfit Generation

```typescript
function incorporateMemory(
  memories: Memory[],
  outfitContext: OutfitContext
): OutfitPrompt {
  const confirmedMemories = memories.filter(m => m.status === 'confirmed');
  const possibleMemories = memories.filter(m => m.status === 'possible');

  return {
    stylePreferences: confirmedMemories.map(m => m.description),
    tentativePreferences: possibleMemories.map(m => ({
      description: m.description,
      confidence: m.confidence,
    })),
    negativePreferences: memories
      .filter(m => m.type === 'negative_preference')
      .map(m => m.description),
    contextPatterns: memories
      .filter(m => m.type === 'context_preference')
      .map(m => ({
        context: m.category,
        preference: m.description,
      })),
  };
}
```

---

## 7. Prompt Architecture

### 7.1 Prompt Management

All prompts are centralized in `modules/ai/prompts/`:

```
modules/ai/prompts/
├── classification.ts      # Item classification prompt
├── outfit-generation.ts   # Outfit generation prompt
├── style-analysis.ts      # Style pattern detection
├── explanation.ts         # "Why LOOKSY picked this" generation
├── memory-update.ts       # Memory confidence updates
└── chat.ts               # Conversational AI prompt
```

### 7.2 Prompt Versioning

```typescript
// modules/ai/prompts/classification.ts

export const CLASSIFICATION_PROMPT_V1 = `...`;
export const CLASSIFICATION_PROMPT_V2 = `...`; // Improved accuracy

export function getClassificationPrompt(version: number): string {
  switch (version) {
    case 1: return CLASSIFICATION_PROMPT_V1;
    case 2: return CLASSIFICATION_PROMPT_V2;
    default: return CLASSIFICATION_PROMPT_V2;
  }
}
```

### 7.3 Prompt Testing

Each prompt should have test cases:

```typescript
// modules/ai/prompts/__tests__/classification.test.ts

describe('Classification Prompt', () => {
  it('classifies a navy blazer correctly', async () => {
    const result = await classifyItem('test-blazer.jpg');
    expect(result.type).toBe('jacket');
    expect(result.colors[0].name).toBe('navy');
    expect(result.formality).toBeGreaterThanOrEqual(4);
  });

  it('handles ambiguous items gracefully', async () => {
    const result = await classifyItem('test-ambiguous.jpg');
    expect(result.confidence).toBeLessThan(0.7);
  });
});
```

### 7.4 System Messages

```typescript
// Outfit generation system message
const OUTFIT_SYSTEM_PROMPT = `You are LOOKSY, a personal AI stylist. Your role is to help users create outfits from their wardrobe.

CORE PRINCIPLES:
1. Always explain your reasoning
2. Consider weather and occasion
3. Prioritize items the user hasn't worn recently
4. Respect the user's style preferences
5. Be honest about uncertainty

OUTPUT FORMAT:
Return a JSON array of outfit suggestions. Each suggestion includes:
- items: array of item IDs (3-6 items)
- name: creative outfit name
- explanation: why this works (2-3 sentences)
- scores: colorHarmony, styleCoherence, weatherFit (1-5 each)
- evidence: array of reasons with data backing

EVIDENCE RULES:
- Every claim must be backed by data
- Use "You tend to..." not "You prefer..."
- Include negative reasoning when relevant
- Be specific: "12 times in the last month" not "often"`;
```

---

## 8. Cost Management

### 8.1 Token Budget

| Operation | Model | Tokens (approx) | Cost (approx) |
|-----------|-------|-----------------|---------------|
| Item classification | GPT-4o | ~1,000 input + 500 output | $0.005 |
| Outfit generation | GPT-4o | ~3,000 input + 1,000 output | $0.015 |
| Embedding | text-embedding-3-small | ~100 | $0.00002 |
| Style analysis | GPT-4o | ~2,000 input + 500 output | $0.01 |
| Chat message | GPT-4o | ~1,000 input + 500 output | $0.005 |

### 8.2 Cost Projections

| Users | Items/User | Classifications/mo | Generations/mo | OpenAI Cost/mo |
|-------|-----------|-------------------|----------------|----------------|
| 1,000 | 25 | 25,000 | 30,000 | ~$600 |
| 5,000 | 25 | 125,000 | 150,000 | ~$3,000 |
| 10,000 | 25 | 250,000 | 300,000 | ~$6,000 |

### 8.3 Cost Optimization Strategies

| Strategy | Implementation | Savings |
|----------|---------------|---------|
| **Batch embeddings** | Process multiple items in one API call | ~30% on embedding costs |
| **Cache classifications** | Don't re-classify unchanged items | ~20% on vision costs |
| **Use GPT-4o-mini** | For less critical tasks (chat, explanations) | ~70% on those tasks |
| **Prompt optimization** | Shorter, more efficient prompts | ~15% overall |
| **Retry with backoff** | Avoid wasting tokens on rate limits | Prevents cost spikes |
| **User-triggered only** | Don't auto-generate without user action | Reduces unnecessary calls |

### 8.4 Rate Limiting

```typescript
// modules/ai/rate-limiter.ts

const RATE_LIMITS = {
  classification: { perMinute: 10, perDay: 100 },
  generation: { perMinute: 5, perDay: 50 },
  embedding: { perMinute: 30, perDay: 500 },
};

async function checkRateLimit(userId: string, operation: keyof typeof RATE_LIMITS): Promise<boolean> {
  const limits = RATE_LIMITS[operation];
  const key = `rate:${userId}:${operation}`;
  
  const minuteCount = await redis.incr(`${key}:minute`);
  if (minuteCount === 1) await redis.expire(`${key}:minute`, 60);
  
  const dayCount = await redis.incr(`${key}:day`);
  if (dayCount === 1) await redis.expire(`${key}:day`, 86400);
  
  return minuteCount <= limits.perMinute && dayCount <= limits.perDay;
}
```

---

## 9. Quality Assurance

### 9.1 Classification Accuracy

| Metric | Target | How Measured |
|--------|--------|-------------|
| Type accuracy | > 95% | Compare AI classification to manual review |
| Color accuracy | > 90% | Compare detected colors to visual inspection |
| Material accuracy | > 80% | Compare detected material to label/touch |
| Formality accuracy | > 85% | Compare AI score to user rating |

### 9.2 Outfit Quality

| Metric | Target | How Measured |
|--------|--------|-------------|
| User acceptance rate | > 60% | "Wear This" / "Save" / total suggestions |
| Feedback score | > 3.5/5 | Average of outfit feedback |
| Repeat usage | > 40% | Users generating outfits 3+ times/week |
| Style consistency | > 70% | Outfits match user's style profile |

### 9.3 Monitoring

```typescript
// Track AI performance metrics
interface AIMetrics {
  classification: {
    totalRequests: number;
    averageConfidence: number;
    lowConfidenceCount: number; // < 0.6
    averageLatency: number;
    errorRate: number;
  };
  generation: {
    totalRequests: number;
    averageScore: number;
    acceptanceRate: number;
    averageLatency: number;
    errorRate: number;
  };
  cost: {
    totalTokens: number;
    totalCost: number;
    costPerUser: number;
  };
}
```

### 9.4 Fallback Strategies

| Failure | Fallback | UX |
|---------|----------|-----|
| Vision API down | Manual entry form | "AI is temporarily unavailable — enter details manually" |
| Classification low confidence | User confirmation | "Is this a navy shirt? (edit if wrong)" |
| Generation API down | Show recent saved outfits | "AI is thinking — here are your saved looks" |
| Embedding API down | Queue for retry | Item saved, will be searchable shortly |
| Rate limited | Cached suggestions | "Showing your recent favorites" |

---

## 10. Provider Migration Strategy

### 10.1 Migration Triggers

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Cost too high | > $5/user/month | Evaluate cheaper providers |
| Quality insufficient | < 80% accuracy | Evaluate better providers |
| Latency too high | > 10s average | Evaluate faster providers |
| Provider outage | > 1 hour | Switch to backup provider |
| New capability | Provider X offers better vision | Evaluate for specific use case |

### 10.2 Migration Process

```
1. Implement new provider in modules/ai/providers/
2. Add feature flag for A/B testing
3. Run both providers in parallel
4. Compare quality metrics
5. Gradually shift traffic
6. Remove old provider when confident
```

### 10.3 Provider Comparison

| Provider | Vision | Embeddings | Text | Cost | Notes |
|----------|--------|------------|------|------|-------|
| OpenAI | GPT-4o | text-embedding-3-small | GPT-4o | $$$ | Best multimodal |
| Google Gemini | Gemini Pro Vision | Gecko | Gemini Pro | $$ | Good alternative |
| Anthropic Claude | Claude 3.5 Sonnet | N/A | Claude 3.5 Sonnet | $$$ | Best text, no vision |
| Local (Llama) | LLaVA | nomic-embed | Llama 3 | $ | Self-hosted, cheap |

### 10.4 Abstraction Benefits

By keeping the provider interface clean, we can:

- **A/B test providers** for quality comparison
- **Fallback on outage** without user impact
- **Optimize costs** by routing to cheapest provider
- **Use best-in-class** for each capability (e.g., OpenAI vision + Cohere embeddings)
- **Future-proof** against provider changes

---

*This document defines LOOKSY's AI architecture as a swappable, cost-managed, quality-focused system. The abstraction layer ensures we can evolve our AI capabilities without changing business logic, while the prompt architecture and quality assurance systems ensure consistent, high-quality recommendations.*
