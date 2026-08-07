# LOOKSY — Architecture Decisions

> Version: 1.1 | Status: Active | Last updated: 2026-08-07
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

---

*This document records all architectural decisions for LOOKSY. Each decision is documented with context, rationale, alternatives, and consequences. Decisions should be reviewed periodically and updated as the project evolves.*
