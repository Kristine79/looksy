# LOOKSY — AI Layer

> Version: 1.0 | Status: Active | Last updated: 2026-08-07
> Role: Senior AI Engineer | Phase 4 — AI Intelligence Foundation

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Provider Abstraction](#2-provider-abstraction)
3. [OpenAI Provider](#3-openai-provider)
4. [Embeddings Pipeline](#4-embeddings-pipeline)
5. [Clothing Recognition Pipeline](#5-clothing-recognition-pipeline)
6. [AI Status Handling](#6-ai-status-handling)
7. [Retrieval / RAG Foundation](#7-retrieval--rag-foundation)
8. [Error Handling](#8-error-handling)
9. [Models](#9-models)
10. [Testing](#10-testing)
11. [Future RAG Architecture](#11-future-rag-architecture)

---

## 1. Architecture

```
Application Layer (Phase 3 services)
        ↓
AI Services (orchestration, status, persistence)
        ↓
AIProvider interface (contract)
        ↓
OpenAIProvider                ← today
GeminiProvider (future)       ← tomorrow
ClaudeProvider (future)
Local models (future)
```

Principles:

- **Business logic never imports OpenAI directly** — only the `AIProvider` interface.
- Swapping providers = new provider class + factory. Zero changes in services.
- All AI orchestration lives in `src/modules/ai/services/`.
- All AI errors are typed (`AIError` hierarchy) and retry-aware.

### Structure

```
src/modules/ai/
├── schema.ts                  (Phase 2 — item_embeddings table)
├── types.ts                   contracts: AIProvider, analysis/retrieval types
├── errors.ts                  AIError hierarchy
├── validation.ts              zod schema for vision responses
├── repository.ts              EmbeddingsRepository (upsert, similarity search)
├── providers/
│   └── openai/
│       ├── client.ts          client factory + env config
│       ├── embeddings.ts      embed() + error mapping
│       ├── vision.ts          image analysis + JSON parsing
│       └── index.ts           OpenAIProvider (implements AIProvider)
└── services/
    ├── embeddingService.ts    generate/embed + persist to pgvector
    ├── clothingAnalysisService.ts  full recognition pipeline
    ├── retrievalService.ts    RAG retrieval flow
    └── index.ts
```

---

## 2. Provider Abstraction

```ts
// src/modules/ai/types.ts
export interface AIProvider {
  readonly model: string;
  readonly embeddingModel: string;
  embed(request: EmbedRequest): Promise<EmbeddingResult>;
  analyzeClothingImage(request: ClothingAnalysisRequest): Promise<ClothingAnalysisWithConfidence>;
  generateOutfits(request: GenerateOutfitsRequest): Promise<GeneratedOutfit[]>; // Phase 5 stub
}
```

- `EmbeddingResult` — `{ vector, model, dimensions }`
- `ClothingAnalysisWithConfidence` — `ClothingAnalysisResult + confidence + model`
- `generateOutfits` exists on the contract but throws `"not implemented"` until Phase 5.

---

## 3. OpenAI Provider

`src/modules/ai/providers/openai/`

| File | Responsibility |
|------|----------------|
| `client.ts` | `getOpenAIClient()` — cached singleton, `OPENAI_API_KEY` env check, 60s timeout, 2 retries |
| `embeddings.ts` | `createEmbedding()` — validates vector length = 1536, maps provider errors |
| `vision.ts` | `analyzeClothingImage()` — gpt-4o-mini vision + strict JSON response, `parseVisionJson()` |
| `index.ts` | `OpenAIProvider` class implementing `AIProvider` |

Env:

```
OPENAI_API_KEY=sk-...
```

Missing key → `ProviderConfigurationError` (thrown lazily on first call, so tests/builds without a key still work).

---

## 4. Embeddings Pipeline

```
Item metadata
     ↓
buildItemTextRepresentation(item)   "shirt, button-down, Uniqlo, cotton, navy, formality 3/5"
     ↓
provider.embed(text)                text-embedding-3-small, 1536 dims
     ↓
EmbeddingsRepository.upsertItemEmbedding()
     ↓
item_embeddings (unique item_id+model, HNSW cosine)
```

`EmbeddingService` methods:

| Method | Purpose |
|--------|---------|
| `generateEmbedding(text, model?)` | Provider call only |
| `embedClothingItem(userId, itemId)` | Full: build text → embed → persist (ownership checked) |

---

## 5. Clothing Recognition Pipeline

```
Image URL
   ↓
mark item aiStatus = "processing"
   ↓
provider.analyzeClothingImage(imageUrl)      gpt-4o-mini vision
   ↓
validateClothingAnalysis()                    zod: category, colors(hex), formality 1-5, seasons
   ↓
persist metadata → clothing_items            type/subType/material/pattern/colors/seasons/formality,
                                             aiStatus=completed, aiConfidence, aiModelVersion, aiPayload
   ↓
build text representation → provider.embed()
   ↓
upsert embedding → item_embeddings
```

`ClothingAnalysisService.analyzeClothingItem(userId, itemId, imageUrl)` returns:

```ts
type AnalysisOutcome =
  | { status: "completed"; itemId: string; analysis: ClothingAnalysisResult }
  | { status: "failed"; itemId: string; error: string };
```

- **Validated** — zod `clothingAnalysisSchema` (rejects invalid hex, formality >5, missing category)
- **Typed** — `ClothingAnalysisResult`
- **Persisted with aiStatus** — processing → completed | failed
- **Retry-ready** — `reprocessClothingItem()` re-runs the full pipeline; failed items store `ai_error` for diagnostics

---

## 6. AI Status Handling

Lifecycle per item: `pending → processing → completed | failed` (+ `needs_review` reserved).

- `aiStatus: "processing"` set before the provider call
- On success: `completed` + `ai_confidence`, `ai_model_version`, `ai_processed_at`, `ai_payload`
- On failure: `failed` + `ai_error` (message persisted), `ai_processed_at`
- Retry = call `reprocessClothingItem()` — resets to processing, clears error

---

## 7. Retrieval / RAG Foundation

`RetrievalService.retrieve(userId, query, options?)`:

```
User query text
     ↓
provider.embed(query)              query embedding
     ↓
EmbeddingsRepository.findSimilarItems(userId, vec, limit)
                                    HNSW cosine similarity, user-scoped
     ↓
RecommendationContextService.buildUserStyleContext(userId)
                                    wardrobe / outfits / wear / feedback / memories / style profile
     ↓
RetrievalResult { query, queryEmbedding, similarItems[], context }
```

`SimilarItem` = `{ item: ClothingItemRow, distance: number }` (cosine distance, lower = closer).

No LLM generation in Phase 4 — retrieval data is ready to become the prompt input in Phase 5.

---

## 8. Error Handling

`src/modules/ai/errors.ts`:

| Error | Code | Retryable |
|-------|------|-----------|
| `ProviderConfigurationError` | PROVIDER_CONFIGURATION | no |
| `ProviderTimeoutError` | PROVIDER_TIMEOUT | yes |
| `ProviderRateLimitError` | PROVIDER_RATE_LIMIT | yes |
| `InvalidAIResponseError` | INVALID_AI_RESPONSE | no |
| `AIError` (base) | — | — |

`isRetryableAIError()` helper — future retry/queue integration.

---

## 9. Models

| Purpose | Model | Dims |
|---------|-------|------|
| Embeddings | `text-embedding-3-small` | 1536 |
| Vision (clothing analysis) | `gpt-4o-mini` | — |
| Generation (Phase 5, contract only) | `gpt-4o` | — |

Constants in `src/modules/ai/types.ts` (`VISION_MODEL`, `GENERATION_MODEL`) and `schema.ts` (`EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS`).

---

## 10. Testing

No real OpenAI calls — providers are mocked.

| File | Coverage |
|------|----------|
| `ai/services/embeddingService.test.ts` | text repr, generate, persist, ownership (5 tests) |
| `ai/services/clothingAnalysisService.test.ts` | full pipeline, validation fail, vision fail, retry (8 tests) |
| `ai/providers/openai/index.test.ts` | provider contract with mock client, error mapping, vision JSON parse, env config (5 tests) |

Run: `npm test` → **56 tests** total.

---

## 11. Future RAG Architecture

```
User request (occasion, weather, mood)
        ↓
RetrievalService.retrieve(userId, query)
        ↓
[RetrievalResult: similarItems + user style context]
        ↓
Prompt assembly (template + retrieved data)
        ↓
AIProvider.generateOutfits(request)          ← Phase 5
        ↓
OutfitService.createOutfit() + FeedbackService
        ↓
FashionMemoryService (decay, evidence)       ← signals from feedback
```

---

*AI Intelligence Foundation ready: provider abstraction, embeddings, vision pipeline, RAG retrieval. Generation deferred to Phase 5.*
