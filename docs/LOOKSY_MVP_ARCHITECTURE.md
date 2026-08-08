# LOOKSY — MVP Architecture

> Version: 1.0 | Status: Active | Last updated: 2026-08-08
> Refactored from: LOOKSY_ARCHITECTURE.md (enterprise version)

---

## Table of Contents

1. [Architecture Audit Summary](#1-architecture-audit-summary)
2. [MVP System Architecture](#2-mvp-system-architecture)
3. [Modular Monolith Structure](#3-modular-monolith-structure)
4. [Technology Stack](#4-technology-stack)
5. [Module Responsibilities](#5-module-responsibilities)
6. [Data Flow (Simplified)](#6-data-flow-simplified)
7. [Database Design](#7-database-design)
8. [AI Integration](#8-ai-integration)
9. [API Surface](#9-api-surface)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Scalability Path](#11-scalability-path)
12. [Architecture Decision Records](#12-architecture-decision-records)

---

## 1. Architecture Audit Summary

### 1.1 What Changed from Enterprise Version

| Enterprise | MVP | Reason |
|-----------|-----|--------|
| 7 microservices | 1 modular monolith | No team to operate microservices |
| Kubernetes | Vercel | Managed infrastructure, zero DevOps |
| Kafka | Server Actions + async patterns | Overkill for < 10K users |
| API Gateway (Kong/Traefik) | Next.js middleware | Gateway is one middleware function |
| Redis | Removed (not needed yet) | Clerk handles sessions, no rate limiting needed at MVP scale |
| Separate vector DB (Qdrant/Pinecone) | pgvector | One fewer service, PostgreSQL already exists |
| S3/R2 | Supabase Storage | Integrated with Supabase stack |
| NestJS backend | Next.js API Routes | Single framework, one deployment |
| Custom ML models | Pure API calls (OpenAI) | No ML ops team |
| Multi-region | Single region | No global user base yet |

### 1.2 What Was Preserved

- Clean module boundaries (same domain decomposition)
- Each module owns its data (separation preserved)
- Event-driven patterns available via async functions
- AI abstraction layer for provider switching
- All core product features identical
- Path to microservice extraction when needed

### 1.3 Design Constraints

| Constraint | Value |
|-----------|-------|
| Team size | 1–5 developers |
| Time to MVP | 8–12 weeks |
| Budget | Minimal infrastructure spend (< $100/mo at launch) |
| Target users | 5,000 registered in first 3 months |
| Platform | Web-first (Next.js), mobile later |
| Deployment | Zero-config (Vercel + Supabase) |

---

## 2. MVP System Architecture

### 2.1 High-Level Diagram

```
┌──────────────────────────────────────────────────────────┐
│                      CLIENT BROWSER                       │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │              Next.js 16 (App Router)               │  │
│  │                                                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │  │
│  │  │  React   │  │  shadcn  │  │   TanStack   │   │  │
│  │  │Components│  │  /ui     │  │    Query     │   │  │
│  │  └──────────┘  └──────────┘  └──────────────┘   │  │
│  │                                                    │  │
│  └──────────────────────┬─────────────────────────────┘  │
│                         │                                │
└─────────────────────────┼────────────────────────────────┘
                          │ HTTPS (same origin)
                          ▼
┌──────────────────────────────────────────────────────────┐
│                  Next.js API Routes                       │
│                  + Server Actions                         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Middleware (auth + rate limit)        │   │
│  │     Clerk Auth | Request validation | Logging     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Modular Monolith Backend              │   │
│  │                                                    │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐           │   │
│  │  │ auth │ │users │ │closet│ │outfits│           │   │
│  │  └──────┘ └──────┘ └──────┘ └──────┘           │   │
│  │                                                    │   │
│  │  ┌──────┐ ┌──────────┐ ┌──────────┐            │   │
│  │  │  ai  │ │recommend.│ │analytics │            │   │
│  │  └──────┘ └──────────┘ └──────────┘            │   │
│  │                                                    │   │
│  │  ┌──────────────┐                                │   │
│  │  │subscriptions │                                │   │
│  │  └──────────────┘                                │   │
│  │                                                    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└──────┬──────────────┬───────────────┬────────────────────┘
       │              │               │
       ▼              ▼               ▼
┌────────────┐ ┌────────────┐ ┌────────────────┐
│ Supabase   │ │ Supabase   │ │   OpenAI API   │
│ PostgreSQL │ │  Storage   │ │                │
│ + pgvector │ │ (Photos)   │ │ GPT-4o Vision  │
│            │ │            │ │ Embeddings     │
└────────────┘ └────────────┘ └────────────────┘
       │
       ▼
┌────────────────────────┐
│   Clerk (Auth)         │
│   - Google OAuth       │
│   - Apple OAuth        │
│   - Email/Password     │
└────────────────────────┘
```

### 2.2 Key Architectural Principles

1. **Single Deployment Unit:** Everything deploys as one Next.js application on Vercel.
2. **Module Boundaries via Folders:** Enforce separation through directory structure and import rules, not network boundaries.
3. **Database-per-Module (logical):** Each module owns specific tables. Cross-module reads go through module's public API.
4. **AI as a Service Call:** No self-hosted ML. All AI goes through OpenAI API with abstraction layer.
5. **Server Components by Default:** Only use Client Components when interactivity requires it.
6. **Type Safety End-to-End:** Drizzle schema → TypeScript types → API → React components.

---

## 3. Modular Monolith Structure

### 3.1 Project Structure

```
looksy/
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth pages (sign-in, sign-up)
│   │   ├── (dashboard)/              # Main app pages
│   │   │   ├── closet/               # Wardrobe browsing
│   │   │   ├── outfits/              # Outfit generation & history
│   │   │   ├── profile/              # User profile & style profile
│   │   │   └── settings/             # Account settings
│   │   ├── api/                      # API Routes
│   │   │   ├── closet/
│   │   │   ├── outfits/
│   │   │   ├── ai/
│   │   │   ├── recommendations/
│   │   │   └── webhooks/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── modules/                      # Domain Modules
│   │   ├── auth/                     # Authentication & authorization
│   │   │   ├── index.ts              # Public API
│   │   │   ├── middleware.ts         # Auth middleware
│   │   │   └── service.ts           # Business logic
│   │   │
│   │   ├── users/                    # User profile & preferences
│   │   │   ├── index.ts
│   │   │   ├── schema.ts            # Drizzle schema (users, preferences)
│   │   │   └── service.ts
│   │   │
│   │   ├── closet/                   # Wardrobe items management
│   │   │   ├── index.ts
│   │   │   ├── schema.ts            # Drizzle schema (items, photos, tags)
│   │   │   ├── service.ts
│   │   │   └── ai-classifier.ts     # AI vision integration
│   │   │
│   │   ├── outfits/                  # Outfit generation & management
│   │   │   ├── index.ts
│   │   │   ├── schema.ts            # Drizzle schema (outfits, wear_log)
│   │   │   ├── service.ts
│   │   │   └── generator.ts         # Outfit generation logic
│   │   │
│   │   ├── ai/                       # AI abstraction layer
│   │   │   ├── index.ts
│   │   │   ├── client.ts            # OpenAI client wrapper
│   │   │   ├── vision.ts            # Image analysis
│   │   │   ├── embeddings.ts        # Embedding generation
│   │   │   └── llm.ts              # Text generation / chat
│   │   │
│   │   ├── recommendations/         # Outfit & item recommendations
│   │   │   ├── index.ts
│   │   │   ├── schema.ts            # Drizzle schema (embeddings, scores)
│   │   │   ├── service.ts
│   │   │   └── similarity.ts        # pgvector similarity search
│   │   │
│   │   ├── analytics/               # Event tracking & metrics
│   │   │   ├── index.ts
│   │   │   ├── schema.ts            # Drizzle schema (events)
│   │   │   └── service.ts
│   │   │
│   │   └── subscriptions/           # Subscription & billing
│   │       ├── index.ts
│   │       ├── schema.ts            # Drizzle schema (subscriptions)
│   │       └── service.ts
│   │
│   ├── lib/                          # Shared utilities
│   │   ├── db/                       # Database connection & migrations
│   │   │   ├── client.ts
│   │   │   ├── schema.ts            # Aggregated schema for Drizzle
│   │   │   └── migrations/
│   │   ├── storage.ts               # Supabase Storage wrapper
│   │   ├── weather.ts               # Weather API client
│   │   ├── validators.ts            # Shared Zod schemas
│   │   └── errors.ts               # Error types & handling
│   │
│   ├── components/                   # Shared UI components (design system)
│   │   ├── ui/                       # shadcn/ui base components
│   │   ├── closet/                   # Closet-specific components
│   │   ├── outfits/                  # Outfit-specific components
│   │   └── layout/                   # Layout components (nav, sidebar)
│   │
│   └── hooks/                        # Shared React hooks
│       ├── use-clotser.ts
│       ├── use-outfits.ts
│       └── use-ai.ts
│
├── public/                           # Static assets
├── drizzle.config.ts                 # Drizzle ORM config
├── next.config.ts                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── components.json                   # shadcn/ui config
└── package.json
```

### 3.2 Module Isolation Rules

Each module follows the same internal pattern:

```
modules/closet/
├── index.ts          # PUBLIC API — only file imported by other modules
├── schema.ts         # Database tables (Drizzle)
├── service.ts        # Business logic (pure functions + DB calls)
├── ai-classifier.ts  # Internal implementation detail
└── types.ts          # TypeScript types (not exported from index)
```

**Rules:**

1. Modules import from other modules' `index.ts` only — never from internal files.
2. A module's `types.ts` is internal — exposed types go through `index.ts`.
3. Cross-module data access happens through service calls, not direct table queries.
4. Shared database client lives in `lib/db/` — each module imports it.

**Enforcement:** ESLint rule `no-restricted-imports` blocks cross-module internal imports.

### 3.3 Module Dependency Graph

```
auth ──────────────────────────────────┐
  │                                    │
  ▼                                    │
users ─────────────────────────────┐   │
  │                                │   │
  ▼                                ▼   │
closet ──────────────────┐    recommendations
  │                       │         ▲
  │                       ▼         │
  │                    outfits ─────┘
  │                       │
  ▼                       ▼
  └──────────► ai ◄───────┘
                  ▲
                  │
              analytics (reads from all modules)
              subscriptions (reads from users)
```

**Dependency direction:** auth → users → closet → outfits → ai → recommendations.

No circular dependencies. Analytics and subscriptions are leaf modules that read but are not depended upon.

---

## 4. Technology Stack

### 4.1 Complete Stack

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| **Framework** | Next.js | 16.x | App Router, Server Actions, streaming, React 19 |
| **Language** | TypeScript | 5.x | End-to-end type safety |
| **React** | React | 19.x | Server Components, Suspense, use() |
| **Styling** | Tailwind CSS | 4.x | Utility-first, design system foundation |
| **UI Components** | shadcn/ui | latest | Accessible, customizable, copy-paste components |
| **State Management** | TanStack Query | 5.x | Server state, caching, optimistic updates |
| **Form Handling** | React Hook Form + Zod | latest | Validated forms with type inference |
| **ORM** | Drizzle ORM | latest | Type-safe, SQL-like, lightweight |
| **Database** | PostgreSQL (Supabase) | 15+ | pgvector for embeddings, familiar SQL |
| **Auth** | Clerk | latest | OAuth, sessions, user management, middleware |
| **Storage** | Supabase Storage | latest | Photo storage, CDN, image transformations |
| **AI** | OpenAI API | latest | GPT-4o (vision + text), embeddings |
| **Weather** | OpenWeatherMap API | — | Free tier, current conditions |
| **Deployment** | Vercel | — | Zero-config, edge functions, preview deploys |
| **Monitoring** | Vercel Analytics + Sentry | — | Performance + error tracking |
| **CI/CD** | GitHub Actions | — | Lint, typecheck, test on PR |

### 4.2 What Was Removed and Why

| Removed | Why It's Not Needed for MVP |
|---------|----------------------------|
| **Kubernetes** | Vercel handles scaling, no container orchestration needed |
| **Kafka / Redis Streams** | Server Actions + async patterns handle async work |
| **API Gateway** | Next.js middleware handles auth, rate limiting not needed at MVP scale |
| **Redis** | Clerk manages sessions, no custom session store needed |
| **Separate Vector DB** | pgvector handles embedding search within PostgreSQL |
| **S3 / R2** | Supabase Storage is integrated and simpler |
| **GraphQL** | REST + Server Actions cover all MVP data needs |
| **NestJS** | Next.js API Routes are sufficient, one less dependency |
| **Custom ML Models** | OpenAI API provides state-of-the-art without training |
| **OpenTelemetry** | Vercel + Sentry provide sufficient observability |

---

## 5. Module Responsibilities

### 5.1 Auth Module

**Boundary:** User identity, session management, authentication middleware.

| Responsibility | Implementation |
|---------------|----------------|
| User registration | Clerk (Google, Apple, Email) |
| Session management | Clerk handles entirely |
| Auth middleware | `clerkMiddleware()` in Next.js middleware |
| User ID extraction | `auth()` helper in Server Components / API Routes |
| Webhook sync | Clerk webhook → create/update user in our DB |

**Tables owned:** None (Clerk is source of truth for auth data). We store `clerk_user_id` in our `users` table for linking.

### 5.2 Users Module

**Boundary:** User profile, preferences, settings.

| Responsibility | Implementation |
|---------------|----------------|
| User profile | Name, avatar, location (for weather) |
| Style preferences | Visual quiz results, stated preferences |
| Notification settings | Push/email preferences |
| Account management | Profile updates, account deletion |

**Tables owned:** `users`, `user_preferences`, `style_quiz_results`

### 5.3 Closet Module

**Boundary:** Wardrobe items, photos, categorization.

| Responsibility | Implementation |
|---------------|----------------|
| Item CRUD | Create, read, update, delete clothing items |
| Photo upload | Upload to Supabase Storage, get URL |
| AI classification | Call AI module for item analysis |
| Metadata management | Type, color, pattern, material, season, brand |
| Search & filter | PostgreSQL full-text + faceted queries |
| Item lifecycle | Active → archived → deleted |

**Tables owned:** `clothing_items`, `item_photos`

**Key flow:** Photo upload → AI classification → metadata saved → embedding generated (via AI module) → item searchable.

### 5.4 Outfits Module

**Boundary:** Outfit creation, history, wear tracking.

| Responsibility | Implementation |
|---------------|----------------|
| Outfit generation | Coordinate with AI module for outfit combinations |
| Outfit storage | Save outfit combinations with metadata |
| Wear tracking | Mark outfits as worn, update item wear counts |
| History | Calendar view, past outfit queries |
| Constraints | Weather + occasion filtering |

**Tables owned:** `outfits`, `outfit_items`, `wear_log`

### 5.5 AI Module

**Boundary:** AI abstraction layer, all OpenAI interactions.

| Responsibility | Implementation |
|---------------|----------------|
| Vision analysis | Image → structured clothing metadata |
| Embedding generation | Item → vector for similarity search |
| Text generation | Conversational AI, outfit explanations |
| Provider abstraction | Interface for switching AI providers |

**Tables owned:** `item_embeddings` (vectors stored via pgvector)

**Internal files:**
- `client.ts` — OpenAI client initialization, retry logic, rate limiting
- `vision.ts` — `analyzeClothingItem(imageUrl) → ClothingMetadata`
- `embeddings.ts` — `generateEmbedding(text) → float[]`, `generateImageEmbedding(imageUrl) → float[]`
- `llm.ts` — `generateOutfitRecommendation(context) → OutfitSuggestion[]`

### 5.6 Recommendations Module

**Boundary:** Outfit scoring, similarity search, wardrobe analysis.

| Responsibility | Implementation |
|---------------|----------------|
| Similarity search | pgvector cosine similarity for items |
| Outfit scoring | Color harmony, style coherence, weather fit |
| Gap analysis | Identify missing wardrobe pieces |
| Style profile | Compute and update user style vector |
| Daily suggestions | Pre-computed outfit recommendations |

**Tables owned:** `user_style_vectors`, `recommendation_scores`

### 5.7 Analytics Module

**Boundary:** Event tracking, usage metrics, business intelligence.

| Responsibility | Implementation |
|---------------|----------------|
| Event ingestion | Server-side event logging |
| Usage metrics | DAU, feature usage, session length |
| Business metrics | Upload counts, outfit generations, retention |
| Product analytics | Funnel analysis, feature adoption |

**Tables owned:** `analytics_events`

### 5.8 Subscriptions Module

**Boundary:** Billing, plan management, feature gates.

| Responsibility | Implementation |
|---------------|----------------|
| Plan management | Free / Pro tiers |
| Feature gates | Limits on items, outfit generations |
| Billing | Integration with Stripe (via Clerk or direct) |
| Trial management | Free trial period logic |

**Tables owned:** `user_subscriptions`

---

## 6. Data Flow (Simplified)

### 6.1 Photo → Closet Item (MVP)

```
User uploads photo
│
├── 1. Client uploads to Supabase Storage
│   └── Returns: public URL
│
├── 2. Server Action: processClothingItem(photoUrl)
│   │
│   ├── 3. AI Module → OpenAI GPT-4o Vision
│   │   ├── Send image with structured prompt
│   │   ├── Receive: { type, subType, colors[], pattern, material, season, formality }
│   │   └── Time: ~2-4 seconds
│   │
│   ├── 4. Save to database
│   │   ├── Insert clothing_items row
│   │   └── Insert item_photos row
│   │
│   ├── 5. AI Module → Generate embedding
│   │   ├── Create text description from metadata
│   │   ├── Jina AI jina-embeddings-v4 (1536-dim; deterministic fallback)
│   │   └── Save to item_embeddings (pgvector)
│   │
│   └── 6. Return item to client
│       └── Client updates UI (TanStack Query invalidation)
```

### 6.2 Outfit Generation (MVP)

```
User taps "Generate Outfit"
│
├── 1. Server Action: generateOutfit(context)
│   │
│   ├── 2. Fetch context
│   │   ├── User's closet items (from DB)
│   │   ├── Current weather (OpenWeatherMap API)
│   │   ├── Recent outfit history (avoid repeats)
│   │   └── User style preferences
│   │
│   ├── 3. Filter candidates
│   │   ├── Season-appropriate items only
│   │   ├── Weather-suitable items
│   │   └── Exclude recently worn (7-day cooldown)
│   │
│   ├── 4. AI Module → OpenAI GPT-4o
│   │   ├── System prompt with style rules
│   │   ├── User's filtered items (with photos/metadata)
│   │   ├── Context (weather, occasion)
│   │   └── Receive: 3-5 outfit combinations with explanations
│   │
│   ├── 5. Score and rank
│   │   ├── Color harmony score
│   │   ├── Style coherence score
│   │   ├── Weather fit score
│   │   └── Rotation score (prefer underused items)
│   │
│   ├── 6. Save to database
│   │   └── Insert outfits + outfit_items rows
│   │
│   └── 7. Return ranked outfits to client
│       └── Client renders outfit cards
```

### 6.3 Embedding Similarity (MVP)

```
"Find items like this" / "Complete this outfit"
│
├── 1. Take reference item (or user query)
│
├── 2. Get embedding
│   ├── If item: fetch from item_embeddings table
│   └── If text: generate via OpenAI embeddings API
│
├── 3. pgvector similarity search
│   └── SELECT * FROM item_embeddings
│       WHERE user_id = ?
│       ORDER BY embedding <=> $query_vector
│       LIMIT 10;
│
├── 4. Enrich results
│   ├── Join with clothing_items for metadata
│   └── Join with item_photos for images
│
└── 5. Return similar items
```

---

## 7. Database Design

### 7.1 Schema Overview (Drizzle)

```sql
-- Core tables managed by Drizzle ORM

-- Users (synced from Clerk via webhook)
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    email         VARCHAR(255) NOT NULL,
    name          VARCHAR(255),
    avatar_url    TEXT,
    location      JSONB,  -- { city, lat, lon } for weather
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences
CREATE TABLE user_preferences (
    user_id           UUID PRIMARY KEY REFERENCES users(id),
    style_preferences JSONB,  -- { aesthetics: [], formality: 1-5, ... }
    notification_settings JSONB,
    quiz_completed    BOOLEAN DEFAULT FALSE
);

-- Clothing Items
CREATE TABLE clothing_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    type        VARCHAR(50) NOT NULL,    -- shirt, pants, dress, jacket, shoes, accessory
    sub_type    VARCHAR(100),            -- button-down, slim-fit, etc.
    brand       VARCHAR(255),
    material    VARCHAR(100),
    pattern     VARCHAR(50),             -- solid, striped, plaid, floral
    colors      JSONB NOT NULL,          -- [{ name: "navy", hex: "#000080" }]
    season      JSONB NOT NULL,          -- ["spring", "fall"]
    formality   INTEGER DEFAULT 3,       -- 1-5 scale
    condition   VARCHAR(50) DEFAULT 'good',
    status      VARCHAR(20) DEFAULT 'active',  -- active, archived, donated
    wear_count  INTEGER DEFAULT 0,
    last_worn   TIMESTAMPTZ,
    metadata    JSONB,                   -- additional AI-extracted data
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Item Photos
CREATE TABLE item_photos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id     UUID NOT NULL REFERENCES clothing_items(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,           -- Supabase Storage URL
    thumbnail   TEXT,                    -- thumbnail URL
    is_primary  BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Item Embeddings (pgvector)
CREATE TABLE item_embeddings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id     UUID NOT NULL REFERENCES clothing_items(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id),
    embedding   vector(1536),            -- jina-embeddings-v4 dimension (1536)
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_item_embeddings_user ON item_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Outfits
CREATE TABLE outfits (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id),
    name        VARCHAR(255),
    occasion    VARCHAR(100),
    weather     JSONB,                   -- { temp, condition }
    explanation TEXT,                    -- AI-generated "why this works"
    is_saved    BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Outfit Items (junction table)
CREATE TABLE outfit_items (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outfit_id UUID NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
    item_id   UUID NOT NULL REFERENCES clothing_items(id),
    position  INTEGER DEFAULT 0          -- display order
);

-- Wear Log
CREATE TABLE wear_log (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id),
    outfit_id  UUID REFERENCES outfits(id),
    item_ids   UUID[] NOT NULL,          -- array of item IDs worn
    worn_at    TIMESTAMPTZ DEFAULT NOW(),
    occasion   VARCHAR(100)
);

-- User Style Vectors (updated periodically)
CREATE TABLE user_style_vectors (
    user_id    UUID PRIMARY KEY REFERENCES users(id),
    style_vec  vector(1536),
    computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Events
CREATE TABLE analytics_events (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID REFERENCES users(id),
    event_name VARCHAR(100) NOT NULL,
    properties JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);

-- Subscriptions
CREATE TABLE user_subscriptions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id),
    plan          VARCHAR(50) NOT NULL DEFAULT 'free',  -- free, pro
    status        VARCHAR(50) NOT NULL DEFAULT 'active',
    stripe_sub_id VARCHAR(255),
    current_period_end TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.2 Key Indexes

```sql
-- Performance indexes
CREATE INDEX idx_clothing_items_user ON clothing_items(user_id);
CREATE INDEX idx_clothing_items_type ON clothing_items(user_id, type);
CREATE INDEX idx_clothing_items_status ON clothing_items(user_id, status);
CREATE INDEX idx_outfits_user ON outfits(user_id);
CREATE INDEX idx_wear_log_user_date ON wear_log(user_id, worn_at DESC);
CREATE INDEX idx_item_photos_item ON item_photos(item_id);
```

### 7.3 Free Tier Limits

| Resource | Free | Pro |
|----------|------|-----|
| Closet items | 50 | Unlimited |
| Outfit generations / day | 5 | 50 |
| Photos storage | 500 MB | 10 GB |
| Saved outfits | 10 | Unlimited |

---

## 8. AI Integration

### 8.1 AI Abstraction Layer

```typescript
// Conceptual interface (not implementation)

interface AIVisionProvider {
  analyzeClothingItem(imageUrl: string): Promise<ClothingMetadata>;
}

interface AIEmbeddingProvider {
  generateTextEmbedding(text: string): Promise<number[]>;
  generateImageEmbedding(imageUrl: string): Promise<number[]>;
}

interface AIStylistProvider {
  generateOutfits(context: OutfitContext): Promise<OutfitSuggestion[]>;
  explainOutfit(items: ClothingItem[]): Promise<string>;
  chat(messages: ChatMessage[], context: UserContext): AsyncIterable<string>;
}
```

All providers are injected via module configuration. Swapping OpenAI for another provider requires implementing these interfaces — no changes to business logic.

### 8.2 AI API Usage

| Feature | Model | Token Cost (approx) | Frequency |
|---------|-------|---------------------|-----------|
| Item classification (vision) | OpenAI-compatible vision (`qwen3.7-plus` via OpenCode) | ~500 tokens per image | Per upload |
| Outfit generation | OpenAI-compatible (`deepseek-v4-flash` via OpenCode) | ~2,000 tokens per request | Per generation |
| Embeddings | Jina AI jina-embeddings-v4 (1536-dim) | ~100 tokens per item | Per upload |
| Chat (future) | OpenAI-compatible | ~1,000 tokens per message | Per message |

**Estimated cost at 5,000 users, 25 items avg:** ~$150–300/month.

### 8.3 Prompt Architecture

**Item Classification Prompt:**
```
Analyze this clothing item photo. Return JSON with:
- type: (shirt, pants, dress, jacket, shoes, accessory, bag, jewelry, other)
- subType: specific variant (e.g., "button-down", "slim-fit chinos")
- colors: array of { name, hex } for dominant colors
- pattern: (solid, striped, plaid, floral, abstract, geometric, animal, other)
- material: estimated material (cotton, denim, leather, silk, wool, synthetic, other)
- season: array of suitable seasons (spring, summer, fall, winter)
- formality: 1-5 scale (1=very casual, 5=very formal)
- brand: if logo visible, otherwise null
- confidence: 0-1 score for overall classification confidence
```

**Outfit Generation Prompt:**
```
You are a personal stylist. Given a user's wardrobe items (with photos and metadata),
current weather ({temp}°F, {condition}), and occasion ({occasion}),
generate {count} outfit combinations.

For each outfit:
1. Select 3-6 items that work together
2. Explain why this combination works
3. Rate: color harmony (1-5), style coherence (1-5), weather fit (1-5)

Rules:
- Prioritize items the user hasn't worn recently
- Vary formality based on occasion
- Ensure color compatibility
- Consider material suitability for weather
```

---

## 9. API Surface

### 9.1 API Routes (REST)

```
Authentication (via Clerk middleware — no custom routes needed)

Closet:
GET    /api/closet                    # List items (with filters)
POST   /api/closet                    # Add item (photo URL + trigger AI)
GET    /api/closet/:id                # Item detail
PATCH  /api/closet/:id                # Update item metadata
DELETE /api/closet/:id                # Remove item
POST   /api/closet/upload-url         # Get presigned upload URL

Outfits:
GET    /api/outfits                   # List outfits
POST   /api/outfits/generate          # Generate outfit (AI)
POST   /api/outfits                   # Save manual outfit
GET    /api/outfits/:id               # Outfit detail
DELETE /api/outfits/:id               # Remove outfit
POST   /api/outfits/:id/wear          # Mark as worn
GET    /api/outfits/history           # Wear history

Recommendations:
GET    /api/recommendations/similar/:itemId   # Similar items
GET    /api/recommendations/gaps              # Wardrobe gaps
GET    /api/recommendations/daily             # Daily suggestions

Analytics:
POST   /api/analytics/events          # Track event

Subscriptions:
GET    /api/subscription              # Current plan
POST   /api/subscription/checkout     # Start checkout
```

### 9.2 Server Actions (for mutations)

```
closet/actions.ts:
  - addToCloset(photoFile)  — upload + AI classify + save
  - updateClothingItem(id, data)
  - archiveClothingItem(id)

outfits/actions.ts:
  - generateOutfit(context)
  - saveOutfit(outfitData)
  - markOutfitAsWorn(outfitId)

recommendations/actions.ts:
  - refreshStyleProfile()
```

### 9.3 Real-Time (MVP: Polling)

MVP uses TanStack Query polling for updates after AI processing:
- Upload item → poll status every 2s until processing complete
- Generate outfit → Server Action returns synchronously (streaming in v1.1)
- No WebSocket needed at MVP scale

---

## 10. Deployment Architecture

### 10.1 Infrastructure (All Managed)

```
┌─────────────────────────────────────────────────────┐
│                   VERCEL                              │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  Next.js Application                           │ │
│  │  - Edge Middleware (auth, rate limiting)        │ │
│  │  - Server Components (page rendering)          │ │
│  │  - Server Actions (mutations)                  │ │
│  │  - API Routes (REST endpoints)                 │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │   Preview    │  │   Preview    │  (per PR)      │
│  │   Deploy     │  │   Deploy     │                 │
│  └──────────────┘  └──────────────┘                 │
│                                                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   SUPABASE                            │
│                                                      │
│  ┌──────────────────┐  ┌──────────────────────────┐│
│  │   PostgreSQL 15   │  │   Storage (Photos)       ││
│  │   + pgvector      │  │   - Public buckets        ││
│  │   - 500MB free    │  │   - Image transformations ││
│  │   - Connection    │  │   - CDN distribution      ││
│  │     pooling       │  │                           ││
│  └──────────────────┘  └──────────────────────────┘│
│                                                      │
│  ┌──────────────────┐                               │
│  │  Realtime (future)│                               │
│  └──────────────────┘                               │
│                                                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                    CLERK                              │
│  ┌────────────────────────────────────────────────┐ │
│  │  - Google OAuth                                │ │
│  │  - Apple OAuth                                 │ │
│  │  - Email/Password                              │ │
│  │  - Session management                          │ │
│  │  - User management dashboard                   │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              AI PROVIDERS (env-config)               │
│  ┌────────────────────────────────────────────────┐ │
│  │  Chat/vision: OpenAI-compatible endpoint       │ │
│  │    (deepseek-v4-flash / qwen3.7-plus)          │ │
│  │  Embeddings: Jina AI jina-embeddings-v4        │ │
│  │    (deterministic fallback if unavailable)     │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 10.2 Environments

| Environment | Branch | URL | Database |
|------------|--------|-----|----------|
| Development | `main` | `localhost:3000` | Local Supabase or `dev` schema |
| Preview | PR branch | `looksy-git-{branch}.vercel.app` | Supabase preview project |
| Production | `main` (after merge) | `looksy.app` | Supabase production |

### 10.3 CI/CD Pipeline

```
Pull Request Created
│
├── Lint (ESLint + Prettier)
├── Type Check (tsc --noEmit)
├── Unit Tests (Vitest)
├── Build (next build)
├── Preview Deploy (Vercel)
└── Visual Regression (optional)

Merged to Main
│
├── All PR checks pass
├── Production Deploy (Vercel)
├── Database Migration (drizzle-kit push)
└── Post-deploy Smoke Test
```

### 10.4 Cost Estimate (Monthly)

| Service | Free Tier | Paid (at 5K users) |
|---------|-----------|---------------------|
| Vercel | $0 (hobby) | $20/mo (pro) |
| Supabase | $0 (2 projects) | $25/mo (pro) |
| Clerk | $0 (10K MAU) | $25/mo (10K MAU) |
| OpenAI | Pay-per-use | ~$150–300/mo |
| Sentry | $0 (5K errors) | $26/mo (team) |
| **Total** | **$0** | **~$250–400/mo** |

---

## 11. Scalability Path

### 11.1 When to Evolve

The modular monolith is designed to be extracted into services when specific triggers are hit:

| Trigger | Threshold | Action |
|---------|-----------|--------|
| **Team growth** | > 5 developers | Split into 2-3 services by team ownership |
| **Traffic spike** | > 100K DAU | Extract AI-heavy endpoints to separate service |
| **AI cost optimization** | > $1K/mo OpenAI | Fine-tune smaller model, self-host |
| **Geographic expansion** | Multi-region users | Add Redis for sessions, separate read replicas |
| **Feature complexity** | Shopping/social features | Extract as independent services |

### 11.2 Extraction Strategy

```
Phase 0 (MVP): Modular Monolith on Vercel
    │
    ├── All code in one repo
    ├── All modules in /modules
    ├── Single database
    └── Single deployment
    │
Phase 1 (~6 months): Service Boundaries Emerge
    │
    ├── AI module → separate Vercel serverless function
    │   (already isolated by module boundary)
    ├── Shopping module → separate service
    │   (new domain, natural extraction point)
    └── Still one deployment, but logical separation
    │
Phase 2 (~12 months): True Services
    │
    ├── AI Service → separate deployment (GPU for self-hosted models)
    ├── Closet Service → PostgreSQL with read replicas
    ├── API Gateway → explicit service routing
    └── Redis → session store, rate limiting, caching
    │
Phase 3 (~18 months): Full Microservices
    │
    ├── Each service owns its database
    ├── Event bus (Kafka) for async communication
    ├── Kubernetes or managed containers
    └── Distributed tracing (OpenTelemetry)
```

### 11.3 Module-to-Service Extraction Map

| Module | Extracts To | Dependencies at Extraction |
|--------|-------------|---------------------------|
| `auth` | Stays with Clerk | None (external service) |
| `users` | Users Service | Auth (Clerk) |
| `closet` | Closet Service | Users, AI |
| `outfits` | Outfit Service | Users, Closet, AI |
| `ai` | AI Service | OpenAI API |
| `recommendations` | Recommendation Service | Closet, AI (embeddings) |
| `analytics` | Analytics Service | All modules (read-only) |
| `subscriptions` | Billing Service | Users, Stripe |

---

## 12. Architecture Decision Records

### ADR-001: Modular Monolith over Microservices

**Status:** Accepted

**Context:**
We are a team of 1–5 developers building an MVP. The enterprise architecture proposed 7 microservices with separate deployments, message buses, and infrastructure.

**Decision:**
Build as a modular monolith using Next.js with clear module boundaries enforced through directory structure and import rules.

**Rationale:**
- Microservices require: service discovery, distributed tracing, inter-service auth, separate deployments, orchestration, independent databases — all operational overhead we cannot afford
- A modular monolith provides the same code organization benefits with zero operational overhead
- Module boundaries are enforced by convention and linting, not network calls
- Each module has a clean public API (index.ts) that can be extracted into a service later
- TypeScript end-to-end with shared types is only possible in a monolith

**Consequences:**
- Single deployment — all or nothing (acceptable at MVP scale)
- All modules share the same database connection pool (acceptable < 10K users)
- Need discipline to avoid cross-module coupling (enforced by ESLint)
- Extraction to services requires implementing module boundaries as HTTP/gRPC calls (planned for Phase 2)

**Trade-offs:**
| Monolith Wins | Microservices Win |
|---------------|-------------------|
| Zero DevOps overhead | Independent deployments |
| Instant cross-module refactors | Team ownership per service |
| Single type system | Technology diversity |
| Simple local development | Fault isolation |
| Cheap at low scale | Scale individual services |

---

### ADR-002: AI Provider Abstraction Layer

**Status:** Accepted

**Context:**
AI is the core of LOOKSY's value proposition. We depend on OpenAI for vision analysis, embeddings, and text generation. Vendor lock-in is a real risk.

**Decision:**
Implement AI providers as interface-based modules behind an abstraction layer. MVP uses OpenAI exclusively. Provider switching requires only implementing the interface.

**Rationale:**
- OpenAI provides the best multimodal capabilities (GPT-4o) for MVP
- Google Gemini, Anthropic Claude, and open-source alternatives are viable alternatives
- Embedding models are commoditizing — OpenAI, Cohere, open-source (nomic, bge) all produce good embeddings
- Fine-tuned smaller models (Llama, Mistral) will be cost-effective at scale
- Abstraction costs almost nothing at MVP stage but preserves strategic flexibility

**Implementation:**
```
modules/ai/
├── index.ts              # Public interface
├── providers/
│   ├── openai.ts         # OpenAI implementation (MVP)
│   ├── gemini.ts         # Google Gemini (future)
│   └── local.ts          # Self-hosted model (future)
├── vision.ts             # Uses injected provider
├── embeddings.ts         # Uses injected provider
└── llm.ts               # Uses injected provider
```

**Consequences:**
- Slight abstraction overhead (negligible)
- Can A/B test providers for quality/cost comparison
- Can fallback to secondary provider on outages
- Fine-tuned models can replace API calls without touching business logic

---

### ADR-003: PostgreSQL + pgvector over Dedicated Vector Database

**Status:** Accepted

**Context:**
The enterprise architecture proposed Qdrant or Pinecone as a separate vector database service. We need similarity search for item matching and style profiles.

**Decision:**
Use PostgreSQL with the pgvector extension for all vector operations. No separate vector database.

**Rationale:**
- pgvector is mature enough for MVP scale (< 100K vectors)
- One fewer service to deploy, monitor, and pay for
- Supabase includes pgvector by default
- Single database means JOINs between vectors and metadata are trivial
- Can migrate to dedicated vector DB later by changing only the similarity search code
- At 5K users × 50 items = 250K vectors — well within pgvector's performance envelope

**Performance characteristics:**
| Operation | pgvector | Qdrant/Pinecone |
|-----------|----------|-----------------|
| 10K vectors, top-10 query | < 50ms | < 10ms |
| 100K vectors, top-10 query | < 200ms | < 20ms |
| 1M vectors, top-10 query | ~2s (needs tuning) | < 50ms |

**Consequences:**
- ivfflat index with `lists = 100` is sufficient for MVP
- Reindex after bulk imports (acceptable — runs in background)
- If vector search becomes a bottleneck, extract to Pinecone with a single repository change in `modules/recommendations/similarity.ts`
- HNSW index (pgvector 0.7+) available for better query performance at scale

**Migration path to dedicated vector DB:**
1. Add Pinecone client alongside pgvector
2. Dual-write embeddings during transition
3. Migrate reads to Pinecone
4. Remove pgvector queries

---

### ADR-004: Cloud-First MVP with Managed Services

**Status:** Accepted

**Context:**
We need to ship an MVP with minimal infrastructure investment. The team has limited DevOps experience.

**Decision:**
Use fully managed services for everything: Vercel (deployment), Supabase (database + storage), Clerk (auth), OpenAI (AI). No self-managed infrastructure.

**Rationale:**
- Zero DevOps overhead — no servers, containers, or orchestration to manage
- Free tiers cover development and early users
- Managed services handle: backups, scaling, security patches, SSL, CDNs
- Team focuses 100% on product code, not infrastructure
- All services have clean APIs that can be replaced if needed

**Service ownership:**
| Service | Provider | What We Don't Manage |
|---------|----------|---------------------|
| Hosting | Vercel | Servers, SSL, CDN, edge functions |
| Database | Supabase | Backups, scaling, connection pooling |
| Storage | Supabase | CDN, image processing, access control |
| Auth | Clerk | OAuth flows, session management, MFA |
| AI | OpenAI | Model hosting, inference scaling |
| Monitoring | Sentry | Error aggregation, source maps |
| Analytics | Vercel Analytics | Web vitals, traffic analysis |

**Trade-offs:**
| Managed Wins | Self-Hosted Wins |
|--------------|------------------|
| Zero operational overhead | Full control over config |
| Free tier available | Potentially cheaper at scale |
| Automatic scaling | No vendor lock-in |
| Security handled by vendor | Custom optimization possible |
| Fast to start | Data sovereignty |

**Consequences:**
- Monthly costs increase with users (but stay < $400/mo at 5K users)
- Vendor lock-in risk — mitigated by abstraction layers for AI and database
- Supabase SQL editor allows direct database access for debugging
- All data is portable (standard PostgreSQL, standard object storage)

**Exit strategy (if needed):**
- Vercel → any Next.js host (Netlify, Railway, Docker)
- Supabase → any PostgreSQL + S3-compatible storage
- Clerk → NextAuth.js or Lucia Auth
- OpenAI → any LLM API

---

## Appendix: MVP Feature ↔ Module Mapping

| Feature | Module(s) | Priority |
|---------|-----------|----------|
| Sign up / Sign in | auth, users | P0 |
| Photo upload | closet, ai | P0 |
| AI item classification | ai, closet | P0 |
| Browse closet | closet | P0 |
| Edit item metadata | closet | P0 |
| Generate outfit | outfits, ai, recommendations | P0 |
| Weather-based filtering | outfits | P0 |
| Wear tracking | outfits | P0 |
| Outfit history | outfits | P0 |
| Style profile | recommendations, users | P1 |
| Daily suggestions | recommendations | P1 |
| Push notifications | users (external: OneSignal) | P1 |
| Wardrobe analytics | analytics, closet | P1 |
| Subscription / billing | subscriptions | P1 |
| AI stylist chat | ai, outfits, recommendations | v1.2 |
| Shopping integration | New module | v1.3 |
| Social features | New modules | v1.4 |

---

*This document is the source of truth for MVP development. Update as implementation decisions are validated.*
