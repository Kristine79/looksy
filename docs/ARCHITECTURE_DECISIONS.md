# LOOKSY — Architecture Decisions

> Version: 1.3 | Status: Active | Last updated: 2026-08-08
> Purpose: Document all architectural decisions and their rationale

---

## Table of Contents

1. [Decision Process](#1-decision-process)
2. [ADR-001: Project Structure](#2-adr-001-project-structure)
3. [ADR-002: Module Architecture](#3-adr-002-module-architecture)
4. [ADR-003: Database Design](#4-adr-003-database-design)
5. [ADR-004: AI Abstraction](#5-adr-004-ai-abstraction)
6. [ADR-005: Authentication](#6-adr-005-authentication)
7. [ADR-006: State Management](#7-adr-006-state-management)
8. [ADR-007: Error Handling](#8-adr-007-error-handling)
9. [ADR-008: Testing Strategy](#9-adr-008-testing-strategy)
10. [ADR-009: Deployment](#10-adr-009-deployment)
11. [ADR-010: Next.js 16 over Next.js 15](#11-adr-010-nextjs-16-over-nextjs-15)
12. [ADR-011: UUIDv7 for Primary Keys](#12-adr-011-uuidv7-for-primary-keys)
13. [ADR-012: HNSW over IVFFlat for Vector Search](#13-adr-012-hnsw-over-ivfflat-for-vector-search)
14. [ADR-013: Normalized Wear Log](#14-adr-013-normalized-wear-log)
15. [ADR-014: Application-Layer Decay and Denormalized Counters](#15-adr-014-application-layer-decay-and-denormalized-counters)
16. [ADR-015: memory_evidence as Separate Table](#16-adr-015-memory_evidence-as-separate-table)
17. [ADR-016: No Subscriptions/Payments Tables in Phase 2](#17-adr-016-no-subscriptionspayments-tables-in-phase-2)
18. [ADR-017: Enum-Like Values as varchar + TypeScript Unions](#18-adr-017-enum-like-values-as-varchar--typescript-unions)
19. [ADR-018: Soft Delete via Status/DeletedAt](#19-adr-018-soft-delete-via-statusdeletedat)
20. [ADR-019: updated_at via Service Layer (No DB Triggers)](#20-adr-019-updated_at-via-service-layer-no-db-triggers)
21. [ADR-020: outfits.status over is_saved Flag](#21-adr-020-outfitsstatus-over-is_saved-flag)
22. [ADR-021: AI Provider Abstraction](#22-adr-021-ai-provider-abstraction-over-direct-openai-usage)
23. [ADR-022: Vision Responses Validated with Zod](#23-adr-022-vision-responses-validated-with-zod)
24. [ADR-023: Embeddings via Upsert, Retrieval via HNSW](#24-adr-023-embeddings-stored-via-upsert-retrieval-via-hnsw-cosine)
25. [ADR-024: Recommendation Pipeline with Prompt Boundary](#25-adr-024-recommendation-pipeline-with-prompt-boundary)
26. [ADR-025: OpenAI-Compatible Provider Configuration via Environment Variables](#26-adr-025-openai-compatible-provider-configuration-via-environment-variables)
27. [ADR-026: Trust Layer — Evidence-Grounded Explanations](#27-adr-026-trust-layer--evidence-grounded-explanations)
28. [ADR-027: UI as Thin Client — Server Actions & API as Sole Data Path](#28-adr-027-ui-as-thin-client--server-actions--api-as-sole-data-path)
29. [ADR-028: Client-Safe Shared Constants in src/lib](#29-adr-028-client-safe-shared-constants-in-srclib)
30. [ADR-029: Demo-Mode Auth Fallback](#30-adr-029-demo-mode-auth-fallback)
31. [ADR-030: Image Storage Abstraction with Data-URL Fallback](#31-adr-030-image-storage-abstraction-with-data-url-fallback)

---

## 1. Decision Process

### 1.1 How Decisions Are Made

1. **Identify the decision** — What needs to be decided?
2. **Gather context** — What are the constraints and requirements?
3. **Consider alternatives** — What are the options?
4. **Evaluate trade-offs** — What do we gain/lose with each option?
5. **Make the decision** — Choose based on evidence
6. **Document** — Record decision, rationale, and consequences
7. **Review** — Revisit decisions periodically

### 1.2 Decision Status

| Status | Meaning |
|--------|---------|
| Proposed | Under consideration |
| Accepted | Decision made, implement |
| Superseded | Replaced by newer decision |
| Deprecated | No longer applicable |

---

## 2. ADR-001: Project Structure

**Status:** Accepted

### Context

We need a scalable project structure that supports modular monolith architecture with clear separation of concerns.

### Decision

Use Next.js App Router with the following structure:

```
src/
├── app/           # Routes and pages
├── modules/       # Domain modules
├── lib/           # Shared utilities
├── components/    # Shared UI components
└── hooks/         # Shared React hooks
```

### Rationale

- **App Router** — React Server Components, streaming, nested layouts
- **Modules folder** — Enforces domain boundaries
- **Lib folder** — Shared utilities without domain logic
- **Components folder** — Reusable UI components
- **Hooks folder** — Shared React hooks

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Pages Router | Less efficient, no RSC |
| Feature folders | Harder to enforce boundaries |
| Flat structure | Becomes unmanageable at scale |

### Consequences

- Clear import paths (`@/modules/closet`, `@/lib/db`)
- ESLint can enforce module boundaries
- Easy to extract modules to services later
- New developers can understand structure quickly

---

## 3. ADR-002: Module Architecture

**Status:** Accepted

### Context

We need to enforce module boundaries while allowing code sharing within a monolith.

### Decision

Each module follows a strict internal pattern:

```
modules/closet/
├── index.ts          # PUBLIC API — only file imported by other modules
├── schema.ts         # Database tables (Drizzle)
├── service.ts        # Business logic
├── types.ts          # TypeScript types (internal)
└── ai-classifier.ts  # Internal implementation
```

### Rules

1. **Only `index.ts` is public** — Other modules import from `index.ts` only
2. **`types.ts` is internal** — Exposed types go through `index.ts`
3. **Cross-module access through services** — No direct table queries
4. **ESLint enforcement** — `no-restricted-imports` blocks violations

### Rationale

- **Clear boundaries** — Easy to see what's public vs internal
- **Enforceable** — ESLint rules prevent violations
- **Extractable** — Each module can become a service
- **Type-safe** — TypeScript enforces interface contracts

### Module Dependency Graph

```
auth → users → closet → outfits → ai → recommendations
                                          ↑
                              analytics (reads only)
                              subscriptions (reads users)
```

### Consequences

- Modules can be developed independently
- Testing is easier (mock at boundaries)
- Can extract to services without changing internal code
- Requires discipline (enforced by linting)

---

## 4. ADR-003: Database Design

**Status:** Accepted

### Context

We need a database that supports:
- Structured data (users, items, outfits)
- Vector similarity search (embeddings)
- JSON flexibility (metadata, preferences)
- Full-text search (item search)

### Decision

Use PostgreSQL with pgvector extension via Drizzle ORM.

### Rationale

- **PostgreSQL** — Mature, reliable, SQL familiar
- **pgvector** — No separate vector database needed
- **Drizzle ORM** — Type-safe, SQL-like, lightweight
- **Supabase** — Managed PostgreSQL with extras

### Schema Design Principles

| Principle | Implementation |
|-----------|---------------|
| UUIDs for IDs | `uuid` with `defaultRandom()` |
| Timestamps on all tables | `created_at`, `updated_at` |
| Soft deletes | `status` field instead of DELETE |
| JSONB for flexible data | Colors, preferences, metadata |
| Foreign keys for relationships | Enforced at database level |
| Indexes for performance | Based on query patterns |

### Consequences

- Single database for all data
- pgvector handles embeddings
- Drizzle generates TypeScript types
- Migrations are version-controlled

---

## 5. ADR-004: AI Abstraction

**Status:** Accepted

### Context

AI is core to LOOKSY, but we need to:
- Avoid vendor lock-in
- Allow provider switching
- Test without API calls
- Handle failures gracefully

### Decision

Implement provider-based abstraction layer.

### Interfaces

```typescript
interface AIVisionProvider {
  analyzeClothingItem(imageUrl: string): Promise<ClothingMetadata>;
}

interface AIEmbeddingProvider {
  generateTextEmbedding(text: string): Promise<number[]>;
}

interface AIStylistProvider {
  generateOutfits(context: OutfitContext): Promise<OutfitSuggestion[]>;
}
```

### Provider Registry

```typescript
const providers = {
  vision: new OpenAIVisionProvider(),
  embedding: new OpenAIEmbeddingProvider(),
  stylist: new OpenAIStylistProvider(),
};
```

### Rationale

- **Swappable** — Change provider without touching business logic
- **Testable** — Mock providers for testing
- **Failover** — Switch to backup provider on outage
- **Cost optimization** — Route to cheapest provider

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Direct OpenAI calls | Vendor lock-in |
| Abstract class | Interface is simpler |
| Configuration-based | Runtime overhead |

### Consequences

- Adding new provider requires implementing interface
- Can A/B test providers
- Business logic is provider-agnostic
- Slight abstraction overhead (negligible)

---

## 6. ADR-005: Authentication

**Status:** Accepted

### Context

We need secure authentication that supports:
- Social logins (Google, Apple)
- Email/password
- Session management
- User synchronization with our database

### Decision

Use Clerk for authentication with webhook sync.

### Flow

```
User → Clerk (OAuth/Email) → Clerk manages session
        ↓
Clerk Webhook → Create/Update user in our database
        ↓
auth() helper → Get current user in Server Components/API
```

### Rationale

- **Managed** — No custom auth code
- **Secure** — Clerk handles security
- **Social logins** — Built-in Google, Apple
- **Middleware** — Easy integration with Next.js
- **Free tier** — 10K MAU

### Consequences

- Clerk is source of truth for auth
- We store `clerk_user_id` for linking
- Webhook syncs user data to our DB
- Middleware protects routes

---

## 7. ADR-006: State Management

**Status:** Accepted

### Context

We need state management that:
- Handles server state (API data)
- Supports caching
- Manages loading/error states
- Works with Server Components

### Decision

Use TanStack Query for server state, React state for local UI state.

### Rationale

- **Server state** — TanStack Query handles fetching, caching, invalidation
- **Local state** — useState/useReducer for UI state
- **No global store** — Not needed for this scale
- **Server Components** — Fetch data directly, no client state needed

### Consequences

- Clear separation of server vs client state
- Automatic cache invalidation
- Optimistic updates built-in
- No Redux/Zustand overhead

---

## 8. ADR-007: Error Handling

**Status:** Accepted

### Context

We need consistent error handling that:
- Provides meaningful error messages
- Logs errors for debugging
- Returns proper HTTP status codes
- Handles both expected and unexpected errors

### Decision

Use custom error classes with API error handler.

### Error Hierarchy

```typescript
AppError (base)
├── NotFoundError (404)
├── ValidationError (400)
├── UnauthorizedError (401)
└── ForbiddenError (403)
```

### API Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": { "field": "email" }
  }
}
```

### Rationale

- **Consistent** — Same error format everywhere
- **Type-safe** — Error classes with codes
- **Debuggable** — Logged with context
- **User-friendly** — Meaningful messages

### Consequences

- All API routes use `handleApiError`
- Server Actions throw `AppError`
- Client components handle errors with TanStack Query
- Errors are logged with context

---

## 9. ADR-008: Testing Strategy

**Status:** Accepted

### Context

We need testing that:
- Catches regressions
- Validates business logic
- Tests user flows
- Runs quickly in CI

### Decision

Use Vitest with Testing Library for unit/integration tests.

### Test Types

| Type | Scope | Tools | Target |
|------|-------|-------|--------|
| Unit | Individual functions | Vitest | 80%+ |
| Integration | Module interactions | Vitest + MSW | Critical paths |
| E2E | User flows | Playwright | Core journeys |

### Rationale

- **Vitest** — Fast, Vite-native, TypeScript-first
- **Testing Library** — Tests user behavior, not implementation
- **MSW** — Mock API without changing code
- **Playwright** — Cross-browser E2E testing

### Consequences

- Tests run on every PR
- Coverage reports in CI
- E2E tests on main branch
- Test files colocated with source

---

## 10. ADR-009: Deployment

**Status:** Accepted

### Context

We need deployment that:
- Is zero-config
- Supports preview deploys
- Handles environment variables
- Scales automatically

### Decision

Use Vercel for deployment with GitHub Actions for CI.

### Pipeline

```
PR Created → Lint → Typecheck → Test → Build → Preview Deploy
        ↓
Merged to Main → All checks → Production Deploy → Smoke Test
```

### Environments

| Environment | Branch | Database |
|------------|--------|----------|
| Development | `main` | Local Supabase |
| Preview | PR branch | Supabase preview |
| Production | `main` | Supabase production |

### Rationale

- **Zero-config** — Vercel handles everything
- **Preview deploys** — Every PR gets a URL
- **Edge functions** — Fast middleware
- **Automatic scaling** — No manual intervention

### Consequences

- No servers to manage
- Database migrations via Supabase
- Environment variables in Vercel dashboard
- Monitoring via Vercel Analytics + Sentry

---

## 11. ADR-010: Next.js 16 over Next.js 15

**Status:** Accepted

### Context

The MVP architecture documentation specified Next.js 15.x. During Phase 1, `create-next-app` scaffolded the project with Next.js 16.2.11 (current stable line). We must decide whether to pin Next.js 15 to match the documentation or accept Next.js 16 and update the docs.

### Decision

**Accept Next.js 16.2.11 as the framework version and update all documentation to reflect it.** No version downgrade.

### Rationale

1. **The codebase already works on Next.js 16.** Phase 1 verification: build (Turbopack), lint, typecheck, and 16 tests all pass on 16.2.11. The code was already adapted to Next 16 conventions (`src/proxy.ts` instead of `middleware.ts`).
2. **Downgrade is a high-risk operation.** The project's environment has a slow/unstable npm registry connection — downloading `next` tarballs timed out 4 times during initial setup. A downgrade requires reinstalling `next`, `eslint-config-next`, and potentially React 19.2 → 19.1, re-running the SWC binary lottery. All risk for zero functional gain.
3. **Next.js 16 is the current stable release** (not beta), with production-grade conventions. Sticking with it avoids future forced migration.
4. **Documentation drift is a documentation problem, not an architecture problem.** The architectural decisions in LOOKSY_MVP_ARCHITECTURE.md (App Router, Server Components, modular monolith, Server Actions) are version-agnostic. The doc's version pin was written when 15 was current.
5. **Key breaking changes are already absorbed:** `middleware` → `proxy` convention (documented in Next 16), Turbopack default build.

### Breaking Changes Absorbed (Next 15 → 16)

| Change | Impact | Status |
|--------|--------|--------|
| `middleware.ts` → `proxy.ts` | Route-level middleware file convention | ✅ Adapted (`src/proxy.ts`) |
| Turbopack default | Faster builds, no config needed | ✅ Working |
| React 19.2 | Runtime pairing with Next 16 | ✅ Installed |

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Downgrade to Next.js 15 | Requires risky package reinstallation on a slow network; rewrite of `proxy.ts` → `middleware.ts`; React downgrade; no benefit — 15 is now the older line |
| Keep docs at 15, code at 16 | Creates permanent documentation/code mismatch, future confusion |

### Consequences

- `LOOKSY_MVP_ARCHITECTURE.md` and related docs must be updated to say Next.js 16.x
- `TECHNICAL_ASSUMEPTIONS_AND_QUESTIONS.md` assumption D-1 updated
- `README.md` tech stack updated
- Future framework upgrades follow standard Next.js upgrade guides
- CI uses `eslint-config-next` 16.2.11 (already aligned)

---

## 12. ADR-011: UUIDv7 for Primary Keys

**Status:** Accepted

### Context

Phase 2 needs primary keys that are globally unique, sortable, and index-friendly. PostgreSQL `gen_random_uuid()` (v4) is random — bad locality for B-tree index inserts and no ordering signal. Sequences break modular schema design and are unsafe in distributed setups.

### Decision

Use **UUIDv7 (RFC 9562)** for all primary keys via a shared `$defaultFn` helper `src/lib/db/uuidv7.ts`. UUIDv7 embeds a 48-bit Unix timestamp + 74 random bits; values are time-ordered, so index inserts are append-mostly.

### Rationale

- Time-ordered → excellent B-tree/HNSW locality, natural chronological sorting
- Random suffix → collision-safe across environments (dev/staging/prod, seed vs app)
- No DB-side function dependency (generated in app layer) — works with Neon, local PG, and any pooler
- `uuid` column type keeps storage compact (16 bytes)

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| UUIDv4 (`defaultRandom`) | Random inserts fragment B-tree indexes; no time ordering |
| Bigserial | Sequence coupling across modules, non-uniform with sharding/pooling |
| ULID / snowflake | No native PG type; UUIDv7 already standardized in RFC 9562 |

### Consequences

- All new tables use `uuid("id").primaryKey().$defaultFn(uuidv7)`
- IDs are comparable/orderable by creation time
- Drizzle 0.38 has no built-in `uuidv7()` — custom helper in `src/lib/db/uuidv7.ts`

---

## 13. ADR-012: HNSW over IVFFlat for Vector Search

**Status:** Accepted

### Context

Item and style embeddings are searched by cosine similarity. The v1.0 doc proposed ivfflat, which requires `lists` tuning, offers lower recall at small scale, and needs periodic re-clustering (`ivfflat` index rebuilds) as data grows.

### Decision

Use **HNSW** index (`USING hnsw` with `vector_cosine_ops`) on `item_embeddings.embedding` and `user_style_profiles.style_vec`. No index on `ivfflat`; no separate `lists` parameter needed.

### Rationale

- HNSW = graph-based ANN with high recall, no maintenance (no re-clustering), works well from day one at MVP scale (250K vectors per TECHNICAL_ASSUMEPTIONS_AND_QUESTIONS.md)
- cosine distance is the primary similarity metric (embeddings are normalized) → `vector_cosine_ops`
- pgvector 0.8.0 (Neon) supports HNSW

### Neon Limitation Discovered

Neon (pgvector 0.8.0) does **not** support multi-column HNSW indexes (`access method "hnsw" does not support multicolumn indexes`). The planned composite `(user_id, embedding)` HNSW was split:

- `idx_item_embeddings_vec` — HNSW on `embedding` alone
- `idx_item_embeddings_user` — B-tree on `user_id` for row filtering

Queries filter by `user_id` (B-tree) and order by vector distance (HNSW) — planner combines both; verified in Phase 2 verification queries.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| IVFFlat | Requires `lists` tuning + re-clustering; worse recall at small scale |
| Flat scan | O(n) per query — fails at 250K vectors |
| Multi-column HNSW (user_id, embedding) | Not supported by Neon pgvector 0.8.0 — error 0A000 |

### Consequences

- `idx_item_embeddings_vec` — HNSW cosine on embedding
- `idx_item_embeddings_user` — B-tree on user_id
- If a future DB supports multi-column HNSW, the index can be upgraded without schema changes

---

## 14. ADR-013: Normalized Wear Log

**Status:** Accepted

### Context

v1.0 doc stored item IDs as an array (`item_ids uuid[]`) inside `wear_log`. Arrays complicate querying (per-item analytics, join to `clothing_items`), can't hold per-item metadata, and block FK enforcement.

### Decision

Split wear records into two tables: `wear_log` (session-level: user, outfit, worn_at, occasion, weather, source) and `wear_log_items` (one row per item: `wear_log_id`, `item_id`, `position`).

### Rationale

- FKs to `clothing_items` and `outfits` with proper `ON DELETE` semantics
- Straightforward per-item analytics (`GROUP BY item_id`) and wear-count maintenance
- Matches `memory_evidence`/`outfit_feedback` source-linking needs (ADR-015)

### Consequences

- `wear_log_items` has `item_id` FK with `ON DELETE SET NULL` (item removal keeps history) and `wear_log_id` FK with `CASCADE`
- Wear counting: `clothing_items.wear_count` / `last_worn` denormalized fields are updated by the service layer on wear events (see ADR-014)

---

## 15. ADR-014: Application-Layer Decay and Denormalized Counters

**Status:** Accepted

### Context

v1.0 doc proposed a `BEFORE UPDATE` trigger (`update_memory_confidence`) applying confidence decay inside PostgreSQL. Triggers hide business logic, complicate migrations, and make behavior non-reproducible in tests.

### Decision

Implement **decay and denormalized counters in the application layer** (service code), not in DB triggers. DB provides constraints and defaults only.

### Rationale

- Business logic (decay curve, status transitions, wear-count updates) lives in one place — the service layer — testable with unit tests
- No hidden writes during data migrations
- Keeps schema declarative: `wear_count`, `last_worn`, `confidence` are plain columns the app updates

### Consequences

- No trigger functions in the migration SQL (Phase 2 has zero triggers/functions)
- The future "Memory & Decay" service will compute confidence via app code, matching `memory_evidence` signals
- DB remains a dumb, fast store; all mutations flow through typed services

---

## 16. ADR-015: memory_evidence as Separate Table

**Status:** Accepted

### Context

v1.0 doc embedded evidence as a JSONB array on `fashion_memories`. Evidence needs source traceability (source_type, source_id), per-item filtering, and later decay scoring.

### Decision

Store evidence in a dedicated `memory_evidence` table: `memory_id` FK (CASCADE), `type`, `text`, `source_type`, `source_id`, `data` (JSONB), `confidence`.

### Rationale

- Each evidence row can reference a concrete source row (`wear_log`, `outfit_feedback`, `outfit`, `item`, `user_edit`) via `source_type` + `source_id`
- Queries like "all evidence for memory X" or "which memories cite this outfit" become trivial
- `data` JSONB keeps flexible payloads without schema churn

### Consequences

- `fashion_memories` no longer carries evidence payloads — 19 columns of memory metadata, evidence lives in the child table
- `memory_evidence.confidence` is nullable (weather/rotation evidence may not carry one) with a CHECK constraint

---

## 17. ADR-016: No Subscriptions/Payments Tables in Phase 2

**Status:** Accepted

### Context

v1.0 doc included `plans` and `user_subscriptions` tables with Stripe fields. Monetization details are not yet designed (see ROADMAP/Investor deck); Stripe integration is not part of the MVP DB scope.

### Decision

**Do not create subscription/payment tables.** The 14-table Phase 2 schema covers users → wardrobe → AI → outfits → wear → memories → analytics only.

### Rationale

- Avoids premature modeling of pricing tiers that may change (free limits, Pro features, plans structure)
- Stripe customer/subscription IDs belong to the payment provider; a future migration can add them when monetization is designed
- Keeps Phase 2 focused on the core recommendation loop

### Consequences

- `user_preferences` carries no plan/limits fields
- When monetization is designed, add a new module (`modules/subscriptions`) with its own migration — no rework of existing tables
- Free-tier limits, if needed, are enforced in app code with config

---

## 18. ADR-017: Enum-Like Values as varchar + TypeScript Unions

**Status:** Accepted

### Context

PostgreSQL native enums (`CREATE TYPE ... AS ENUM`) are rigid: adding a value requires `ALTER TYPE`, which blocks transactional DDL and complicates migrations. v1.0 doc used free-form varchars with no type safety.

### Decision

Use **varchar columns with length limits** for enum-like fields, typed in TypeScript as string-literal unions (e.g. `ClothingItemStatus = "active" | "archived" | "donated"`). DB CHECK constraints enforce domain validity where cheap; Zod schemas will enforce at the API boundary.

### Rationale

- Adding a status value = changing a TS union + (optionally) a CHECK constraint — no `ALTER TYPE`, no table rewrites
- Zod validation at service/API layer provides runtime safety identical to PG enums for app flows
- CHECK constraints (e.g. `formality between 1 and 5`, `confidence between 0 and 1`) catch direct-DB misuse

### Consequences

- All status/type fields are `varchar(20-50)` in the DB
- TS unions exported from each module schema (`ClothingItemStatus`, `OutfitStatus`, `MemoryStatus`, etc.)
- Future: add a CHECK or migrate to enum only if analytics proves value

---

## 19. ADR-018: Soft Delete via Status/DeletedAt

**Status:** Accepted

### Context

Wardrobe items can be archived/donated; fashion memories need "deleted" without losing evidence audit trail. Hard deletes destroy history and break memory evidence references.

### Decision

- `clothing_items.status`: `active | archived | donated` (hard delete only via explicit admin path)
- `fashion_memories.status`: includes `deleted` plus `deleted_at` timestamp; rows are kept for audit/recovery
- `outfits.status`: `generated | saved | archived | dismissed`

### Rationale

- Preserves analytics and evidence references (`memory_evidence` pointing at items/outfits)
- Status-based filtering is index-friendly (`idx_clothing_items_user_status`, `idx_fashion_memories_user_status`)
- Recovers gracefully: "undo archive", "restore memory" are simple status updates

### Consequences

- Application queries must filter `status = 'active'` (or equivalent) in service layer
- Hard deletes are opt-in per module; currently none of the 14 tables hard-deletes by default

---

## 20. ADR-019: updated_at via Service Layer (No DB Triggers)

**Status:** Accepted

### Context

v1.0 doc had no explicit updated_at strategy. Triggers are an option; app-layer maintenance is another.

### Decision

All tables with `updated_at` rely on the **application/service layer** to set it (e.g. `{ ..., updatedAt: new Date() }` in UPDATE statements). DB defaults only cover `created_at` (`defaultNow()`).

### Rationale

- Consistent with ADR-014 (no hidden DB logic)
- Migration scripts and bulk operations control timestamps explicitly
- Avoids trigger overhead on every write

### Consequences

- `updated_at` columns exist with `defaultNow()` (so INSERT-only flows are safe)
- UPDATE flows must pass `updatedAt` explicitly — service layer convention, noted in module docs
- No `CREATE TRIGGER` statements anywhere in the Phase 2 migration

---

## 21. ADR-020: outfits.status over is_saved Flag

**Status:** Accepted

### Context

v1.0 doc used a boolean `is_saved` on `outfits`. The product needs a lifecycle: AI generates → user saves/archives/dismisses.

### Decision

Replace `is_saved` with **`outfits.status`**: `generated | saved | archived | dismissed`, default `generated`. Saving = setting `status = 'saved'`.

### Rationale

- One field expresses the full lifecycle; boolean can only distinguish saved/not
- Index `idx_outfits_user_status` serves "my saved outfits" and "my feed" queries
- Feedback actions (`wear`, `save`, `swap`, `skip`) map cleanly to status transitions

### Consequences

- `outfit_feedback` rows link to outfits via FK; swap feedback links to both `outfit_id` and `replacement_item_id` (item FK, SET NULL)
- Service layer maps feedback actions → status transitions

---

## 22. ADR-021: AI Provider Abstraction over Direct OpenAI Usage

**Status:** Accepted

### Context

Phase 4 adds real AI capabilities (embeddings, vision analysis). Business services must not depend on the OpenAI SDK directly — future providers (Gemini, Claude, local models) must be swappable without touching business logic.

### Decision

All AI orchestration depends on the **`AIProvider` interface** (`src/modules/ai/types.ts`):

```ts
interface AIProvider {
  readonly model: string;
  readonly embeddingModel: string;
  embed(request: EmbedRequest): Promise<EmbeddingResult>;
  analyzeClothingImage(request: ClothingAnalysisRequest): Promise<ClothingAnalysisWithConfidence>;
  generateOutfits(request: GenerateOutfitsRequest): Promise<GeneratedOutfit[]>;
}
```

`OpenAIProvider` (`src/modules/ai/providers/openai/`) is the first implementation. Services receive `AIProvider` via constructor injection — swapping providers is a factory change only.

### Rationale

- Phase 3 already established DI for repositories; provider DI follows the same pattern
- `generateOutfits` stays on the contract (stub throws) so Phase 5 has a fixed seam
- Provider-specific SDK imports are confined to `providers/` — nothing else imports `openai`

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Direct `new OpenAI()` in services | Couples business logic to the SDK; provider swap = service rewrite |
| Interface with only used methods | Contract must include generation for Phase 5 seam |

### Consequences

- `src/modules/ai/providers/` contains SDK-bound code only
- Future providers (Gemini/Claude/local) = new folder + class, registered via the same interface
- Tests use mock providers — zero SDK calls in unit tests

---

## 23. ADR-022: Vision Responses Validated with Zod

**Status:** Accepted

### Context

Vision model output is unstructured text (even with `response_format: json_object`). Malformed data (bad hex, formality 9, missing category) must never reach the database.

### Decision

All vision analysis responses pass through **`validateClothingAnalysis()`** (`src/modules/ai/validation.ts`) — a zod schema:

- `category` — required non-empty string
- `colors[]` — `{ name, hex (#RRGGBB), dominance 0-1 }`, max 8
- `formality` — integer 1–5
- `season[]` — max 4 entries
- `attributes` — free-form record

Invalid responses → `InvalidAIResponseError` with per-field issues; the item is marked `aiStatus = "failed"` with the error persisted.

### Rationale

- Type safety at the AI boundary — validated data becomes typed `ClothingAnalysisResult`
- Failure is isolated: bad AI output never corrupts `clothing_items`
- Retry-ready: failed items can be reprocessed without manual cleanup

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Trust vision output directly | Corrupt metadata (e.g. hex "navy") breaks color analysis downstream |
| Validation inside provider | Providers are SDK adapters; validation is domain policy and stays outside |

### Consequences

- `validation.ts` is provider-agnostic — applies to any future vision provider
- `AnalysisOutcome` (completed | failed) is the typed result of the pipeline

---

## 24. ADR-023: Embeddings Stored via Upsert, Retrieval via HNSW Cosine

**Status:** Accepted

### Context

Phase 4 generates embeddings for clothing items and must store/retrieve them efficiently. Items can be re-analyzed (retry, re-embedding after metadata edits).

### Decision

- **Store:** `EmbeddingsRepository.upsertItemEmbedding()` — `INSERT ... ON CONFLICT (item_id, model) DO UPDATE`. One embedding per (item, model).
- **Retrieve:** `findSimilarItems(userId, vector, limit)` — HNSW cosine similarity (`<=>`) filtered by `user_id`, joined with `clothing_items`.
- **Text representation:** deterministic `buildItemTextRepresentation(item)` — type/subType/brand/material/pattern/colors/formality.

### Rationale

- Upsert avoids duplicate rows on re-analysis (unique `uq_item_embeddings_item_model` from Phase 2)
- HNSW (ADR-012) gives fast ANN at MVP scale; user filter keeps privacy scoping
- Deterministic text repr = reproducible embeddings for the same item state

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Delete + insert on re-embed | Two queries + gap in availability |
| Embed raw vision JSON | Noisy, non-deterministic, model-version dependent |

### Consequences

- `item_embeddings` holds exactly one row per (item, model)
- RetrievalService combines similarity + user context for RAG (Phase 5 prompt input)

---

## 25. ADR-024: Recommendation Pipeline with Prompt Boundary

**Status:** Accepted

### Context

Phase 5 introduces the first end-to-end AI flow: user request → context retrieval → prompt assembly → LLM generation → explainable recommendation. Product logic must stay decoupled from the LLM.

### Decision

- **Prompt boundary:** `PromptBuilder` (recommendations/services) is the only place prompts are assembled; services never inline prompt strings.
- **Raw-JSON contract:** `AIProvider.generateRecommendation()` returns the model's raw text. Product-schema validation happens in the service layer via `parseRecommendationResponse()` (zod).
- **Retrieval-first candidates:** candidates for the LLM come from `RetrievalService` (semantic similarity via HNSW); fallback to the full wardrobe.
- **One automatic retry** on invalid JSON with an explicit "return JSON only" reminder; a second failure surfaces `InvalidAIResponseError`.
- **Normalization:** only owned itemIds survive; dedupe; max 8 items; empty wardrobe short-circuits without an LLM call.

### Rationale

- Provider stays a dumb text generator; swapping OpenAI for Gemini/local does not touch product logic (ADR-021).
- Zod validation close to the caller gives actionable `InvalidAIResponseError` details (path: issue).
- Retry covers the most common real-world failure mode of chat models.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Provider returns typed `OutfitRecommendation` | Couples provider to product schema; duplicated validation |
| No retry | Reliable enough at MVP, but a single retry is cheap and materially improves success rate |
| LLM picks from full wardrobe always | Token cost grows with wardrobe; RAG candidates keep prompts small and focused |

### Consequences

- `docs/LOOKSY_RECOMMENDATION_ENGINE.md` describes the full pipeline.
- New provider implementations only implement the text contract.
- Prompt changes are localized to `PromptBuilder` (single source of truth).

---

## 26. ADR-025: OpenAI-Compatible Provider Configuration via Environment Variables

**Status:** Accepted

### Context

LOOKSY should work with any OpenAI-compatible endpoint (OpenAI, OpenCode Go, LiteLLM, vLLM, Together, etc.) without code changes. Keys must never live in the codebase.

### Decision

- Env config resolved centrally in `src/modules/ai/config.ts` (`getAIProviderConfig()`):
  - `AI_API_KEY` (fallback `OPENAI_API_KEY`)
  - `AI_BASE_URL` — endpoint override, defaults to official OpenAI
  - `AI_MODEL` / `AI_VISION_MODEL` / `AI_EMBEDDING_MODEL` — model overrides with defaults
- `OpenAIProvider` receives the config at construction time (defaults to `getAIProviderConfig()`).
- `getOpenAIClient()` builds the SDK client with `baseURL` from config.
- Chat completions deliberately do NOT use `response_format: json_object` (not all OpenAI-compatible servers support it); JSON shape is enforced by the prompt + validation + retry.

### Rationale

- One configuration seam; tests inject config directly (no env mutation needed).
- Compatibility-first approach: works on the widest range of OpenAI-compatible servers.
- `AI_API_KEY` naming makes the provider-agnostic intent explicit vs legacy `OPENAI_API_KEY`.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Hardcode OpenAI endpoint/key in client | Violates security; no provider flexibility |
| Custom provider adapter per endpoint | Premature; OpenAI-compatible covers the requirement (Phase 5) |
| Rely on `response_format` | Breaks on compatible servers that ignore it |

### Consequences

- `.env.example` documents all AI_* variables.
- `docs/LOOKSY_RECOMMENDATION_ENGINE.md` section "AI Provider Configuration".
- Switching to OpenCode Go = set `AI_API_KEY` + `AI_BASE_URL`, zero code changes.

---

## 27. ADR-026: Trust Layer — Evidence-Grounded Explanations

**Status:** Accepted

### Context

Recommendations must be explainable and personal: not "wear this" but "why this outfit fits YOU". Generic fashion advice is explicitly out of scope.

### Decision

- Every recommendation carries `explanation { whyChosen, styleMatch, contextMatch }` + `confidence`.
- `PromptBuilder.buildEvidence()` derives checkable facts from user data (palette, style keywords, formality per occasion, most-worn items, saved outfits count, average feedback rating, feedback action counts, confirmed/possible memories).
- System prompt forbids invented preferences, buying advice and generic tips; every reason must be grounded in evidence or item attributes.
- The service layer hard-enforces ownership: only itemIds present in the user's candidates can appear in the result.

### Rationale

- Evidence facts are computed from data, so explanations are auditable and degrade gracefully when data is sparse (explicit "not enough data yet" branch).
- Ownership filter is a product guarantee, not a model suggestion — Trust Layer must hold even against a misbehaving model.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Let the LLM invent reasons freely | Hallucinated preferences destroy trust and personalization |
| Rule-based explanation only | Rigid, cannot explain combos; LLM + evidence is the right balance |

### Consequences

- `RecommendationResult.evidence: string[]` is available to UI for "why" rendering.
- Empty wardrobe returns a structured empty result (no LLM call).
- Future `whyNotRecommended` (Phase 6) will reuse the same evidence facts.

---

## 28. ADR-027: UI as Thin Client — Server Actions & API as Sole Data Path

**Status:** Accepted

### Context

Phase 6 adds the first user-facing screens (Wardrobe, Today's Look). Business rules (ownership, AI orchestration, feedback semantics) must never leak into React components; pages must work both via Server Actions (UX) and HTTP API (external clients).

### Decision

- Each module exposes exactly three entry points: `index.ts` (types), `actions.ts` (server actions), `server.ts` (application services).
- ESLint `no-restricted-imports` forbids imports from `@/modules/*` except `index|actions|server` — components cannot reach repositories, db, or AI directly.
- UI components orchestrate loading/error/empty states only; every mutation goes through an action that validates input with zod and resolves the user via `getCurrentUserId()`.
- API routes are thin wrappers over the same `server.ts` functions with a single `handleApiError` response format.
- Dashboard pages are `dynamic = "force-dynamic"` — user data is never statically prerendered.

### Rationale

- One implementation per concern: actions and routes share identical validation and ownership logic, so behavior cannot drift.
- Compile-time enforcement (ESLint) beats convention — accidental leaks fail CI, not review.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Data fetching directly in components | Duplicates validation/ownership in every screen |
| API routes only | Server Actions give better UX (streaming, form states) without extra code |

### Consequences

- Components depend only on action signatures and DTOs.
- New screens require no permission logic — it lives in `server.ts`.

---

## 29. ADR-028: Client-Safe Shared Constants in src/lib

**Status:** Accepted

### Context

`recommendations/server.ts` exported `OCCASIONS` (used by zod schema and UI). Importing it into a client component pulled the whole server module — including `postgres` — into the client bundle and broke `next build` ("module-not-found" for postgres).

### Decision

- Shared, dependency-free constants used by both server and client live in `src/lib/*.ts` (e.g. `src/lib/occasions.ts`).
- Server modules re-export them under an alias (`OCCASIONS_LIST`) when a stable public name is needed.
- The import boundary rule stays: client code may import from `src/lib` and module entry points only.

### Rationale

- Client bundles must never contain server-only dependencies; `src/lib` is the designated safe zone.
- Build failures are caught by CI, but the rule prevents the class of error entirely.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Duplicate constant lists in client and server | Drift between zod validation and UI options |
| Inline the constants in components | Same drift, worse discoverability |

### Consequences

- New shared constants (occasions, statuses, limits) follow the `src/lib` pattern.
- `todayLookInputSchema` still validates against the single canonical list.

---

## 30. ADR-029: Demo-Mode Auth Fallback

**Status:** Accepted

### Context

Phase 6 must be runnable and demoable without external signup (Clerk). Developers and investors need the product working end-to-end after `db:seed`, with no provider keys.

### Decision

- `getCurrentUserId()` resolves the user via Clerk session when `CLERK_SECRET_KEY` is set; otherwise it falls back to the seeded demo user (`demo_user`).
- No production data path is weakened: ownership checks and validation are identical in both modes.
- `.env.example` documents demo mode explicitly as an MVP convenience.

### Rationale

- Zero-config onboarding for local development and demos while keeping the real auth path active in production.
- The fallback is a single resolution point, so it cannot be bypassed accidentally elsewhere.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Mandatory Clerk everywhere | Blocks demos and local setup without keys |
| Mocking auth in components | Inconsistent with production behavior |

### Consequences

- Demo mode is visible only in how the user id is resolved; no other layer knows it exists.
- Production deployments just set `CLERK_SECRET_KEY` — no code change.

---

## 31. ADR-030: Image Storage Abstraction with Data-URL Fallback

**Status:** Accepted

### Context

Wardrobe items require photos. Supabase Storage needs project setup and credentials; the MVP must also work fully local.

### Decision

- `ImageStorageService` exposes `uploadItemPhoto()`/`resolvePhotoUrl()` behind a stable interface.
- When Supabase credentials are configured: upload to the bucket, store the storage path, serve via the CDN URL.
- Otherwise: store the resized photo as a data URL in `storage_path` (MVP fallback), `isLocalPhoto()` marks it for client-side rendering.
- Client-side resize (max 1000px, JPEG 0.85) happens in `src/lib/image.ts` before upload/encode to bound payload size.

### Rationale

- Callers never branch on storage mode — the abstraction keeps UI and services unchanged when S3/GCS replaces the fallback.
- Data URLs are acceptable for MVP scale; the interface is the durable part.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Require storage credentials | Product dead on arrival locally |
| Store base64 in DB as final design | Bloat and no CDN; fallback only |

### Consequences

- `resolvePhotoUrl` returns either a CDN URL or a data URL; components must call it (not raw paths).
- Adding S3/GCS later is a single-implementation swap.

---

## 32. ADR-031: Separate Embedding Provider (Jina AI)

**Status:** Accepted

### Context

Embeddings were served by the same OpenAI-compatible client as chat/vision (`text-embedding-3-small` via `AI_BASE_URL`), which is not guaranteed to offer the OpenAI embeddings endpoint. A dedicated embedding provider removes the coupling between generation, vision and vector quality.

### Decision

- New provider module `src/modules/ai/providers/jina/` calls `POST {JINA_BASE_URL}/embeddings` directly (no SDK), with `JINA_API_KEY` (`JINA_AI_KEY` accepted as alias) and `JINA_EMBEDDING_MODEL` (default `jina-embeddings-v4`).
- `createEmbedding()` in `src/modules/ai/providers/openai/embeddings.ts` becomes a dispatcher: Jina first, legacy OpenAI-compatible path only when Jina is not configured.
- Chat/vision are untouched — they stay on the OpenAI-compatible endpoint (ADR-034).

### Rationale

- Embedding quality and availability become independent of the chat provider.
- Success/failure is observable: `embedding_generated {provider:"jina", ...}` vs `embedding_fallback_to_deterministic` logs.
- With Jina configured, embeddings work even without `AI_API_KEY` (the dispatcher is called with a `null` client).

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Keep embeddings on the OpenAI-compatible endpoint | Depends on the gateway implementing `/embeddings`; single point of failure |
| Use the Jina SDK | One more dependency; a raw `fetch` with 30s abort is sufficient and testable |

### Consequences

- `.env` gains `JINA_API_KEY` / `JINA_BASE_URL` / `JINA_EMBEDDING_MODEL`; `.env.example` documents them.
- Retrieval results mix row models; cosine search is model-agnostic, per-model uniqueness kept by `uq_item_embeddings_item_model`.

---

## 33. ADR-032: jina-embeddings-v4 with Explicit 1536 Dimensions (No Migration)

**Status:** Accepted

### Context

`jina-embeddings-v3` caps at 1024 dimensions — a 1536 request returns 422 — so adopting v3 would require altering `vector(1536)` columns, the HNSW index and reseeding. The schema must not change for a provider swap.

### Decision

- Default embedding model: `jina-embeddings-v4`, always called with explicit `dimensions: 1536`.
- pgvector schema stays as-is: `item_embeddings.embedding vector(1536)`, `user_style_profiles.style_vec vector(1536)`, HNSW index unchanged.

### Rationale

- v4 returns exactly 1536-dimension vectors (verified live: 200 OK), so DB columns, indexes and existing rows remain valid.
- No migration, no reseed, no index rebuild — the switch is configuration-only.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| `jina-embeddings-v3` | Max 1024 dims → schema migration + re-embed all rows |
| `jina-embeddings-v5-*` | v5-text-small (1024) / v5-text-nano (768) do not support 1536 |

### Consequences

- Existing rows (`text-embedding-3-small`, `deterministic-fallback-v1`) remain queryable alongside Jina rows.
- Live validation confirmed Jina rows win similarity priority (distance 0.0000).

---

## 34. ADR-033: Deterministic Embedding Fallback Retained as Emergency Path

**Status:** Accepted

### Context

Phase 2 shipped a deterministic embedding fallback (`deterministic-fallback-v1`, LCG + normalize) so the product works with no AI credentials. Introducing Jina raised the question of removing it.

### Decision

- Keep the deterministic fallback as the last line of defense: any provider failure (Jina or legacy OpenAI-compatible) degrades to deterministic vectors, never to a hard error.
- It is unit-tested, deterministic, and its model id is recorded per row.

### Rationale

- Wardrobe onboarding and retrieval must work in local/offline/demo setups and during provider outages.
- The fallback is never used when a provider succeeds (dispatcher logs `embedding_fallback_to_deterministic` only on failure).

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Remove the fallback | Breaks zero-config local/demo operation |
| Fall back to rule-based text search only | Vector column would still require an embedding; deterministic vector is simpler |

### Consequences

- Similarity quality under fallback is lower but the pipeline never blocks on the embedding provider.
- New Jina rows outrank fallback rows in retrieval, so quality self-heals as items are re-embedded.

---

## 35. ADR-034: Chat/Vision Stay on OpenAI-Compatible Endpoint

**Status:** Accepted

### Context

With Jina handling embeddings, a question arose whether chat/vision should also move off the OpenAI-compatible endpoint (OpenCode Go, `AI_BASE_URL`).

### Decision

- Generation (`AI_MODEL`, default `deepseek-v4-flash`) and vision (`AI_VISION_MODEL`, default `qwen3.7-plus`) remain on the OpenAI-compatible client via `AI_BASE_URL`.
- Only the embedding path moved to Jina (ADR-031).

### Rationale

- The OpenAI-compatible gateway is validated in production for both chat and vision; swapping adds risk without a functional gap.
- Keeping the provider abstraction means a later migration is a factory change, not a rewrite.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Move generation to Jina | No validated generation endpoint at the time; unnecessary churn |
| Move vision to Jina | Same reasoning; vision JSON contract already validated on the current path |

### Consequences

- `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL` / `AI_VISION_MODEL` remain the chat/vision config; `JINA_*` covers embeddings only.

---

## 36. ADR-035: Fail-Fast LLM Call Policy (30s Timeout, No SDK Retries)

**Status:** Accepted

### Context

The OpenAI SDK defaulted to 60s timeout and 2 automatic retries, which multiplied worst-case latency (up to ~3 minutes) inside a single user-facing request and could mask provider failures with slow success.

### Decision

- Client config: `timeout: 30_000`, `maxRetries: 0`.
- Retry decisions belong to the orchestration layer (`isRetryableAIError()` + typed errors), not the SDK.

### Rationale

- A fail-fast call surfaces as a typed `ProviderTimeoutError`/`ProviderRateLimitError` quickly; the recommendation pipeline degrades to rule-based suggestions instead of hanging.
- Single responsibility: the client transports, the orchestration layer retries.

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Keep SDK retries (60s, 2 retries) | Worst case ~3 min per request; hides degradation |
| Custom retry loop in client | Duplicates orchestration logic; hard to test |

### Consequences

- Committed as `90aa62f`. Every provider call now fails fast; user-facing latency is bounded.
- Integration tests that assert timeout/retry behavior must mock the client; no real calls in the suite.

---

## Appendix: Decision Log

| Date | Decision | Status |
|------|----------|--------|
| 2026-07-22 | ADR-001: Project Structure | Accepted |
| 2026-07-22 | ADR-002: Module Architecture | Accepted |
| 2026-07-22 | ADR-003: Database Design | Accepted |
| 2026-07-22 | ADR-004: AI Abstraction | Accepted |
| 2026-07-22 | ADR-005: Authentication | Accepted |
| 2026-07-22 | ADR-006: State Management | Accepted |
| 2026-07-22 | ADR-007: Error Handling | Accepted |
| 2026-07-22 | ADR-008: Testing Strategy | Accepted |
| 2026-07-22 | ADR-009: Deployment | Accepted |
| 2026-08-07 | ADR-010: Next.js 16 over Next.js 15 | Accepted |
| 2026-08-07 | ADR-011: UUIDv7 for Primary Keys | Accepted |
| 2026-08-07 | ADR-012: HNSW over IVFFlat for Vector Search | Accepted |
| 2026-08-07 | ADR-013: Normalized Wear Log | Accepted |
| 2026-08-07 | ADR-014: Application-Layer Decay and Denormalized Counters | Accepted |
| 2026-08-07 | ADR-015: memory_evidence as Separate Table | Accepted |
| 2026-08-07 | ADR-016: No Subscriptions/Payments Tables in Phase 2 | Accepted |
| 2026-08-07 | ADR-017: Enum-Like Values as varchar + TypeScript Unions | Accepted |
| 2026-08-07 | ADR-018: Soft Delete via Status/DeletedAt | Accepted |
| 2026-08-07 | ADR-019: updated_at via Service Layer (No DB Triggers) | Accepted |
| 2026-08-07 | ADR-020: outfits.status over is_saved Flag | Accepted |
| 2026-08-07 | ADR-021: AI Provider Abstraction over Direct OpenAI Usage | Accepted |
| 2026-08-07 | ADR-022: Vision Responses Validated with Zod | Accepted |
| 2026-08-07 | ADR-023: Embeddings Stored via Upsert, Retrieval via HNSW Cosine | Accepted |
| 2026-08-07 | ADR-024: Recommendation Pipeline with Prompt Boundary | Accepted |
| 2026-08-07 | ADR-025: OpenAI-Compatible Provider Configuration via Environment Variables | Accepted |
| 2026-08-07 | ADR-026: Trust Layer — Evidence-Grounded Explanations | Accepted |
| 2026-08-07 | ADR-027: UI as Thin Client — Server Actions & API as Sole Data Path | Accepted |
| 2026-08-07 | ADR-028: Client-Safe Shared Constants in src/lib | Accepted |
| 2026-08-07 | ADR-029: Demo-Mode Auth Fallback | Accepted |
| 2026-08-07 | ADR-030: Image Storage Abstraction with Data-URL Fallback | Accepted |
| 2026-08-08 | ADR-031: Separate Embedding Provider (Jina AI) | Accepted |
| 2026-08-08 | ADR-032: jina-embeddings-v4 with Explicit 1536 Dimensions (No Migration) | Accepted |
| 2026-08-08 | ADR-033: Deterministic Embedding Fallback Retained as Emergency Path | Accepted |
| 2026-08-08 | ADR-034: Chat/Vision Stay on OpenAI-Compatible Endpoint | Accepted |
| 2026-08-08 | ADR-035: Fail-Fast LLM Call Policy (30s Timeout, No SDK Retries) | Accepted |

---

*This document records all architectural decisions for LOOKSY. Each decision is documented with context, rationale, alternatives, and consequences. Decisions should be reviewed periodically and updated as the project evolves.*
