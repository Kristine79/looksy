# LOOKSY

A trusted AI stylist that learns your personal style over time.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL + pgvector (via Supabase)
- **ORM:** Drizzle
- **Auth:** Clerk
- **AI:** OpenAI (GPT-4o Vision, text-embedding-3-small)
- **Testing:** Vitest
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Docker (for local PostgreSQL)

### Setup

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd looksy
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start local PostgreSQL:
   ```bash
   docker-compose up -d
   ```

4. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

5. Fill in `.env.local` with your API keys (Clerk, OpenAI, Supabase).

6. Run database migrations:
   ```bash
   pnpm db:migrate
   ```

7. Start development server:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm lint` | Lint code |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm test` | Run tests |
| `pnpm db:generate` | Generate database migrations |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Drizzle Studio |

## Architecture

This project follows a **modular monolith** architecture:

```
src/
├── app/              # Next.js App Router (routes + pages)
├── modules/          # Domain modules (auth, users, closet, outfits, ai, ...)
├── lib/              # Shared utilities (db, errors, logger, validators)
├── components/       # Shared UI components
└── hooks/            # Shared React hooks
```

Each module has a public API (`index.ts`) and internal implementation files. Cross-module imports are restricted to public APIs only.

## Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | Done | Architecture review |
| 1 | Active | Project foundation |
| 2 | Pending | Database layer |
| 3 | Pending | Design system |
| 4 | Pending | Digital wardrobe |
| 5 | Pending | Fashion memory |
| 6 | Pending | Outfit generation |

## Environment Variables

See `.env.example` for all required environment variables.
