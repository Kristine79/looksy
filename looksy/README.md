# LOOKSY

Developer README — reflects the **current** state of the project, not the target state.

## Project Description

LOOKSY is a **Personal Style Intelligence system**: a web app that builds a digital
wardrobe from user photos and delivers AI outfit recommendations that are
**explainable** — grounded in the user's real wardrobe, wear history, saved
outfits and learned preferences (Fashion Memory).

The product is phase-gated (see [`docs/IMPLEMENTATION_PLAN.md`](../docs/IMPLEMENTATION_PLAN.md)).
The first user-facing experience (wardrobe + Today's Look + feedback loop) is
live in Phase 6; Fashion Memory automation landed in Phase 7; Phase 8
(onboarding, demo mode, reliability polish) prepares the MVP for external demos.

## Current MVP Capabilities

- **First-time onboarding** — a welcome state on the dashboard explains LOOKSY
  in three steps; new accounts can load a one-click sample wardrobe.
- **Digital Wardrobe** (`/dashboard/wardrobe`) — add items by photo; the vision
  pipeline extracts type, colors, material, pattern, formality and seasons;
  every item shows its AI status (analyzing / verified with confidence / failed + retry).
- **Today's Look** (`/dashboard/recommendations`) — AI outfit from the user's own
  wardrobe with a **Trust Layer**: "Why LOOKSY chose this" is backed by evidence
  (palette, most-worn items, saved outfits, feedback actions) — never generic AI talk.
- **Feedback loop** — ❤️ Love / 👕 Wore it / 🔄 Change item / 👎 Not for me;
  every action records a signal through `FeedbackService` for Fashion Memory training.
- **Fashion Memory UI** — "What LOOKSY has learned about you": memories with
  confidence bars and signal counts.
- **Demo mode** — the seeded `demo_user` (via `pnpm db:seed`) shows a realistic
  wardrobe, outfits, wear history and memories; a banner clearly marks demo data.
  Any account can also load a sample wardrobe from onboarding.
- **HTTP API** — `GET/POST /api/wardrobe`, `POST /api/recommendations`.
- **Internal analytics** — best-effort product events
  (`item_added`, `ai_analysis_completed`, `outfit_generated`, `outfit_worn`, …)
  written to `analytics_events`; no external platform.
- Works without any external signup in demo mode (seeded `demo_user`); Clerk
  session flow is supported when configured.

See [`docs/LOOKSY_PRODUCT_READINESS.md`](../docs/LOOKSY_PRODUCT_READINESS.md) for the
current user journey, demo flow and known MVP limitations.

## Current MVP Stage

| Phase | Status |
|-------|--------|
| 0 — Architecture review | Done |
| 1 — Project foundation | Done |
| 2 — Database layer | Done |
| 3 — Application layer (domain modules) | Done |
| 4 — AI Intelligence layer (provider abstraction, vision, embeddings, RAG) | Done |
| 5 — AI Recommendation Engine (explainable recommendations, Trust Layer) | Done |
| 6 — Product Experience Layer (wardrobe UI, Today's Look, feedback loop) | Done |
| 7 — Fashion Memory automation (auto-derived memories from signals) | Done |
| 8 — Product polish & demo readiness (onboarding, demo mode, reliability) | Done |

Feature status:

| Feature | Status |
|---------|--------|
| Backend foundation: error handling, logging, validation (`src/lib`) | Done |
| Database schema, migration, seed script | Done |
| Domain modules: users, closet, outfits, recommendations (schema → repository → service) | Done |
| Fashion Memory: storage layer, repositories and manual services | Done |
| Fashion Memory automation (auto-derived memories from signals) | Done (Phase 7) |
| AI provider abstraction (OpenAI-compatible, env-configurable: `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`...) | Done |
| Vision pipeline (photo → item metadata) | Done — `ClothingAnalysisService` + `gpt-4o-mini` |
| Embeddings pipeline + pgvector retrieval (RAG) | Done |
| AI Recommendation Engine: request → context → prompt → LLM → explainable recommendation | Done — see `docs/LOOKSY_RECOMMENDATION_ENGINE.md` |
| Trust Layer (evidence-grounded explanations, owned-items-only guarantee) | Done |
| Outfit generation & persistence of AI results | Done — `POST /api/recommendations`, `getTodayLook` |
| Digital Wardrobe UI + Add Clothing flow (photo → analysis → wardrobe) | Done — `/dashboard/wardrobe` |
| Today's Look experience + Feedback Loop UI | Done — `/dashboard/recommendations` |
| First-time onboarding (welcome state, sample wardrobe CTA) | Done (Phase 8) |
| Demo mode (banner, one-click sample wardrobe, seeded demo user) | Done (Phase 8) |
| AI failure UX (sanitized errors, fallback looks, error boundaries) | Done (Phase 8) |
| Internal product analytics (event abstraction, no external platform) | Done (Phase 8) |
| Clerk authentication | Partial — session + auto-provisioning supported; demo mode fallback |
| Image storage (Supabase Storage, local data-URL fallback) | Done — `ImageStorageService` |
| Production deployment | Planned (no deployment configuration yet) |

## Screenshots

_Screenshots will be added here as the UI stabilizes — currently at MVP visual stage
(see `docs/LOOKSY_PRODUCT_EXPERIENCE.md` for user flows)._

## User Flows

1. **First visit (onboarding)** — welcome banner explains the product in three
   steps; empty accounts get a one-click "Explore with a sample wardrobe" button.
2. **Add clothing** — upload photo → "Photo uploaded" → "LOOKSY is analyzing this item" → "Added to wardrobe". Failed analysis is retryable from the card.
3. **Get a look** — pick an occasion → "Generate look" → outfit from your wardrobe + "Why LOOKSY chose this" evidence + confidence.
4. **Teach LOOKSY** — Love / Wore it / Change item / Not for me → every reaction is recorded and feeds Fashion Memory.

Detailed flows: [docs/LOOKSY_PRODUCT_EXPERIENCE.md](../docs/LOOKSY_PRODUCT_EXPERIENCE.md) and
[docs/LOOKSY_PRODUCT_READINESS.md](../docs/LOOKSY_PRODUCT_READINESS.md).

## Demo Instructions

Two ways to demo LOOKSY without creating data manually:

1. **Seeded demo user (recommended for local demo)** — run `pnpm db:seed` and
   open the app without Clerk keys: you sign in as `demo_user` with a full
   sample wardrobe (12 items, 4 outfits, wear history, 4 fashion memories).
   A banner marks demo mode.
2. **One-click sample wardrobe** — with Clerk configured, a fresh account sees
   the onboarding banner with an "Explore with a sample wardrobe" button that
   loads 6 items, 2 outfits and 2 memories (no AI calls needed).

Demo flow to present: Today's Look → "Why LOOKSY chose this" → give feedback →
watch the Fashion Memory section update.

## Development Workflow

Development follows a phased workflow: implementation → testing → documentation → ADR review → git checkpoint.

Full process: [Development Workflow](../docs/DEVELOPMENT_WORKFLOW.md)

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router), React 19 | Server Actions + API routes |
| Language | TypeScript 5 (strict mode) | |
| Styling | Tailwind CSS 4 | Design tokens in `globals.css` |
| Database | PostgreSQL 16 + pgvector | Local via Docker Compose; managed option planned for production |
| ORM | Drizzle ORM + postgres-js | Migrations, seed, Drizzle Studio |
| Auth | Clerk (`@clerk/nextjs`) | Session + auto-provisioning; demo-mode fallback |
| AI | OpenAI SDK (OpenAI-compatible endpoints) | Vision, embeddings, generation — `src/modules/ai` |
| Image storage | Supabase Storage | Local data-URL fallback for MVP |
| Validation | Zod | Shared between actions and API routes |
| Testing | Vitest + Testing Library | Unit + component tests |
| Lint / Types | ESLint 9, `tsc --noEmit` | |
| CI | GitHub Actions | lint, typecheck, test, build |

## Architecture

**Modular monolith.** Domain logic lives in feature modules under `src/modules/`, each with a public API (`index.ts`):

- `schema.ts` — Drizzle table definitions (single migration under `src/lib/db/migrations`)
- `repository.ts` — data access
- `service.ts` — business logic
- `server.ts` — application orchestration (wires repositories + services + AI)
- `actions.ts` — server actions ("use server") consumed by the UI
- `types.ts` — domain types
- `index.ts` — public API; cross-module imports are restricted to public APIs (enforced via ESLint)

The UI layer (`src/components`, `src/app`) talks only to `actions`/`server` entry
points — never directly to repositories or the database.

Shared infrastructure (DB client, errors, logger, validators) lives in `src/lib`.

Architecture decisions are documented in [`docs/ARCHITECTURE_DECISIONS.md`](../docs/ARCHITECTURE_DECISIONS.md).
Product experience details: [`docs/LOOKSY_PRODUCT_EXPERIENCE.md`](../docs/LOOKSY_PRODUCT_EXPERIENCE.md).

## Project Structure

```
looksy/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # /dashboard/* pages (wardrobe, recommendations)
│   │   └── api/                # /api/wardrobe, /api/recommendations
│   ├── components/             # Design system + feature components
│   │   ├── ui/                 # Button, Badge, Skeleton, Spinner, EmptyState
│   │   ├── clothing/           # ClothingCard, AddClothingForm, AiStatusBadge
│   │   ├── outfits/            # OutfitCard, EvidenceBadge, FeedbackButtons
│   │   ├── memory/             # MemoryCard
│   │   ├── onboarding/         # OnboardingBanner, DemoModeBanner
│   │   └── recommendations/    # TodayLookExperience
│   ├── modules/
│   │   ├── auth/               # Identity resolution (Clerk / demo mode)
│   │   ├── users/              # Users, preferences (+ onboarding action)
│   │   ├── closet/             # Clothing items, photos (+ actions, server)
│   │   ├── outfits/            # Outfits, wear log, feedback (+ actions)
│   │   ├── recommendations/    # Fashion memory, style profiles, engine (+ actions, server)
│   │   ├── ai/                 # Provider abstraction, vision, embeddings, RAG
│   │   ├── demo/               # Sample wardrobe injection (onboarding demo mode)
│   │   ├── storage/            # Image storage abstraction
│   │   ├── analytics/          # Event schema + best-effort tracker
│   │   └── subscriptions/      # Stub (planned)
│   └── lib/
│       ├── db/                 # Client, schema, migrations, seed
│       ├── errors.ts           # AppError hierarchy + API error handler
│       ├── image.ts            # Client-side image resize (data URL)
│       ├── occasions.ts        # Product constants (shared client/server)
│       ├── logger.ts           # Structured logger
│       └── validators.ts       # Zod schemas
├── docker-compose.yml          # Local PostgreSQL
├── drizzle.config.ts
└── package.json
```

Product and architecture documentation: [`docs/`](../docs) (MVP architecture, database schema, AI architecture, implementation plan).

## Getting Started

Prerequisites: Node.js 20+, pnpm, Docker.

```bash
# 1. Install dependencies
pnpm install

# 2. Start local PostgreSQL (Docker, port 5432)
docker-compose up -d

# 3. Configure environment
cp .env.example .env.local
# Fill in DATABASE_URL. For AI features (analysis + recommendations) set AI_API_KEY
# (OpenAI or any OpenAI-compatible endpoint). Clerk keys are optional — without them
# the app runs in demo mode using the seeded demo user.

# 4. Apply migrations
pnpm db:migrate

# 5. (Optional) Seed demo data: demo user, wardrobe, outfits, memories
pnpm db:seed

# 6. Run the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and go to
`/dashboard/recommendations` or `/dashboard/wardrobe`.

## Database Setup

- Local dev database: PostgreSQL 16 via `docker-compose.yml` (database `looksy`, user `postgres`/`postgres`, port `5432`).
- Migration `0000_initial.sql` includes `CREATE EXTENSION IF NOT EXISTS vector` — **the PostgreSQL image must include pgvector** for migrations to apply (e.g. `pgvector/pgvector:pg16`).
- Target production database: PostgreSQL + pgvector (managed option planned; see [`docs/LOOKSY_DATABASE_SCHEMA.md`](../docs/LOOKSY_DATABASE_SCHEMA.md)).
- Schema is defined per module under `src/modules/*/schema.ts` and aggregated in `src/lib/db/schema.ts`.

| Command | Description |
|---------|-------------|
| `pnpm db:generate` | Generate a migration from the schema |
| `pnpm db:migrate` | Apply pending migrations |
| `pnpm db:push` | Push schema directly (dev only) |
| `pnpm db:studio` | Open Drizzle Studio |
| `pnpm db:seed` | Seed demo data (idempotent) |

## Testing Commands

```bash
pnpm test          # Run all tests once (Vitest)
pnpm test:watch    # Watch mode
```

Covered so far: shared lib (errors, logger, validators), closet service, outfit feedback service, recommendations (fashion memory + today-look fallback contract), AI providers, clothing analysis (incl. sanitized errors), server actions (closet / recommendations / outfits / users / demo), API routes (`/api/wardrobe`, `/api/recommendations`), analytics tracker, demo content injection and critical components (ClothingCard, AddClothingForm, FeedbackButtons, MemoryCard, EvidenceBadge, TodayLookExperience, OnboardingBanner).

## Environment Variables

See `.env.example`. Current requirements:

| Variable | Required now? |
|----------|---------------|
| `DATABASE_URL` | Yes (local Drizzle setup) |
| `AI_API_KEY` (or `OPENAI_API_KEY`) | Yes for AI analysis & recommendations |
| `NEXT_PUBLIC_APP_URL` | Yes |
| `LOG_LEVEL` | Optional (default `info`) |
| Clerk keys | Optional — demo mode fallback |
| Supabase URL / keys | Optional — image upload; local data-URL fallback |

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Lint code |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm test` | Run tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm db:*` | Database commands (see above) |

CI (`.github/workflows/ci.yml`) runs `lint`, `typecheck`, `test` and `build` on push/PR to `main`.
