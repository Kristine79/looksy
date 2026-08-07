# LOOKSY Development Workflow

> Version: 1.0 | Status: Active | Last updated: 2026-08-07
> Purpose: Define the single development process for all upcoming phases

---

## Purpose

LOOKSY is developed in phases. Each phase must leave behind not only code, but a verified project state:

- working code;
- tests;
- up-to-date documentation;
- recorded architecture decisions;
- git checkpoint.

A phase is **not complete** until all five items above are in place and the validation commands pass.

---

## Phase Completion Cycle

Every phase runs through the following cycle, in order:

1. Implementation
2. Testing
3. Documentation
4. Architecture Decision Records (ADR)
5. Git Commit

### 1. Implementation

Before starting:

- review current ADRs ([`ARCHITECTURE_DECISIONS.md`](./ARCHITECTURE_DECISIONS.md));
- review the existing architecture ([`LOOKSY_ARCHITECTURE.md`](./LOOKSY_ARCHITECTURE.md));
- determine the impact of the change (which modules, which layers, which docs are affected).

During implementation:

- follow the **modular monolith** architecture;
- use the existing layer separation:

```
UI / API
   ↓
Services
   ↓
Repositories
   ↓
Database
```

Do not mix:

- UI and database logic;
- AI logic and infrastructure;
- business rules and repositories.

New code must live in the feature module that owns it (`src/modules/<feature>/`): `schema.ts`, `repository.ts`, `service.ts`, `types.ts`, `index.ts`. Cross-module imports are only allowed via public APIs (`index.ts`).

### 2. Testing

Every new functionality must have tests.

Requirements:

- unit tests for business logic;
- mock repositories/providers;
- no dependency on external services (database, AI providers, network) in unit tests.

Before finishing a phase, run the full validation:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

All four commands must pass. If a test requires a real database or external service, it must be excluded from the default `pnpm test` run and documented as an integration test.

### 3. Documentation

After implementation, update the documentation. Documents must describe the **actual state** of the project.

Never describe:

- planned work as implemented;
- future features as existing ones.

Statuses used in documentation:

| Status | Meaning |
|--------|---------|
| `implemented` | Shipped and verified in the current phase |
| `in development` | Work in progress, partially present |
| `planned` | Decided and documented, not yet implemented |
| `future` | On the roadmap, not planned for the current scope |

Per-phase documentation examples:

| Phase | Document |
|-------|----------|
| Phase 2 | [`LOOKSY_DATABASE_SCHEMA.md`](./LOOKSY_DATABASE_SCHEMA.md) |
| Phase 3 | [`LOOKSY_APPLICATION_LAYER.md`](./LOOKSY_APPLICATION_LAYER.md) |
| Phase 4 | `LOOKSY_AI_LAYER.md` (planned) |

Update existing docs instead of creating duplicates. The developer README (`../looksy/README.md`) must also reflect the current state after each phase.

### 4. Architecture Decision Records (ADR)

Create an ADR only for architectural decisions. An ADR is required when the change affects:

- architecture;
- module structure;
- database (schema, migrations, storage);
- AI provider;
- storage;
- pipeline;
- technical constraints.

ADRs live in [`ARCHITECTURE_DECISIONS.md`](./ARCHITECTURE_DECISIONS.md) and are numbered sequentially (next: ADR-021).

ADR format:

```markdown
# ADR-NNN: Title

## Context

Why the problem exists.

## Decision

What decision was made.

## Alternatives

Which options were considered.

## Consequences

Pros, cons, limitations.
```

### 5. Git Commit

After all previous steps are done, create a dedicated commit.

Rules:

- one commit = one completed phase or significant milestone;
- the commit message must reflect the meaning of the change.

Examples:

```text
feat(database): implement database foundation

feat(application): add domain service layer

feat(ai): implement AI foundation
```

Before committing, check:

```bash
git status
```

Must not be committed:

- `.env` and `.env.local` files;
- secrets;
- temporary files;
- debug artifacts;
- large unneeded files.

---

## Phase Completion Report

After each completed phase, create a report (in the commit message or in the phase's pull request description) using this format:

```markdown
## Completed

What was implemented.

## Files Changed

New and modified files.

## Tests

Which tests were added.

## Validation

lint / typecheck / test / build results.

## Documentation

Which documents were updated.

## ADR

Which decisions were recorded.

## Deviations

What deviated from the plan and why.

## Next Step

The recommended next phase.
```
