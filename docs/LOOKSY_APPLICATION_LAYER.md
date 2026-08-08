# LOOKSY — Application Layer

> Version: 1.0 | Status: Active | Last updated: 2026-08-08
> Role: Senior Backend Engineer | Phase 3

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Layer Responsibilities](#2-layer-responsibilities)
3. [Services](#3-services)
4. [Usage Examples](#4-usage-examples)
5. [Future AI Pipeline Integration](#5-future-ai-pipeline-integration)
6. [Testing](#6-testing)
7. [Validation](#7-validation)

---

## 1. Architecture

Application Layer sits between the database (Phase 2) and the future UI/API (Phase 4):

```
UI / API (Server Actions)
        ↓
     Service          ← business logic, ownership checks, validation
        ↓
    Repository        ← typed DB access only (Drizzle)
        ↓
     Database         ← Neon PostgreSQL + pgvector
```

Rules:

- **Repository** — only data access: selects, inserts, updates. No business decisions.
- **Service** — business logic: ownership verification, domain validation, orchestration. No raw SQL.
- **Never** call the database from UI/Server Actions directly.
- Every service depends on its repository via constructor injection (testable, mockable).

### Module Structure

```
src/modules/
├── users/
│   ├── schema.ts            (Phase 2)
│   ├── types.ts             ← Phase 3
│   ├── repository.ts        ← Phase 3
│   ├── service.ts           ← Phase 3
│   └── index.ts             public API re-exports
├── closet/                  (same layout)
├── outfits/                 (same layout + feedbackService.ts)
├── recommendations/         (service.ts + contextService.ts)
├── ai/                      (types.ts — contracts only)
└── analytics/               (schema only, Phase 3 scope)
```

---

## 2. Layer Responsibilities

| Layer | Responsibility | Forbidden |
|-------|----------------|-----------|
| `types.ts` | Domain input/output types derived from schema rows | DB logic |
| `repository.ts` | Typed queries: select/insert/update/delete via Drizzle | Business rules, `next/navigation`, React |
| `service.ts` | Business rules: ownership, validation, status transitions, orchestration | Raw SQL, HTTP, React |
| `index.ts` | Public module API — re-exports for UI/API layer | — |

Shared infrastructure: `src/lib/errors.ts` (`NotFoundError`, `ForbiddenError`, `ValidationError`).

---

## 3. Services

### 3.1 UsersService (`src/modules/users/service.ts`)

| Method | Purpose |
|--------|---------|
| `getUserProfile(userId)` | Full profile: user + preferences |
| `getProfileByClerkId(clerkUserId)` | Profile lookup by Clerk id (returns `null` if absent) |
| `createProfile(input)` | Create user + empty preferences |
| `updateProfile(userId, input)` | Update name/avatar/location |
| `getStylePreferences(userId)` | Style preferences only |
| `updatePreferences(userId, input)` | Upsert style/notification preferences, quiz state |

### 3.2 ClosetService (`src/modules/closet/service.ts`)

Product-language naming.

| Method | Purpose |
|--------|---------|
| `addToWardrobe(userId, input)` | Add clothing item |
| `getWardrobe(userId, query)` | Wardrobe list with photos, default `status: "active"` |
| `getItem(userId, itemId)` | Single item (ownership checked) |
| `updateClothingMetadata(userId, itemId, input)` | Edit brand/material/colors/seasons/formality/notes/metadata |
| `removeFromWardrobe(userId, itemId)` | Soft delete → `status: "archived"` (ADR-018) |

### 3.3 OutfitService (`src/modules/outfits/service.ts`)

| Method | Purpose |
|--------|---------|
| `createOutfit(userId, input, items?)` | Create outfit (+ optional items in one go) |
| `getOutfitHistory(userId, query)` | Outfit history, optional status filter |
| `getOutfit(userId, outfitId)` | Outfit with items + clothing item details (join) |
| `addItemsToOutfit(userId, outfitId, items)` | Add items with positions |
| `saveOutfit(userId, outfitId)` | Mark outfit `saved` |
| `generateOutfitContext(userId, input)` | **No AI** — assembles candidates (completed items), recent outfits, wear history for the future generation pipeline |

### 3.4 FeedbackService (`src/modules/outfits/feedbackService.ts`)

Feeds the future Fashion Memory system.

| Method | Purpose |
|--------|---------|
| `recordWear(userId, input)` | Wear log entry + item wear counters (`wear_count`, `last_worn`) |
| `recordSave(userId, input)` | Save feedback + outfit → `saved` |
| `recordSwap(userId, input)` | Swap feedback (out/in items) |
| `recordSkip(userId, input)` | Skip feedback + outfit → `dismissed` |

### 3.5 FashionMemoryService (`src/modules/recommendations/service.ts`)

Memories are **explainable, editable, evidence-based** (ADR-015).

| Method | Purpose |
|--------|---------|
| `getMemories(userId, query)` | List, default `status: "confirmed"` |
| `getMemoryWithEvidence(userId, memoryId)` | Memory + evidence rows |
| `addMemory(userId, input)` | Create memory record |
| `addEvidence(userId, memoryId, input)` | Attach traceable evidence (source_type/source_id) |
| `updateConfidence(userId, memoryId, confidence)` | Adjust confidence + recompute status |
| `confirmMemory(userId, memoryId)` | User confirmation → `confirmed`, confidence ≥ 0.8 |
| `rejectMemory(userId, memoryId, correctionText?)` | Soft delete (`deleted`, `deleted_at`) |
| `correctMemory(userId, memoryId, input)` | User correction (description / correction text) |

Pure helper: `computeStatusFromConfidence()` — maps 0–1 to `confirmed/possible/emerging/fading/dormant` (thresholds 0.8/0.6/0.4/0.2).

### 3.6 RecommendationContextService (`src/modules/recommendations/contextService.ts`)

Preparation layer for RAG / personalized recommendations. **No LLM calls.**

| Method | Purpose |
|--------|---------|
| `buildUserStyleContext(userId, options?)` | Assembles: wardrobe items, recent outfits, wear history, feedback, memories, style profile |

Returns `UserStyleContext` — the retrieval-ready payload for the AI pipeline.

### 3.7 AI Contracts (`src/modules/ai/types.ts`)

Interfaces only, no implementation (Phase 3 scope):

- `AIProvider` — `generateOutfits(request)`, `embed(request)`
- `GenerateOutfitsRequest` / `GeneratedOutfit` / `EmbedRequest`
- `StyleProfileUpdater` — future style profile recomputation

---

## 4. Usage Examples

```ts
// Server Action / Route Handler (Phase 4)
import { ClosetService } from "@/modules/closet";
import { ClosetRepository } from "@/modules/closet";
import { db } from "@/lib/db/client";

const closet = new ClosetService(new ClosetRepository(db));

export async function addItem() {
  const item = await closet.addToWardrobe(userId, {
    type: "shirt",
    brand: "Uniqlo",
    colors: [{ name: "navy", hex: "#000080", dominance: 1 }],
    seasons: ["spring", "fall"],
    formality: 3,
  });
  return item;
}
```

```ts
// Feedback → future memory signal
const feedback = new FeedbackService(new OutfitsRepository(db));
await feedback.recordWear(userId, { outfitId, itemIds: ["i1", "i2"], occasion: "work" });

// Context for the future AI pipeline
const contextService = new RecommendationContextService(new MemoriesRepository(db));
const ctx = await contextService.buildUserStyleContext(userId);
```

---

## 5. AI Pipeline Integration

```
User request (occasion, weather, mood)
        ↓
RecommendationContextService.buildUserStyleContext(userId)
        ↓                     — wardrobe / outfits / wear / feedback / memories / style profile
OutfitService.generateOutfitContext(userId, request)
        ↓                     — candidates + history (retrieval)
RetrievalService.retrieve()  — RAG: query embedding (Jina) → HNSW similar items
        ↓
AIProvider.generateOutfits(request)     ← OpenAI-compatible (deepseek-v4-flash via OpenCode Go)
        ↓
OutfitService.createOutfit(userId, result) + FeedbackService.recordSave/recordSwap/recordSkip
        ↓
MemoryAutomationService.processSignals(userId)  ← Phase 7, ADR-014: behavioral signals → fashion memories
```

Current boundaries: the full pipeline is implemented end-to-end (Phases 4–7).
`AIProvider` is the typed contract (`src/modules/ai/types.ts`); chat/vision use
the OpenAI-compatible endpoint, embeddings use the Jina provider (ADR-031),
with a deterministic fallback for zero-config operation.

---

## 6. Testing

Unit tests use repository mocks (constructor injection) — no DB needed.

| File | Coverage |
|------|----------|
| `src/modules/closet/service.test.ts` | add/get/update/remove, ownership errors |
| `src/modules/outfits/feedbackService.test.ts` | wear/save/swap/skip + ownership, skip context |
| `src/modules/recommendations/service.test.ts` | memory CRUD, confidence, confirm/reject, status mapping |
| `src/modules/recommendations/automationService.test.ts` | fashion memory automation (18 tests) |
| `src/modules/ai/providers/jina/embeddings.test.ts` | Jina provider contract (9 tests) |

Run: `npm test` → **190 tests** total (31 files).

---

## 7. Validation

```
npm run lint        → 0 errors, 0 warnings
npm run typecheck   → OK
npm run build       → OK (Next.js 16)
npm test            → 190 passed
```

---

*Full AI pipeline implemented end-to-end: retrieval → generation → feedback → fashion memory automation. Chat/vision via OpenAI-compatible endpoint, embeddings via Jina, deterministic fallback included.*
