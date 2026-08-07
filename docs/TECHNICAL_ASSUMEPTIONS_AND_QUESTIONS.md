# LOOKSY — Technical Assumptions & Unresolved Questions

> Version: 1.0 | Status: Active | Last updated: 2026-07-22
> Purpose: Document assumptions and questions requiring answers

---

## Table of Contents

1. [Technical Assumptions](#1-technical-assumptions)
2. [Unresolved Questions](#2-unresolved-questions)
3. [Decision Matrix](#3-decision-matrix)

---

## 1. Technical Assumptions

These are assumptions we're making that should be validated during implementation.

### 1.1 Infrastructure Assumptions

| # | Assumption | Risk | Validation Method |
|---|------------|------|-------------------|
| I-1 | Supabase free tier is sufficient for MVP | Medium | Test with 1000 users |
| I-2 | Vercel free tier handles MVP traffic | Low | Deploy and test |
| I-3 | Clerk free tier (10K MAU) is enough | Low | Monitor usage |
| I-4 | OpenAI API has sufficient capacity | Medium | Test with concurrent users |
| I-5 | pgvector handles 250K vectors efficiently | Medium | Benchmark with test data |

### 1.2 Development Assumptions

| # | Assumption | Risk | Validation Method |
|---|------------|------|-------------------|
| D-1 | Team has Next.js 16 experience | Medium | Code review |
| D-2 | Team has Drizzle ORM experience | Medium | Prototype first |
| D-3 | Team has Tailwind CSS experience | Low | Standard stack |
| D-4 | TypeScript strict mode is manageable | Low | Incremental adoption |
| D-5 | ESLint rules will be followed | Medium | CI enforcement |

### 1.3 Product Assumptions

| # | Assumption | Risk | Validation Method |
|---|------------|------|-------------------|
| P-1 | Users will upload photos of clothing | High | User testing |
| P-2 | AI classification accuracy > 85% | High | Test with real photos |
| P-3 | Users will trust AI recommendations | High | User interviews |
| P-4 | Daily outfit suggestion drives retention | Medium | Analytics |
| P-5 | Fashion Memory adds value | Medium | User feedback |

### 1.4 Performance Assumptions

| # | Assumption | Risk | Validation Method |
|---|------------|------|-------------------|
| F-1 | Page load < 3s on 3G | Medium | Lighthouse testing |
| F-2 | AI classification < 4s | Medium | API testing |
| F-3 | Outfit generation < 8s | Medium | API testing |
| F-4 | Database queries < 200ms | Low | Query analysis |
| F-5 | Bundle size < 500KB | Low | Build analysis |

### 1.5 Security Assumptions

| # | Assumption | Risk | Validation Method |
|---|------------|------|-------------------|
| S-1 | Clerk handles session security | Low | Clerk documentation |
| S-2 | Supabase RLS is sufficient | Medium | Security audit |
| S-3 | No custom auth code needed | Low | Clerk integration |
| S-4 | Environment variables are secure | Low | Vercel dashboard |
| S-5 | API routes are protected | Medium | Middleware testing |

---

## 2. Unresolved Questions

These questions need answers before or during implementation.

### 2.1 Architecture Questions

| # | Question | Impact | Priority | Status |
|---|----------|--------|----------|--------|
| A-1 | Should we use Server Actions or API Routes for mutations? | High | P0 | Open |
| A-2 | How do we handle long-running AI operations (outfit generation)? | High | P0 | Open |
| A-3 | Should we use Supabase Storage or Vercel Blob for photos? | Medium | P1 | Open |
| A-4 | Do we need rate limiting at MVP scale? | Low | P2 | Open |
| A-5 | Should we implement optimistic updates everywhere? | Low | P2 | Open |

### 2.2 Database Questions

| # | Question | Impact | Priority | Status |
|---|----------|--------|----------|--------|
| D-1 | Should we use Supabase's generated types or Drizzle's? | Medium | P1 | Open |
| D-2 | How do we handle database migrations in production? | High | P0 | Open |
| D-3 | Should we use connection pooling via Supabase or directly? | Medium | P1 | Open |
| D-4 | Do we need full-text search on item descriptions? | Low | P2 | Open |
| D-5 | Should we partition analytics_events by date? | Low | P2 | Open |

### 2.3 AI Questions

| # | Question | Impact | Priority | Status |
|---|----------|--------|----------|--------|
| AI-1 | Should we implement retry logic for OpenAI API calls? | High | P0 | Open |
| AI-2 | How do we handle OpenAI rate limits gracefully? | High | P0 | Open |
| AI-3 | Should we cache AI responses? | Medium | P1 | Open |
| AI-4 | How do we validate AI responses before storing? | High | P0 | Open |
| AI-5 | Should we implement fallback for AI failures? | High | P0 | Open |

### 2.4 UX Questions

| # | Question | Impact | Priority | Status |
|---|----------|--------|----------|--------|
| U-1 | Should we show loading skeleton or spinner for AI operations? | Low | P2 | Open |
| U-2 | How do we handle photo upload failures gracefully? | Medium | P1 | Open |
| U-3 | Should we implement drag-and-drop for photo upload? | Low | P2 | Open |
| U-4 | Do we need image compression before upload? | Medium | P1 | Open |
| U-5 | Should we show AI confidence to users? | Medium | P1 | Open |

### 2.5 Business Questions

| # | Question | Impact | Priority | Status |
|---|----------|--------|----------|--------|
| B-1 | Do we need a landing page before MVP launch? | Medium | P1 | Open |
| B-2 | Should we implement analytics from day one? | Medium | P1 | Open |
| B-3 | Do we need error tracking (Sentry) from day one? | Low | P2 | Open |
| B-4 | Should we implement A/B testing infrastructure? | Low | P2 | Open |
| B-5 | Do we need a admin dashboard for monitoring? | Low | P2 | Open |

---

## 3. Decision Matrix

### 3.1 High-Priority Decisions Needed

| Question | Options | Recommendation | Decision Needed |
|----------|---------|----------------|-----------------|
| A-1: Server Actions vs API Routes | Server Actions / API Routes / Both | Both (Server Actions for mutations, API for reads) | Before Phase 1 |
| A-2: Long-running operations | Polling / Streaming / Background jobs | Polling (simplest for MVP) | Before Phase 4 |
| D-2: Migrations in production | Manual / CI/CD / Supabase CLI | CI/CD via GitHub Actions | Before Phase 2 |
| AI-1: Retry logic | Exponential backoff / Simple retry / None | Exponential backoff | Before Phase 4 |
| AI-4: Validate AI responses | Zod schema / Manual check / Trust | Zod schema validation | Before Phase 4 |

### 3.2 Medium-Priority Decisions Needed

| Question | Options | Recommendation | Decision Needed |
|----------|---------|----------------|-----------------|
| A-3: Photo storage | Supabase Storage / Vercel Blob | Supabase Storage (integrated) | Before Phase 4 |
| D-1: Type generation | Supabase / Drizzle | Drizzle (type-safe) | Before Phase 2 |
| AI-3: Cache responses | Redis / In-memory / None | None (MVP scale) | Before Phase 4 |
| U-4: Image compression | Client-side / Server-side / None | Client-side (reduce upload size) | Before Phase 4 |
| B-2: Analytics | PostHog / Vercel Analytics / None | Vercel Analytics (built-in) | Before Phase 1 |

### 3.3 Low-Priority Decisions (Can Wait)

| Question | Options | Recommendation | Decision Needed |
|----------|---------|----------------|-----------------|
| A-4: Rate limiting | Custom / Clerk / None | None (MVP scale) | Before launch |
| A-5: Optimistic updates | Everywhere / Selective / None | Selective (key actions) | During Phase 4 |
| D-4: Full-text search | PostgreSQL / Algolia / None | PostgreSQL (built-in) | Before Phase 4 |
| D-5: Partitioning | Yes / No | No (MVP scale) | Before launch |
| U-1: Loading states | Skeleton / Spinner / Both | Skeleton (better UX) | During Phase 3 |

---

## 4. Action Items

### 4.1 Immediate (Before Phase 1)

| Action | Owner | Due | Status |
|--------|-------|-----|--------|
| Decide on Server Actions vs API Routes | Tech Lead | Now | Pending |
| Set up Supabase project | DevOps | Now | Pending |
| Set up Clerk project | DevOps | Now | Pending |
| Create OpenAI account | Tech Lead | Now | Pending |

### 4.2 Before Phase 2

| Action | Owner | Due | Status |
|--------|-------|-----|--------|
| Decide on migration strategy | Tech Lead | Phase 2 | Pending |
| Set up database connection pooling | DevOps | Phase 2 | Pending |
| Create test database | DevOps | Phase 2 | Pending |

### 4.3 Before Phase 4

| Action | Owner | Due | Status |
|--------|-------|-----|--------|
| Decide on AI retry logic | Tech Lead | Phase 4 | Pending |
| Decide on AI response validation | Tech Lead | Phase 4 | Pending |
| Set up Supabase Storage bucket | DevOps | Phase 4 | Pending |
| Implement image compression | Frontend | Phase 4 | Pending |

---

*This document tracks assumptions and questions that need validation. Review and update weekly during active development.*
