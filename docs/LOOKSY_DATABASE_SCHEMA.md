# LOOKSY — Database Schema

> Version: 2.0 | Status: Active | Last updated: 2026-08-08
> Role: Data Engineer | Database Design & Management
> Stack: Neon PostgreSQL 17 + pgvector 0.8.0 + Drizzle ORM 0.38

---

## Table of Contents

1. [Schema Overview](#1-schema-overview)
2. [Setup & Commands](#2-setup--commands)
3. [Module Schemas](#3-module-schemas)
4. [AI & Embeddings](#4-ai--embeddings)
5. [Indexes & Constraints](#5-indexes--constraints)
6. [Migrations](#6-migrations)
7. [Seeding](#7-seeding)
8. [Deviation Log from v1.0](#8-deviation-log-from-v10)

---

## 1. Schema Overview

### 1.1 Entity Relationship Diagram

```
┌──────────────┐ 1:N ┌──────────────────┐ 1:N ┌──────────────────┐
│    users     │────<│  clothing_items  │────<│   item_photos   │
│              │     │                  │     └──────────────────┘
│  id (PK u7)  │     │  id (PK u7)      │
│  clerk_id    │     │  user_id (FK)    │
│  email       │     │  type/brand/...  │ 1:N ┌──────────────────┐
│  name        │     │  wear_count      │────<│  item_embeddings │
│  location    │     │  last_worn       │     │  id (PK u7)      │
└──────┬───────┘     └────────┬─────────┘     │  item_id (FK)    │
       │                      │               │  user_id (FK)    │
       │ 1:1                  │               │  embedding v1536 │
       ▼                      │               │  model           │
┌──────────────┐              │               └──────────────────┘
│user_preferenc│              │
│es            │              │ 1:N
│user_id (PKFK)│              ▼
│style_prefs   │   ┌──────────────────┐ 1:N ┌──────────────────┐
│notification  │   │     outfits      │────<│   outfit_items   │
└──────────────┘   │  id (PK u7)      │     │  outfit_id (FK)  │
                   │  user_id (FK)    │     │  item_id (FK)    │
                   │  source          │     │  position        │
                   │  status          │     └──────────────────┘
                   │  occasion/mood   │
                   │  weather         │ 1:N ┌──────────────────┐
                   │  explanation     │────<│   outfit_feedback│
                   │  scores          │     │  outfit_id (FK)  │
                   │  evidence        │     │  action          │
                   │  gen_context     │     │  rating 1-4      │
                   └────────┬─────────┘     └──────────────────┘
                            │ 1:N
                            ▼
              ┌──────────────────┐ 1:N ┌──────────────────┐
              │     wear_log     │────<│  wear_log_items  │
              │  id (PK u7)      │     │  wear_log_id(FK) │
              │  user_id (FK)    │     │  item_id (FK)    │
              │  outfit_id (FK)  │     │  position        │
              │  worn_at         │     └──────────────────┘
              │  occasion/weather│
              └──────────────────┘

┌──────────────────┐ 1:N ┌──────────────────┐
│ fashion_memories │────<│  memory_evidence │
│  id (PK u7)      │     │  memory_id (FK)  │
│  user_id (FK)    │     │  type/text       │
│  type/category   │     │  source_type     │
│  description     │     │  source_id       │
│  confidence      │     │  data (jsonb)    │
│  status          │     │  confidence      │
│  data_points     │     └──────────────────┘
│  consistency     │
│  source          │     ┌──────────────────┐
│  deleted_at      │     │user_style_profiles│
└──────────────────┘     │ user_id (PKFK)   │
                         │ style_vec v1536  │
┌──────────────────┐     │ dna (jsonb)      │
│ analytics_events │     │ items/outfits    │
│  id (PK u7)      │     │ analyzed         │
│  user_id (FK)    │     └──────────────────┘
│  event_name      │
│  properties      │
└──────────────────┘
```

### 1.2 Table Summary (14 tables)

| Module | Table | Purpose |
|--------|-------|---------|
| users | users | User accounts (Clerk) |
| users | user_preferences | Style prefs, notification settings, quiz |
| closet | clothing_items | Wardrobe items + AI analysis state |
| closet | item_photos | Item images (primary photo partial unique) |
| ai | item_embeddings | Vector embeddings (1536-dim, HNSW) |
| outfits | outfits | Generated/saved outfits (status lifecycle) |
| outfits | outfit_items | Outfit-item junction (position order) |
| outfits | wear_log | Wear sessions |
| outfits | wear_log_items | Items worn per session (normalized) |
| outfits | outfit_feedback | Feedback actions: wear/save/swap/skip |
| recommendations | fashion_memories | AI-learned style patterns (decay, soft delete) |
| recommendations | memory_evidence | Traceable evidence rows per memory |
| recommendations | user_style_profiles | Per-user style vector + DNA summary |
| analytics | analytics_events | Event tracking |

> No subscriptions/payments tables in Phase 2 — see ADR-016.

### 1.3 Conventions (ADR-011..020)

- **Primary keys:** `uuid` + `$defaultFn(uuidv7)` — RFC 9562 time-ordered (ADR-011)
- **Timestamps:** `timestamptz` (`timestamp(..., { withTimezone: true })`), `defaultNow()` for `created_at`; `updated_at` maintained by the service layer (ADR-019)
- **Enum-like fields:** `varchar(20-100)` + TS string-literal unions (ADR-017)
- **Soft delete:** `status` / `deleted_at` where needed (ADR-018)
- **No DB triggers/functions** — business logic lives in app layer (ADR-014, ADR-019)
- **JSONB** for flexible payloads: colors, metadata, weather, scores, evidence, dna, ai_payload

---

## 2. Setup & Commands

### 2.1 Environment

- Database: **Neon PostgreSQL** (Free) — remote; requires `.env` / `.env.local` with `DATABASE_URL`
- `CREATE EXTENSION vector` is part of migration `0000_initial.sql` (verified: Neon pgvector 0.8.0)
- Local PostgreSQL 9.5 does **not** support pgvector — Neon is the dev database

```
# .env (or .env.local — gitignored)
DATABASE_URL=postgresql://user:pass@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
```

Both `drizzle.config.ts` and `src/lib/db/client.ts` load `.env.local` first, falling back to `.env`.

### 2.2 Commands

```bash
npm run db:generate   # drizzle-kit generate — diff schema -> SQL migration
npm run db:migrate    # drizzle-kit migrate  — apply pending migrations
npm run db:seed       # tsx src/lib/db/seed.ts — idempotent demo data
npx drizzle-kit studio# DB Studio (optional)
```

`db:seed` is idempotent: if `demo_user` exists it skips (see §7).

---

## 3. Module Schemas

Schemas are feature-modular (ADR-002) and aggregated in `src/lib/db/schema.ts`:

```
src/lib/db/schema.ts            # re-exports all module schemas
src/modules/users/schema.ts
src/modules/closet/schema.ts
src/modules/ai/schema.ts
src/modules/outfits/schema.ts
src/modules/recommendations/schema.ts
src/modules/analytics/schema.ts
```

### 3.1 users — `src/modules/users/schema.ts`

`users`: `id u7 PK`, `clerk_user_id` unique notNull, `email`, `name`, `avatar_url`, `location jsonb {city, lat, lon}`, `created_at`, `updated_at`.

`user_preferences`: `user_id PK→users CASCADE`, `style_preferences jsonb {aesthetics[], formality 1-5, colors[], brands[]}`, `notification_settings jsonb` (defaults: push/email on, quiet hours 22:00–07:00), `quiz_completed boolean default false`, timestamps.

### 3.2 closet — `src/modules/closet/schema.ts`

`clothing_items` (24 columns): `id u7 PK`, `user_id FK CASCADE`, `type`, `sub_type`, `brand`, `material`, `pattern`, `colors jsonb (Color[] {name, hex, dominance})`, `seasons text[]`, `formality smallint default 3` CHECK 1–5, `condition`, `status (active|archived|donated) default active`, `wear_count int default 0`, `last_worn`, `notes`, AI block: `ai_status (pending|processing|completed|needs_review|failed)`, `ai_confidence real` CHECK 0–1, `ai_model_version`, `ai_payload jsonb`, `ai_error`, `ai_processed_at`, `metadata jsonb (ItemMetadata)`, timestamps.

`item_photos`: `id u7 PK`, `item_id FK CASCADE`, `url`, `thumbnail_url`, `storage_path`, `is_primary bool default false` + **partial unique** `(item_id) WHERE is_primary`, `sort_order smallint default 0`, `metadata jsonb {width,height,sizeBytes}`, `created_at`.

### 3.3 ai — `src/modules/ai/schema.ts`

`item_embeddings`: `id u7 PK`, `item_id FK CASCADE`, `user_id FK CASCADE`, `embedding vector(1536)`, `text_repr text`, `model varchar(100) default 'text-embedding-3-small'`, `dimension smallint default 1536`, timestamps. Unique `(item_id, model)`; HNSW cosine index on embedding (ADR-012).

### 3.4 outfits — `src/modules/outfits/schema.ts`

`outfits`: `id u7 PK`, `user_id FK CASCADE`, `name`, `source (ai|manual)`, `status (generated|saved|archived|dismissed) default generated` (ADR-020), `occasion`, `mood`, `weather jsonb`, `explanation text`, `scores jsonb {colorHarmony, styleCoherence, weatherFit, rotationScore, total}`, `evidence jsonb (EvidenceItem[])`, `generation_context jsonb {candidatesCount, model, promptVersion}`, timestamps.

`outfit_items`: `id u7 PK`, `outfit_id FK CASCADE`, `item_id FK CASCADE`, `position smallint default 0`.

`wear_log`: `id u7 PK`, `user_id FK CASCADE`, `outfit_id FK SET NULL`, `worn_at timestamptz default now`, `occasion`, `weather jsonb`, `source varchar(20) default 'outfit'`.

`wear_log_items`: `id u7 PK`, `wear_log_id FK CASCADE`, `item_id FK SET NULL`, `position smallint default 0` (ADR-013).

`outfit_feedback`: `id u7 PK`, `user_id FK CASCADE`, `outfit_id FK SET NULL`, `item_id FK SET NULL`, `replacement_item_id FK SET NULL`, `action (wear|save|swap|skip)`, `rating smallint` CHECK 1–4, `context jsonb {suggested_items, position, source}`, `created_at`. Index on `(user_id, outfit_id, action)`.

### 3.5 recommendations — `src/modules/recommendations/schema.ts`

`fashion_memories` (19 columns): `id u7 PK`, `user_id FK CASCADE`, `type (color_preference|style_tendency|context_preference|negative_preference|brand_preference|successful_combination|rejected_combination)`, `category`, `description text`, `confidence real` CHECK 0–1, `status (emerging|possible|confirmed|fading|dormant|deleted)`, `data_points int`, `consistency real` CHECK 0–1, `source (explicit|behavioral|contextual)`, `last_signal_at`, `last_confirmed`, `last_influenced`, `user_confirmed_at`, `user_corrected_at`, `correction_text`, `deleted_at` (soft delete, ADR-018), timestamps.

`memory_evidence` (ADR-015): `id u7 PK`, `memory_id FK CASCADE`, `type (worn_frequency|saved_preference|style_pattern|weather|rotation|color_harmony|negative|user_edit|outfit_feedback)`, `text`, `source_type (wear_log|outfit_feedback|outfit|item|user_edit)`, `source_id uuid`, `data jsonb {count, days, itemIds}`, `confidence real` nullable CHECK 0–1, `created_at`.

`user_style_profiles`: `user_id PK→users CASCADE`, `style_vec vector(1536)`, `dna jsonb (StyleDna)`, `items_analyzed int`, `outfits_analyzed int`, `model`, `computed_at`, timestamps.

### 3.6 analytics — `src/modules/analytics/schema.ts`

`analytics_events`: `id u7 PK`, `user_id FK CASCADE`, `event_name varchar(100)`, `properties jsonb`, `session_id`, `created_at`. Index `(user_id, event_name, created_at)`.

---

## 4. AI & Embeddings

### 4.1 Embedding Pipeline Contract

| Field | Value |
|-------|-------|
| Model (primary) | `jina-embeddings-v4` (`JINA_EMBEDDING_MODEL`, called with explicit `dimensions: 1536`) |
| Model (legacy path) | `text-embedding-3-small` (`AI_EMBEDDING_MODEL`) — used only when Jina is not configured |
| Model (emergency) | `deterministic-fallback-v1` — local fallback, never used when a provider succeeds |
| Dimensions | 1536 (`EMBEDDING_DIMENSIONS`), unchanged by the Jina switch — **no migration required** |
| Metric | cosine distance `<=>` (`vector_cosine_ops`) |
| Index | HNSW (ADR-012) — `idx_item_embeddings_vec`, `idx_item_embeddings_user` |

Row `model` default is `text-embedding-3-small`; rows written by Jina store `jina-embeddings-v4`, fallback rows store `deterministic-fallback-v1`. Cosine search is model-agnostic: mixed rows remain comparable, and per-model uniqueness is preserved by `uq_item_embeddings_item_model (item_id, model)`.

### 4.2 Query Pattern

```ts
// filter by user (B-tree idx_item_embeddings_user) + order by distance (HNSW)
const similar = await db
  .select({ itemId: itemEmbeddings.itemId, distance: sql<number>`${itemEmbeddings.embedding} <=> ${vec}` })
  .from(itemEmbeddings)
  .where(eq(itemEmbeddings.userId, userId))
  .orderBy(sql`${itemEmbeddings.embedding} <=> ${vec}`)
  .limit(10);
```

---

## 5. Indexes & Constraints

### 5.1 Indexes

| Index | Type | Columns |
|-------|------|---------|
| idx_item_embeddings_vec | HNSW cosine | embedding |
| idx_item_embeddings_user | B-tree | user_id |
| uq_item_embeddings_item_model | unique | item_id, model |
| idx_clothing_items_user_status | B-tree | user_id, status |
| idx_clothing_items_user_type | B-tree | user_id, type |
| idx_clothing_items_user_created | B-tree | user_id, created_at DESC |
| idx_clothing_items_seasons | GIN | seasons[] |
| idx_clothing_items_ai_pending | partial B-tree | ai_status IN (pending, processing) |
| idx_item_photos_item_sort | B-tree | item_id, sort_order |
| uq_item_photos_primary | partial unique | (item_id) WHERE is_primary |
| idx_outfits_user_created | B-tree | user_id, created_at DESC |
| idx_outfits_user_status | B-tree | user_id, status |
| idx_outfit_items_outfit_pos | B-tree | outfit_id, position |
| idx_outfit_items_item | B-tree | item_id |
| idx_wear_log_user_worn | B-tree | user_id, worn_at DESC |
| idx_wear_log_items_log | B-tree | wear_log_id |
| idx_wear_log_items_item | B-tree | item_id |
| idx_outfit_feedback_user_outfit_action | B-tree | user_id, outfit_id, action |
| idx_fashion_memories_user_status | B-tree | user_id, status |
| idx_fashion_memories_user_type | B-tree | user_id, type |
| idx_fashion_memories_user_status_conf | B-tree | user_id, status, confidence DESC |
| idx_memory_evidence_memory | B-tree | memory_id, created_at |
| idx_analytics_user_event_created | B-tree | user_id, event_name, created_at |

### 5.2 CHECK Constraints

- `clothing_items.formality` BETWEEN 1 AND 5
- `clothing_items.ai_confidence` IS NULL OR BETWEEN 0 AND 1
- `outfit_feedback.rating` BETWEEN 1 AND 4
- `fashion_memories.confidence` BETWEEN 0 AND 1
- `fashion_memories.consistency` BETWEEN 0 AND 1
- `memory_evidence.confidence` IS NULL OR BETWEEN 0 AND 1

### 5.3 FK Behavior

| Relation | On Delete |
|----------|-----------|
| * → users | CASCADE |
| item_photos → clothing_items | CASCADE |
| item_embeddings → clothing_items / users | CASCADE |
| outfit_items → outfits / clothing_items | CASCADE |
| wear_log → users | CASCADE; → outfits | SET NULL |
| wear_log_items → wear_log | CASCADE; → clothing_items | SET NULL |
| outfit_feedback → outfits / clothing_items | SET NULL |
| memory_evidence → fashion_memories | CASCADE |

---

## 6. Migrations

### 6.1 Workflow

```
1. Edit module schema .ts files
2. npm run db:generate          # review generated SQL in src/lib/db/migrations/
3. npm run db:migrate           # apply to Neon
4. Verify: npm run build && npx tsc --noEmit
```

### 6.2 Current Migration

`src/lib/db/migrations/0000_initial.sql` — creates `vector` extension (first statement), 14 tables, all indexes/constraints. Applied to Neon (verified 2026-08-07).

> Note: drizzle-kit 0.30 does not emit `CREATE EXTENSION vector` — it must be added manually as the first statement of the initial migration (or run once on a fresh database).

### 6.3 Rollback

Postgres + Drizzle have no automatic rollback. Revert = write a new migration reversing the change. Never edit an applied migration.

---

## 7. Seeding

`npm run db:seed` (tsx, idempotent):

- **Demo user:** `demo_user` / `demo@looksy.app`, location San Francisco
- **12 clothing items** (Uniqlo, Levi's, COS, Nike, H&M, Zara, Massimo Dutti, The North Face, Everlane, Carhartt, Mango, Vans) with photos and 1536-dim embeddings
- **4 outfits:** Meeting Ready, Weekend Casual, Warm Layers, Summer Brunch — with scores, evidence, generation context
- **Wear log:** 3 sessions + 13 wear_log_items rows; `wear_count`/`last_worn` denormalized updates
- **Feedback:** 5 events (wear/save/wear/skip/swap)
- **Memories:** 4 fashion memories + 6 evidence rows; style profile with vector + DNA

Embeddings are deterministic pseudo-random normalized vectors (LCG + normalize) — no OpenAI calls in seed. Re-running seed skips when `demo_user` exists.

---

## 8. Deviation Log from v1.0

| v1.0 doc | v2.0 (implemented) | Reason / ADR |
|----------|--------------------|--------------|
| UUIDv4 `defaultRandom()` | UUIDv7 `$defaultFn(uuidv7)` | ADR-011 |
| ivfflat `lists: 100` | HNSW cosine | ADR-012 |
| `wear_log.item_ids uuid[]` | `wear_log` + `wear_log_items` | ADR-013 |
| DB trigger `update_memory_confidence()` | app-layer decay | ADR-014 |
| evidence JSONB array on memories | `memory_evidence` table | ADR-015 |
| `plans` + `user_subscriptions` tables | not created (Phase 2) | ADR-016 |
| free-form varchars, no types | varchar + TS unions + CHECKs | ADR-017 |
| `is_saved` boolean on outfits | `outfits.status` lifecycle | ADR-020 |
| `seasons jsonb` | `seasons text[]` + GIN index | JSONB→array, queryable |
| `wear_log.feedback jsonb` | `outfit_feedback` table (action/rating/context) | structured feedback |
| `user_style_vectors` | `user_style_profiles` (+ dna, counters) | DNA summary payload |
| `gen_random_uuid()` in SQL | app-layer UUIDv7 | Neon/pooler independence |
| no dimension column | `dimension` on item_embeddings | model change safety |
| `clothing_items.metadata` free jsonb | typed `ItemMetadata` + AI block columns | AI pipeline state machine |

---

*Schema implemented in Phase 2 — Database Layer. All deviations from v1.0 are recorded in ARCHITECTURE_DECISIONS.md (ADR-011..020).*
