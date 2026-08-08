# LOOKSY — Product Experience Layer (Phase 6)

Phase 6 delivers the first user-facing product experience on top of the
architecture built in Phases 0–5. The UI is a thin layer: it never contains
business logic, never calls AI directly, and never touches the database.

```
UI (React Server Components + Client widgets)
        ↓
Server Actions + API Routes  (src/modules/*/actions, src/app/api/*)
        ↓
Application services       (src/modules/*/server.ts — orchestration)
        ↓
Domain services            (ClosetService, RecommendationService,
                            FeedbackService, FashionMemoryService, …)
        ↓
Repositories               (Drizzle, PostgreSQL + pgvector)
```

---

## 1. User flows

### 1.1 Add clothing to the wardrobe

Path: `/dashboard/wardrobe`

1. User uploads a photo (client-side downscale to ≤1000px JPEG).
2. `AddClothingForm` walks through three visible steps:
   - **Photo uploaded** — local preview;
   - **LOOKSY is analyzing this item** — vision analysis + embedding pipeline;
   - **Added to wardrobe** — item row with AI metadata.
3. Server: `addToWardrobeAction` → `addClothingItemWithAnalysis`:
   item insert (`ai_status = pending`) → photo storage → `ClothingAnalysisService`
   (vision → validation → metadata persist → embedding) → final status.
4. If analysis fails, the item stays in the wardrobe with `ai_status = failed`
   and the card shows **Re-analyze item** (`reprocessItemAction`).

### 1.2 Browse the wardrobe

Path: `/dashboard/wardrobe`

- Grid of `ClothingCard`s: photo, type, brand, color dots, AI status badge.
- AI statuses are always visible:
  - `pending` / `processing` — "LOOKSY is analyzing" (pulse);
  - `completed` — "AI verified · 92%" (confidence);
  - `failed` — retry action.
- Category filter pills (`?type=shirt` …) + counts (total / verified / analyzing / attention).

### 1.3 Today's Look (recommendation experience)

Path: `/dashboard/recommendations`

1. User picks an occasion (or none) and clicks **Generate look**.
2. `getTodayLookAction` → `getTodayLook`:
   - `RecommendationService.recommend` (retrieval-first RAG → prompt → LLM → validation);
   - outfit persisted via `OutfitService.createOutfit` (items, evidence, scores, model);
   - full look resolved (items + photos) and returned.
3. The page renders `OutfitCard`:
   - item thumbnails;
   - explanation (`whyChosen`);
   - **Trust Layer** — "Why LOOKSY chose this" evidence badges, each grounded in
     user data (palette, wear history, saved outfits, feedback actions);
   - confidence %;
   - `FeedbackButtons`.
4. Initial page load never triggers an AI call: the latest persisted outfit is
   shown if it exists (`getLatestLook` + `getLookDetails`), otherwise an empty state.

### 1.4 Feedback loop (teaching LOOKSY)

Every action below records a signal through `FeedbackService` — the input for
Fashion Memory training (Phase 7):

| Button        | FeedbackService method | Effect                                   |
|---------------|------------------------|------------------------------------------|
| ❤️ Love       | `recordSave`           | outfit → `saved`                         |
| 👕 Wore it    | `recordWear`           | wear log + item wear counters            |
| 🔄 Change item| `recordSwap`           | swap signal, then a fresh look           |
| 👎 Not for me | `recordSkip`           | outfit → `dismissed`, then a fresh look  |

"Change item" opens an inline picker: which item to replace and which wardrobe
item to swap in. The swap is recorded, then a new look is generated.

### 1.5 Fashion Memory

Below Today's Look, **"What LOOKSY has learned about you"** renders
`MemoryCard`s (confirmed / possible / emerging), each with a confidence bar
and signal count — the learning is visible, not a black box.

---

## 2. UI architecture

```
src/components/
├── ui/            Button, Badge, Skeleton, Spinner, EmptyState
├── clothing/      ClothingCard, AddClothingForm, AiStatusBadge
├── outfits/       OutfitCard, EvidenceBadge, FeedbackButtons
├── memory/        MemoryCard
├── recommendations/ TodayLookExperience (client wrapper, owns look state)
└── dashboard/     DashboardNav
```

- Server components render data; client components exist only where
  interactivity is required (forms, feedback, generation) and call **server
  actions** — never services or the database directly.
- Design tokens come from `globals.css` (neutral / primary / secondary /
  tertiary + semantic success/warning/error/info).
- Loading states: route-level `loading.tsx` skeletons + in-flow skeletons
  ("LOOKSY is building your look…") + error states with retry.

## 3. Frontend ↔ backend interaction

| Concern                    | Surface                                            |
|----------------------------|----------------------------------------------------|
| Wardrobe (UI)              | `src/modules/closet/actions.ts`                    |
| Recommendations (UI)       | `src/modules/recommendations/actions.ts`           |
| Feedback (UI)              | `src/modules/outfits/actions.ts`                   |
| HTTP API                   | `GET/POST /api/wardrobe`, `POST /api/recommendations` |
| Auth resolution            | `src/modules/auth/server.ts` (`getCurrentUserId`)  |
| Image storage              | `src/modules/storage/index.ts` (`ImageStorageService`, `resolvePhotoUrl`) |

API contract — `POST /api/recommendations`:

```json
// request
{ "occasion": "work", "mood": "confident", "weather": { "tempC": 18, "condition": "partly cloudy" } }
// response — TodayLookResult
{ "outfitId": "...", "name": "Work", "occasion": "work", "status": "generated",
  "recommendation": { "outfit": [...], "explanation": {...}, "confidence": 0.87 },
  "items": [...], "evidence": [...], "scores": {...}, "model": "deepseek-v4-flash", "createdAt": "..." }
```

Validation: zod schemas shared between actions and API routes
(`todayLookInputSchema`, `addToWardrobeInputSchema`). Errors go through
`handleApiError` (400/401/404/500, `{ error: { code, message, details } }`).

## 4. AI states

| State       | Where shown                        | UX                                   |
|-------------|------------------------------------|--------------------------------------|
| `pending`   | ClothingCard                       | "Analyzing soon"                     |
| `processing`| ClothingCard / AddClothingForm     | pulse badge, spinner, staged steps   |
| `completed` | ClothingCard                       | "AI verified · %"                    |
| `failed`    | ClothingCard / AddClothingForm     | error copy + **Re-analyze item**     |
| generation  | TodayLookExperience                | skeleton grid + "building your look" |

## 5. Identity

`getCurrentUserId()` resolves the internal user id:

- **Clerk configured** (`CLERK_SECRET_KEY`): session id → local profile
  (auto-provisioned on first sign-in with email/name from Clerk);
- **Demo mode**: seeded `demo_user` (`npm run db:seed`) is used, so the whole
  product works locally without external services.

## 6. Storage decision (MVP)

`ImageStorageService` uploads to **Supabase Storage** when
`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set; otherwise it
stores the image as a data URL in `item_photos.storage_path` (a documented MVP
tradeoff — swap the local branch for S3/GCS without touching callers).
`resolvePhotoUrl()` is the single place that decides which URL to render.

## 7. Validation

```bash
npm run lint       # eslint — module encapsulation enforced
npm run typecheck  # tsc --noEmit
npm run test       # vitest — 120 tests
npm run build      # next build — all dashboard routes dynamic (force-dynamic)
```

## 8. Guardrails kept from earlier phases

- No business logic in components — services are the only place that touches
  the database or AI.
- Module encapsulation: ESLint `no-restricted-imports` allows only
  `index`, `actions`, `server` entry points.
- Explainability: prompts never invent preferences; every justification must be
  grounded in verified evidence (Trust Layer).
