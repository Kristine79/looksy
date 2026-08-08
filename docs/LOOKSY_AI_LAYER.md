# LOOKSY — AI Layer

> Version: 1.1 | Status: Active | Last updated: 2026-08-08
> Role: Senior AI Engineer | Phases 4–6 (AI Intelligence Foundation + Outfit Generation)

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Provider Abstraction](#2-provider-abstraction)
3. [OpenAI Provider (chat/vision)](#3-openai-provider-chatvision)
4. [Jina Provider (embeddings)](#4-jina-provider-embeddings)
5. [Embeddings Pipeline](#5-embeddings-pipeline)
6. [Clothing Recognition Pipeline](#6-clothing-recognition-pipeline)
7. [AI Status Handling](#7-ai-status-handling)
8. [Retrieval / RAG](#8-retrieval--rag)
9. [Outfit Generation (RAG → LLM)](#9-outfit-generation-rag--llm)
10. [Error Handling](#10-error-handling)
11. [Models](#11-models)
12. [Testing](#12-testing)

---

## 1. Architecture

```
Application Layer (outfits / recommendations / closet modules)
        ↓
AI Services (orchestration, status, persistence)
        ↓
AIProvider interface (contract)
        ↓
OpenAIProvider (chat + vision)      ← today: OpenCode-compatible endpoint
        ↓
JinaEmbedding provider              ← today: jina-embeddings-v4 (1536 dims)
```

Principles:

- **Business logic never imports a provider directly** — only the `AIProvider` interface.
- Providers are swappable: a new provider = new provider class + factory. Zero changes in services.
- Embeddings have a **dedicated provider path** (`src/modules/ai/providers/jina/`) — chat/vision stay on the OpenAI-compatible endpoint, embeddings go to Jina AI.
- All AI errors are typed (`AIError` hierarchy).

### Structure

```
src/modules/ai/
├── config.ts                   env resolution: AI_* + JINA_* variables
├── types.ts                    contracts: AIProvider, analysis/retrieval types
├── errors.ts                   AIError hierarchy
├── validation.ts               zod schema for vision responses
├── repository.ts               EmbeddingsRepository (upsert, similarity search)
├── providers/
│   ├── openai/
│   │   ├── client.ts           client factory + env config (30s timeout, 0 retries)
│   │   ├── embeddings.ts       createEmbedding() dispatcher (Jina → deterministic fallback)
│   │   ├── vision.ts           image analysis + JSON parsing
│   │   └── index.ts            OpenAIProvider (implements AIProvider)
│   └── jina/
│       └── embeddings.ts       createJinaEmbedding() — direct Jina API call
└── services/
    ├── embeddingService.ts     generate/embed + persist to pgvector
    ├── clothingAnalysisService.ts  full recognition pipeline
    ├── retrievalService.ts     RAG retrieval flow
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
- `generateOutfits` was a stub in Phase 5; the full generation pipeline shipped in Phase 6 (see §9).

---

## 3. OpenAI Provider (chat/vision)

`src/modules/ai/providers/openai/`

| File | Responsibility |
|------|----------------|
| `client.ts` | `getOpenAIClient()` — cached singleton, `AI_API_KEY` env check, **30s timeout, 0 retries (fail-fast)** |
| `embeddings.ts` | `createEmbedding()` dispatcher — routes to Jina, deterministic fallback, legacy OpenAI-compatible path |
| `vision.ts` | `analyzeClothingImage()` — vision model + strict JSON response, `parseVisionJson()` |
| `index.ts` | `OpenAIProvider` class implementing `AIProvider` |

Env (chat/vision):

```
AI_API_KEY=...
AI_BASE_URL=https://opencode.ai/zen/go/v1
AI_MODEL=deepseek-v4-flash
AI_VISION_MODEL=qwen3.7-plus
```

Missing key → `ProviderConfigurationError` (thrown lazily on first call, so tests/builds without a key still work).

**Timeout/retry policy** (committed as `90aa62f`): the OpenAI client uses `timeout: 30_000` and `maxRetries: 0`. LLM calls fail fast and surface as typed provider errors instead of silently retrying inside the SDK; retry decisions (if any) belong to the orchestration layer.

---

## 4. Jina Provider (embeddings)

`src/modules/ai/providers/jina/embeddings.ts` — a dedicated provider for vector embeddings, separate from chat/vision.

| Concern | Behavior |
|---------|----------|
| Endpoint | `POST {JINA_BASE_URL}/embeddings` (default `https://api.jina.ai/v1`) |
| Model | `jina-embeddings-v4` (default; `JINA_EMBEDDING_MODEL` override) |
| Dimensions | always sent explicitly as `dimensions: 1536` — matches pgvector `vector(1536)`, so **no DB migration needed** |
| Timeout | 30s `AbortSignal` |
| Validation | response vector must exist, length 1536, all values finite |
| Error mapping | 429 → `ProviderRateLimitError`; network/timeout → `ProviderTimeoutError`; 5xx → `InvalidAIResponseError` |

Why v4 and not v3: `jina-embeddings-v3` caps at 1024 dimensions (1536 → 422), which would require a schema migration. v4 accepts explicit `dimensions: 1536` (200 OK), keeping `item_embeddings.embedding vector(1536)`, the HNSW index and `user_style_profiles.style_vec(1536)` unchanged.

Env:

```
JINA_API_KEY=...          # preferred
JINA_AI_KEY=...           # accepted alias
JINA_BASE_URL=            # optional, defaults to https://api.jina.ai/v1
JINA_EMBEDDING_MODEL="jina-embeddings-v4"
```

### Embedding dispatch (fallback contract)

`createEmbedding(client: OpenAI | null, request, jinaConfig)` in `src/modules/ai/providers/openai/embeddings.ts`:

1. If Jina is configured → call Jina; on success log `embedding_generated {provider:"jina", model, dimensions, fallback:false}`.
2. If Jina fails (any error) → log `embedding_fallback_to_deterministic` and return the deterministic embedding (`deterministic-fallback-v1`, model id `DETERMINISTIC_EMBEDDING_MODEL`).
3. If Jina is **not** configured → legacy OpenAI-compatible path (`text-embedding-3-small` via the OpenAI client), with the same deterministic fallback on failure.
4. No client and no Jina → `ProviderConfigurationError`.

`OpenAIProvider.embed()` branches: with Jina configured it calls the dispatcher with `client = null`, so embeddings work **without** `AI_API_KEY`.

The deterministic fallback guarantees the product works with no external embedding service (unit-tested, deterministic vectors); it is never used when Jina responds successfully.

---

## 5. Embeddings Pipeline

```
Item metadata
     ↓
buildItemTextRepresentation(item)   "shirt, button-down, Uniqlo, cotton, navy, formality 3/5"
     ↓
provider.embed(text)                jina-embeddings-v4, 1536 dims (Jina) / deterministic fallback
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

## 6. Clothing Recognition Pipeline

```
Image URL
   ↓
mark item aiStatus = "processing"
   ↓
provider.analyzeClothingImage(imageUrl)      vision model (qwen3.7-plus via OpenCode)
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

## 7. AI Status Handling

Lifecycle per item: `pending → processing → completed | failed` (+ `needs_review` reserved).

- `aiStatus: "processing"` set before the provider call
- On success: `completed` + `ai_confidence`, `ai_model_version`, `ai_processed_at`, `ai_payload`
- On failure: `failed` + `ai_error` (message persisted), `ai_processed_at`
- Retry = call `reprocessClothingItem()` — resets to processing, clears error

---

## 8. Retrieval / RAG

`RetrievalService.retrieve(userId, query, options?)`:

```
User query text
     ↓
provider.embed(query)              query embedding (Jina, 1536 dims)
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

Live behavior (validated 2026-08-08): Jina row wins similarity priority (distance 0.0000 vs legacy rows), old `text-embedding-3-small` and `deterministic-fallback-v1` rows remain queryable alongside — cosine search is model-agnostic.

---

## 9. Outfit Generation (RAG → LLM)

```
User request (occasion, weather, mood)
        ↓
RecommendationContextService.buildUserStyleContext(userId)
        ↓                     — wardrobe / outfits / wear / feedback / memories / style profile
RetrievalService.retrieve()   — similar items (semantic, Jina embeddings)
        ↓
Prompt assembly (template + retrieved data + memories)
        ↓
provider.generateOutfits(request)          deepseek-v4-flash via OpenCode
        ↓
Parse + validate (strict JSON instructions, code-fence tolerance, 1 parse retry)
        ↓
RecommendationService → OutfitService.createOutfit()
        ↓
FeedbackService.recordWear/recordSave/recordSwap/recordSkip
        ↓
MemoryAutomationService.processSignals(userId)   — Phase 7: behavioral signals → fashion memories
```

- If the AI provider is unavailable, Today's Look degrades to a rule-based fallback (context-aware, non-random) — see `RecommendationService` and the recommendations module docs.
- Skip feedback carries the look occasion into `outfit_feedback.context`, so negative signals learn from context (e.g. `negative:formal`).

---

## 10. Error Handling

`src/modules/ai/errors.ts`:

| Error | Code | Retryable |
|-------|------|-----------|
| `ProviderConfigurationError` | PROVIDER_CONFIGURATION | no |
| `ProviderTimeoutError` | PROVIDER_TIMEOUT | yes |
| `ProviderRateLimitError` | PROVIDER_RATE_LIMIT | yes |
| `InvalidAIResponseError` | INVALID_AI_RESPONSE | no |
| `AIError` (base) | — | — |

`isRetryableAIError()` helper — used by the recommendation orchestration layer.

---

## 11. Models

| Purpose | Model | Dims | Provider |
|---------|-------|------|----------|
| Embeddings (primary) | `jina-embeddings-v4` | 1536 (explicit `dimensions`) | Jina AI |
| Embeddings (legacy path) | `text-embedding-3-small` | 1536 | OpenAI-compatible |
| Embeddings (emergency) | `deterministic-fallback-v1` | 1536 | local, deterministic |
| Vision (clothing analysis) | `qwen3.7-plus` | — | OpenCode-compatible |
| Generation (outfits) | `deepseek-v4-flash` | — | OpenCode-compatible |

Constants in `src/modules/ai/config.ts` (env resolution) and `src/modules/ai/types.ts` / `schema.ts` (`EMBEDDING_MODEL`, `EMBEDDING_DIMENSIONS`).

---

## 12. Testing

No real AI calls — providers are mocked.

| File | Coverage |
|------|----------|
| `ai/providers/jina/embeddings.test.ts` | validation, model override, wrong dims, non-finite, missing data, 429/5xx/network mapping, base URL trailing slash (9 tests) |
| `ai/providers/openai/index.test.ts` | provider contract with mock client, Jina success (no fallback), Jina failure → deterministic, legacy path, config resolution |
| `ai/services/embeddingService.test.ts` | text repr, generate, persist, ownership |
| `ai/services/clothingAnalysisService.test.ts` | full pipeline, validation fail, vision fail, retry |
| `ai/services/retrievalService.test.ts` | RAG retrieval flow |

Run: `npm test` → **190 tests** total (31 files). `npm run lint` / `npm run typecheck` / `npm run build` all green.

---

*AI layer: chat + vision on OpenCode-compatible endpoint (deepseek-v4-flash / qwen3.7-plus), embeddings on Jina (jina-embeddings-v4, 1536 dims, no schema change), deterministic fallback for zero-config operation, RAG retrieval → LLM generation → feedback → fashion memory automation.*
