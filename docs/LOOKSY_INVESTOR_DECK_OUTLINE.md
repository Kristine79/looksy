# LOOKSY — Investor Deck Outline

> Status: Early-stage concept / MVP in development
> Purpose: Structure for a seed-stage investor presentation (10–13 slides)
> Based on: LOOKSY_ONE_PAGER.md, LOOKSY_PRODUCT_INNOVATIONS.md (v1.2), LOOKSY_ROADMAP.md (v1.0), LOOKSY_UX_RESEARCH.md (v1.0), LOOKSY_AI_ARCHITECTURE.md, LOOKSY_MVP_ARCHITECTURE.md

---

## Rules for This Deck

1. **No unconfirmed claims.** LOOKSY is in MVP development. Do NOT state: user numbers, revenue, growth metrics, market traction, launch status.
2. Metrics from the roadmap are **internal planning targets only** — mark them as targets, never as achievements.
3. Every slide maps to a documented source (see "Source" per slide).
4. The deck leads with product depth and AI architecture — not hype.

---

## 1. Cover

- **Slide title:** LOOKSY
- **Key message:** AI Stylist That Learns Your Personal Style Over Time
- **Supporting points:**
  - Tagline under logo: "Personal style intelligence platform"
  - Status line: "MVP in development — early-stage"
  - Optional: single-line product descriptor from one-pager
- **Suggested visual:** Wordmark on neutral background; abstract wardrobe-grid motif; no photos implying launched product
- **Source:** One-Pager header; Product Innovations §9 (positioning)

---

## 2. Vision

- **Slide title:** A New Category: Wardrobe as an Intelligent System
- **Key message:** Not just "an AI stylist that learns your style" — LOOKSY is building a new category: **AI that understands personal style**. It transforms a wardrobe into an intelligent system.
- **Category positioning (top of slide, under title):**
  - LOOKSY is not an outfit generator
  - LOOKSY is not a wardrobe management app
  - LOOKSY is the category where a wardrobe becomes an intelligent system
- **Supporting points:**
  - Understands what you own (digital wardrobe)
  - Learns how you choose over time (fashion memory)
  - Explains every recommendation (trust layer)
  - The longer you use it, the more personal it becomes (compounding understanding)
- **Suggested visual:** The category-defining Before/After — the deck's central motif ("From static shelf to living system"):
  - **Before — Static wardrobe:** a passive shelf of clothes; labels: "forgotten items", "manual decisions", "generic advice"
  - **After — Personal style intelligence:** the same wardrobe as a living system; labels: "understands ownership", "learns preferences", "explains recommendations"
  - Arrows between panels: "Shelf → System"
- **Source:** One-Pager §1; Product Innovations §9 (product statement, competitive moat)

---

## 3. Problem

- **Slide title:** Full Wardrobes, No Answers
- **Key message:** The problem is not lack of clothes. The problem is lack of understanding.
- **Opening scene (not a list — a moment):**
  - **7:30 AM.** A person opens a full closet.
  - "I have a closet full of clothes but nothing to wear" — the most common words in our research
  - The wardrobe is a passive collection: items exist, but the person doesn't know what they own, what works together, or what to choose
- **Supporting points (the four faces of the same problem):**
  - **Wardrobe overload** — "a closet full of clothes but nothing to wear" (Alex, 28 — Product Designer)
  - **Forgotten items** — "I buy things for specific occasions and never wear them again" (Maya, 34 — Marketing Manager)
  - **Poor outfit decisions** — daily decision fatigue; "I can't tell if an outfit works until I'm already out the door" (Maya)
  - **Disconnected purchases** — "I buy things that look good in the store but don't match anything" (Alex)
  - **Generic advice** — "Fashion advice online is too generic" (Maya); "I'm embarrassed to ask basic questions" (Jordan, 22 — Software Engineer)
  - Three different lives, the same daily question: **What do I own? What works together? What should I wear?**
- **Suggested visual:** Left side — the 7:30 AM scene: open closet, morning light, a person in front of it. Right side — three persona cards (Alex / Maya / Jordan) with their verbatim quotes. No statistics — only voices.
- **Source:** UX Research §2 (personas — verbatim quotes), §3 (first-time user journey); One-Pager §2

---

## 4. Why Existing Solutions Fail

- **Slide title:** The Gap Between Apps and Understanding
- **Key message:** Existing tools digitize or generate, but none learn the user's style — the hard part is left to the user.
- **Supporting points:**
  - **Wardrobe apps organize** — manual catalogues: tedious data entry, no understanding; users want photo → automatic classification, not forms (AI classification is the core path; manual entry is only a fallback in the architecture)
  - **Shopping apps recommend** — new purchases without knowing what you already own — "looks good in the store, doesn't match anything"; LOOKSY inverts this: shopping intelligence comes after wardrobe understanding (gap analysis, compatibility)
  - **Generic AI generates** — one-size-fits-all combinations ignore the individual's wardrobe and taste — "fashion advice online is too generic" (persona)
  - **None explain themselves** — no product in this space offers explainable recommendations with negative reasoning
- **Bottom line (full-width bar, bottom of slide):**
  - **The gap: Memory + Trust + Personalization.**
  - Apps organize. Apps recommend. Apps generate. **LOOKSY understands.** This gap is the category.
- **Suggested visual:** Three-column comparison (Organize / Recommend / Generate) × (What they do / What they miss); bottom bar highlights "no memory, no trust, no personalization" → "the gap = the category"
- **Source:** UX Research §2 quotes; MVP Architecture §7 (manual entry fallback); Product Innovations §5 (shopping intelligence after wardrobe knowledge), One-Pager §4

---

## 5. Solution

- **Slide title:** From a Pile of Clothes to a Living System
- **Key message:** Not a stylist telling you what to wear — a system that understands your wardrobe and learns your taste.
- **The transformation (the deck's core slide — tell the transition, then show the proof):**
  - **Before:** a pile of clothes — passive, forgotten, no answers
  - **After:** a system that knows, learns, explains
  - The six components below are **evidence of the After**, not a feature list
- **Supporting points (evidence of "After"):**
  - **Digital Wardrobe** — every owned item digitized, searchable, connected → the system *knows* what you own
  - **AI Clothing Recognition** — photo → structured item data; the wardrobe digitizes itself
  - **Personal Style Profile** — a living model of taste → the system *learns* who you are
  - **Fashion Memory** — persistent preferences with evidence → understanding compounds over time
  - **Outfit Intelligence** — context-aware combinations (weather, occasion, rotation, palette) → recommendations fit real days
  - **Trust Layer** — every recommendation explains why → the system *explains* itself
- **Suggested visual — the central metaphor "From static shelf to living system":**
  - **Left panel — Chaotic wardrobe shelf:** unlabeled clothes, dust, forgotten items; two questions floating above it: "What do I own?" / "What works together?"
  - **Right panel — Living wardrobe intelligence system:** the same items as connected nodes — style relationships between them, context nodes (weather, occasion), recommendation arrows each labeled "Why"
  - Transition arrow between panels: "Shelf → System"
- **Source:** One-Pager §3, §6; Product Innovations §1–3

---

## 6. Product Experience

- **Slide title:** From Photo to Personal Stylist
- **Key message:** A five-step loop that gets smarter with every use — value compounds because usage feeds memory, and memory feeds recommendations.
- **Supporting points:**
  - **Upload** — photograph any item; no manual forms (optional quick style quiz at onboarding)
  - **Understand** — AI vision classifies item; user confirms or corrects (user in control)
  - **Remember** — every choice feeds Fashion Memory with evidence
  - **Recommend** — context-aware outfits: weather, occasion, rotation, saved preferences, with "Why LOOKSY picked this"
  - **Improve** — Wear / Save / Swap feedback loop; post-wear feedback ("Loved it … Not for me") trains future recommendations
- **Suggested visual:** Horizontal 5-step flow (per one-pager product flow) with a morning-screen mockup: outfit preview + evidence panel + one-tap actions (Wear / Swap / Not today)
- **Second visual — the compounding value of Fashion Memory (no real metrics, only stages):**
  - **Day 1 — Generic understanding:** recommendations based on the wardrobe alone
  - **Day 30 — LOOKSY notices preferences:** "You tend to choose earth tones" — backed by evidence
  - **Day 90 — Context-aware personal style intelligence:** recommendations match days, moods, and taste
  - Loop caption: **usage → memory → better recommendations → more usage**
- **Source:** One-Pager §5; UX Research §3 (first-time user journey); Product Innovations §2 (morning ritual, feedback loop), §3 (memory as hypotheses, confidence, decay)

---

## 7. AI Intelligence Layer

- **Slide title:** The Intelligence Stack
- **Key message:** A layered AI system: see items → embed meaning → learn the person → explain the choice.
- **Why now? (top-of-slide callout):** For the first time, four technologies come together:
  1. **Vision models** understand clothing from images (photo → structured item data)
  2. **Embeddings** enable semantic understanding of items and similarity search at scale
  3. **LLM assistants** enable natural, context-aware interaction
  4. **Memory architectures** enable personalization over time
  - The core thought: **Memory, not just generation.**
- **Supporting points:**
  - **Vision AI** — GPT-4o Vision: photo → structured clothing metadata (type, color, pattern, material, season)
  - **Embeddings** — text-embedding-3-small (1536-dim); semantic item similarity via pgvector cosine search
  - **Style Profile** — user style vector as weighted aggregate of their own item embeddings (wardrobe + choices); not style rules applied to everyone — a model built from one person's wardrobe and choices
  - **Fashion Memory** — preferences as hypotheses with confidence states, evidence, and natural decay; user can confirm, correct, or delete
  - **Feedback Loop** — wear/save/swap + post-wear ratings are the primary learning signal
- **Suggested visual:** Layered stack diagram (Vision → Embeddings → Style Profile → Memory → Feedback) with data-flow arrows; small embedding-space visualization; "Why now" as a four-technology timeline
- **Source:** AI Architecture §2–4 (providers, vision pipeline, embedding system); Product Innovations §3 (memory, decay, confidence); One-Pager §4 (Why Now), §5, §8

---

## 8. Trust Layer

- **Slide title:** Why Users Believe the Recommendations
- **Key message:** Unexplained recommendation is just a guess — LOOKSY shows its work before the user asks.
- **Product principle (not a feature):** Trust Layer is not one module among six — it is how LOOKSY communicates. Two rules it lives by:
  - **LOOKSY suggests, never prescribes** — the user decides; the AI advises
  - **LOOKSY explains, never assumes** — every claim is backed by data the user can verify
- **Supporting points:**
  - **Why recommendation:** evidence on every outfit — "You wore navy 12 times this month", "Weather: 22°C", "Meeting at 10am"
  - **Why NOT recommendation:** negative reasoning — explains why an item was skipped, not just why one was picked
  - **Honest confidence language:** "Based on your style patterns…" vs. "Based on limited data…"
  - **Memory transparency:** users see, confirm, correct, or delete any learned preference
  - **No black box, no judgment:** principles — invite correction, admit uncertainty, never gamify self-expression
- **Suggested visual:** Mock evidence panel ("Why LOOKSY picked this" + "Why LOOKSY skipped this") — from Product Innovations §1; small caption under the panel: "Not a feature — a product principle"
- **Source:** Product Innovations §1 (trust principles, evidence categories, confidence language), §3.7 (memory dashboard); One-Pager §6.2

---

## 9. MVP

- **Slide title:** MVP Scope — In Development
- **Key message:** A focused first release proving the loop: digitize, learn, recommend, explain.
- **Supporting points:**
  - **Status: in development** — currently foundation phase (architecture, database, core infrastructure)
  - MVP components (P0, per product roadmap): Digital Wardrobe · AI Clothing Recognition · Outfit Generation · Basic Fashion Memory · Trust Layer · Wear/Save/Swap Feedback Loop
  - Delivery plan per roadmap: MVP target Q3 2026 (12-week build)
  - Success criteria are roadmap targets only: e.g., >85% classification accuracy, >30% weekly retention, NPS > 40 — presented as targets, not results
- **Suggested visual:** Six MVP feature cards; timeline bar "Foundation → MVP target Q3 2026"; explicit "In development" badge
- **Source:** Roadmap §2 (MVP scope, success criteria), One-Pager §7, Implementation Plan (phases)

---

## 10. Technology Foundation

- **Slide title:** Modern Stack, Zero Ops, One Team
- **Key message:** A lean, fully managed stack that keeps focus on the AI product layer.
- **Supporting points:**
  - Next.js 16 (App Router) + TypeScript (strict) — modular monolith, type-safe end to end
  - PostgreSQL + pgvector — embeddings in the main database, no extra services
  - Drizzle ORM — schema-first, type-safe queries
  - Clerk — authentication out of the box
  - OpenAI — GPT-4o Vision + text-embedding-3-small, behind an interface-based provider abstraction (providers swappable without business-logic changes)
  - Supabase Storage — photo storage and CDN
  - Vercel — zero-config deployment, preview deploys
- **Suggested visual:** Stack table or logo grid; call out "AI behind abstraction layer" (future-proofing)
- **Source:** MVP Architecture §1.2, §2 (stack table), ADR-004 (AI abstraction); AI Architecture §2 (provider interfaces), §10 (migration strategy)

---

## 11. Business Model Hypothesis

- **Slide title:** Monetization Directions (Hypotheses — Not Yet Implemented)
- **Key message:** Several monetization paths, all built on top of wardrobe knowledge — not ads.
- **Supporting points:**
  - Premium subscription tier (Pro) — planned for v1.2 (roadmap target: ~5% conversion; internal planning target, not achieved)
  - AI style reports — weekly personalized insights
  - Personalized wardrobe analysis — gap analysis ("what's missing"), composition insights
  - Smart shopping recommendations — wishlist intelligence, product compatibility vs. existing wardrobe
  - Affiliate partnerships — product links from a position of knowing the user's wardrobe
  - Model logic: value grows with wardrobe size and learning depth — natural upgrade trigger
- **Suggested visual:** Five direction cards with "planned v1.2" timeline marker; note banner: "Hypothesis stage — none implemented"
- **Source:** Roadmap §4 (v1.2 features, targets), Product Innovations §5 (shopping intelligence), One-Pager §9

---

## 12. Roadmap

- **Slide title:** From Foundation to Platform
- **Key message:** Four phases, each building on the previous — memory is the compounding asset.
- **Supporting points:**
  - Phase 1 — Foundation: architecture, database, core infrastructure (current)
  - Phase 2 — Wardrobe Intelligence: clothing recognition, digital closet
  - Phase 3 — Personal Intelligence: fashion memory, style profile, trust layer
  - Phase 4 — Monetization & Scale: premium tier, shopping intelligence, platform
  - Timeline reference (roadmap plan): MVP Q3 2026 → v1.1 intelligence Q4 2026 → v1.2 monetization Q1 2027 → v2.0 scale Q2 2027 (internal plan, subject to change)
- **Suggested visual:** 4-phase timeline with milestone markers; each phase = one line of capabilities
- **Source:** Roadmap §1–5; One-Pager §10; Implementation Plan (phase structure)

---

## 13. Long-term Vision

- **Slide title:** The Personal Style Intelligence Layer
- **Key message:** LOOKSY is building the personal style intelligence layer: a system that understands what people own, how they choose, and why.
- **Bookend with Slide 2 — repeat the motif "Shelf → System":** the deck opened with the category claim; this slide closes with the category compounded:
  - **Slide 2:** the category we claim — wardrobe as an intelligent system
  - **Slide 13:** the category that compounds — memory grows with every interaction, and services layer on top of that understanding
- **Supporting points:**
  - Moat: a trusted AI stylist that builds understanding over time — every interaction increases personalization, transparency, and usefulness while the user stays in control
  - Platform path (roadmap v2.0+): mobile apps (iOS/Android), API integrations, opt-in social and community (style inspiration, not competition)
  - Future capabilities: human stylist network, virtual try-on (AR), sustainability insights
  - Category-defining ambition: AI that understands personal style — memory + trust + personalization as the foundation
- **Suggested visual:** Horizon graphic: today (MVP loop) → v2.0 (platform) → future (intelligence layer); right side repeats the "shelf → system" panels from Slide 2 with a "compounding" arrow — memory grows, services layer on top; closing statement line: "From a wardrobe of things to a system that understands"
- **Source:** Product Innovations §9 (moat), Roadmap §5 (v2.0), One-Pager (Final Statement)

---

## Appendix: Slide-to-Source Map

| Slide | Primary Source |
|-------|----------------|
| 1 Cover | One-Pager header |
| 2 Vision | One-Pager §1; Product Innovations §9 |
| 3 Problem | UX Research §2; One-Pager §2 |
| 4 Why Existing Solutions Fail | UX Research §2; MVP Architecture §7; Product Innovations §5 |
| 5 Solution | One-Pager §3, §6 |
| 6 Product Experience | One-Pager §5; UX Research §3; Product Innovations §2 |
| 7 AI Intelligence Layer | AI Architecture §2–4; Product Innovations §3 |
| 8 Trust Layer | Product Innovations §1, §3.7 |
| 9 MVP | Roadmap §2; One-Pager §7 |
| 10 Technology Foundation | MVP Architecture §1.2, §2; ADR-004 |
| 11 Business Model Hypothesis | Roadmap §4; Product Innovations §5 |
| 12 Roadmap | Roadmap §1–5; One-Pager §10 |
| 13 Long-term Vision | Product Innovations §9; Roadmap §5 |
