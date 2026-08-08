# LOOKSY — Product Readiness (Phase 8)

Status of the MVP as of Phase 8: **demo-ready**, not production-launched.
This document describes the current user journey, the demo flow, known
limitations and the boundaries of the MVP. It does not claim users, revenue,
traction or a public launch.

---

## 1. Product in one sentence

LOOKSY is a web app that turns photos of your clothes into a digital wardrobe
and generates **explainable** outfit recommendations that improve over time as
you wear, save and review looks.

## 2. Current user journey

1. **Entry** — `/` redirects to the dashboard (`/dashboard/recommendations`).
2. **Onboarding** — a first-time user sees a welcome banner:
   "LOOKSY — Your AI stylist that learns your personal style" with three steps
   (add clothes → LOOKSY analyzes them → recommendations improve over time).
   Empty accounts get a one-click **"Explore with a sample wardrobe"** button.
   Onboarding is dismissible and never blocks the product.
3. **Wardrobe** (`/dashboard/wardrobe`) — add an item by photo; the UI walks
   through uploaded → analyzing → added (or a friendly retry on failure).
   Every card shows AI status and confidence.
4. **Today's Look** (`/dashboard/recommendations`) — pick an occasion, generate
   a look, read "Why LOOKSY chose this" (evidence-backed), give feedback
   (Love / Wore it / Change item / Not for me).
5. **Fashion Memory** — the same page shows what LOOKSY has learned; feedback
   and wear actions feed the memory pipeline automatically.
6. **Demo mode** — without Clerk keys the app runs as the seeded `demo_user`
   with a full sample wardrobe; a banner clearly marks the sample data.

## 3. Demo flow (5 minutes)

| Step | Action | What the audience sees |
|------|--------|------------------------|
| 1 | Open the app (local: `pnpm dev` after `pnpm db:seed`) | Digital wardrobe with real-looking items |
| 2 | Open Today's Look | AI outfit from the wardrobe |
| 3 | Open "Why LOOKSY chose this" | Trust Layer — evidence-grounded explanation |
| 4 | Click ❤️ Love / 👕 Wore it | Instant feedback recorded |
| 5 | Revisit the Fashion Memory section | Memories reflect the signals |
| 6 | (Optional) Add a real photo | Full upload → analysis → wardrobe loop |

For a fresh Clerk account: onboarding → "Explore with a sample wardrobe" loads
6 items, 2 outfits and 2 memories without any AI calls — the demo works even
without an AI provider configured.

### Demo robustness

- If the AI provider is unavailable, Today's Look still returns a
  deterministic fallback look with a friendly notice (never a raw error).
- AI failures during analysis keep the item in the wardrobe with a retryable
  state; all error messages are non-technical.
- Demo data is idempotent (`pnpm db:seed` and the onboarding button never
  duplicate or overwrite user data).

## 4. Reliability posture

- **AI failures never expose raw provider errors** — analysis errors are
  sanitized to a friendly message; recommendation failures degrade into
  rule-based fallback looks; provider messages are only logged server-side.
- **Fallback contract** — only AI/provider failures degrade; database or
  internal failures propagate instead of being masked as "AI unavailable".
- **Error boundaries** — dashboard pages have a branded error state with
  retry instead of the default Next.js error screen.
- **Best-effort analytics** — `trackEvent`/`emitEvent` never block or break
  user flows.

## 5. Known limitations (MVP)

- **No sign-in UI yet** — authentication is either the seeded demo user
  (no Clerk keys) or Clerk sessions; there is no `/sign-in` page shipped with
  the app.
- **No settings/profile page** — the nav has no user menu.
- **No outfit history page** — past looks are visible through the latest look;
  outfit persistence exists in the data layer.
- **Memory confirmation UI** — memory creation is automatic (Phase 7); the UI
  for confirming/correcting memories is not yet exposed.
- **Image storage** — MVP stores images as local data URLs (works everywhere,
  fine for demos); remote storage is stubbed behind `ImageStorageService`.
- **No caching layer** — pages are server-rendered per request; acceptable at
  MVP scale.
- **No queueing** — memory automation runs synchronously inside feedback
  actions (documented trade-off, see LOOKSY_FASHION_MEMORY_AUTOMATION.md).

## 6. MVP boundaries (out of scope for Phase 8)

Not implemented and intentionally out of scope for the current phase:

- shopping intelligence / affiliate integrations
- subscriptions / payments
- mobile applications
- autonomous agents / complex queues
- advanced analytics platforms
- social features

These are deferred to future phases (see `docs/LOOKSY_ROADMAP.md`).

## 7. What the MVP does NOT claim

- no public launch, no production deployment configuration
- no user metrics, revenue or traction data
- AI recommendations are assistance, not fashion authority
