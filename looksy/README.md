# LOOKSY

Developer README — reflects the **current** state of the project, not the target state.

## Project Description

LOOKSY is a personal AI stylist: a web app that lets users build a digital wardrobe and receive AI-powered outfit suggestions that adapt to their style over time.

The long-term product vision (AI outfit recommendations, photo-based item import, fashion memory that learns user preferences, trust layer with explainable suggestions) is defined in [`docs/`](../docs), but the repository currently contains only the **MVP foundation: project setup and the data layer**. Product features are planned, not implemented.

## Current MVP Stage

Development is phase-gated (see [`docs/IMPLEMENTATION_PLAN.md`](../docs/IMPLEMENTATION_PLAN.md)):

| Phase | Status |
|-------|--------|
| 0 — Architecture review | Done |
| 1 — Project foundation | Done |
| 2 — Database layer | Done |
| 3 — Application layer (domain modules) | Done |
| 4 — AI Intelligence layer (provider abstraction, vision, embeddings, RAG) | Done |
| 5 — AI Recommendation Engine (explainable recommendations, Trust Layer) | Done |
| 6 — Outfit generation / UI | Planned |

Feature status:

| Feature | Status |
|---------|--------|
| Backend foundation: error handling, logging, validation (`src/lib`) | Done |
| Database schema, migration, seed script | Done |
| Domain modules: users, closet, outfits, recommendations (schema → repository → service) | Done |
| Fashion Memory: storage layer, repositories and manual services | Done |
| Fashion Memory automation (auto-derived memories from signals) | Planned |
| AI provider abstraction (OpenAI-compatible, env-configurable: `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`...) | Done |
| Vision pipeline (photo → item metadata) | Done — `ClothingAnalysisService` + `gpt-4o-mini` |
| Embeddings pipeline + HNSW retrieval (RAG) | Done |
| AI Recommendation Engine: request → context → prompt → LLM → explainable recommendation | Done — see `docs/LOOKSY_RECOMMENDATION_ENGINE.md` |
| Trust Layer (evidence-grounded explanations, owned-items-only guarantee) | Done |
| Outfit generation & persistence of AI results | Planned (Phase 6) |
| Clerk authentication | In development — dependency installed, integration planned |
| UI / design system / application screens | Planned |
| Production deployment | Planned (no deployment configuration yet) |

## Development Workflow

Development follows a phased workflow: implementation → testing → documentation → ADR review → git checkpoint.

Full process: [Development Workflow](../docs/DEVELOPMENT_WORKFLOW.md)

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 (App Router), React 19 | |
| Language | TypeScript 5 (strict mode) | |
| Styling | Tailwind CSS 4 | |
| Database | PostgreSQL 16 + pgvector | Local via Docker Compose; managed option planned for production |
| ORM | Drizzle ORM + postgres-js | Migrations, seed, Drizzle Studio |
| Auth | Clerk (`@clerk/nextjs`) | Installed, integration planned |
| AI | OpenAI SDK | Installed, providers planned (`src/modules/ai` defines contracts only) |
| Validation | Zod | |
| Testing | Vitest + Testing Library | Unit tests |
| Lint / Types | ESLint 9, `tsc --noEmit` | |
| CI | GitHub Actions | lint, typecheck, test, build |

## Architecture

**Modular monolith.** Domain logic lives in feature modules under `src/modules/`, each with a public API (`index.ts`):

- `schema.ts` — Drizzle table definitions (single migration under `src/lib/db/migrations`)
- `repository.ts` — data access
- `service.ts` — business logic
- `types.ts` — domain types
- `index.ts` — public API; cross-module imports are restricted to public APIs (enforced via ESLint)

Shared infrastructure (DB client, errors, logger, validators) lives in `src/lib`.

The AI layer (`src/modules/ai`) defines provider contracts (`AIProvider`, `StyleProfileUpdater`, embeddings schema) with no provider implementation yet — the OpenAI integration is planned.

Architecture decisions are documented in [`docs/ARCHITECTURE_DECISIONS.md`](../docs/ARCHITECTURE_DECISIONS.md).

## Project Structure

```
looksy/
├── src/
│   ├── app/                    # Next.js App Router (placeholder pages and route groups only)
│   ├── modules/
│   │   ├── auth/               # Clerk helpers (placeholder)
│   │   ├── users/              # Users, preferences
│   │   ├── closet/             # Clothing items, photos
│   │   ├── outfits/            # Outfits, wear log, feedback
│   │   ├── recommendations/    # Fashion memories, style profiles
│   │   ├── ai/                 # AI provider contracts (planned implementation)
│   │   ├── analytics/          # Events schema
│   │   └── subscriptions/      # Stub (planned)
│   └── lib/
│       ├── db/                 # Client, schema, migrations, seed
│       ├── errors.ts           # AppError hierarchy + API error handler
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
# Fill in DATABASE_URL (and Clerk keys when auth integration starts)

# 4. Apply migrations
pnpm db:migrate

# 5. (Optional) Seed demo data: demo user, wardrobe, outfits, memories
pnpm db:seed

# 6. Run the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

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

Covered so far: shared lib (errors, logger, validators), closet service, outfit feedback service, recommendations (fashion memory) service.

## Environment Variables

See `.env.example`. Current requirements:

| Variable | Required now? |
|----------|---------------|
| `DATABASE_URL` | Yes (local Drizzle setup) |
| `NEXT_PUBLIC_APP_URL` | Yes |
| `LOG_LEVEL` | Optional (default `info`) |
| Clerk keys, `OPENAI_API_KEY`, Supabase keys | Not yet — needed once auth / AI / storage are implemented |

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
