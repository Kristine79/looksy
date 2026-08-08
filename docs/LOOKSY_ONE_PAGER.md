# LOOKSY

## AI Stylist That Learns Your Personal Style Over Time

> Status: MVP in development | Product: Personal Style Intelligence Platform
> Sources: Product Innovations v1.2, Product Roadmap v1.0, UX Research v1.0, AI Architecture, MVP Architecture

---

## 1. Vision

**LOOKSY is building a new category: AI that understands personal style.**

Not "AI generates outfits" — LOOKSY is a personal style intelligence platform that turns a wardrobe into an intelligent system: it builds a digital model of what you own, learns how you actually choose, and gradually forms a personal understanding of your style that improves with every interaction.

---

## 2. Origin / User Problem

**Full wardrobes, no answers.**

People own more clothes than they use — yet every morning means another decision, most items go unworn, and purchases rarely pay off. Research from our UX program shows a consistent pattern:

- A closet "full of clothes but nothing to wear" — most items are never combined
- Daily decision fatigue: "I waste time every morning deciding what to wear"
- Impulse purchases that "look good in the store but don't match anything"
- Occasion buys worn once and forgotten
- Generic fashion advice that doesn't fit a real person's life

There is no personal assistant that understands an individual's taste — because until recently, the technology to build one did not exist.

---

## 3. Solution

**LOOKSY is a personal style intelligence platform.**

It digitizes a user's clothing, understands each item, and gradually builds a personal style profile. The core system:

| Component | What It Does |
|-----------|--------------|
| **Digital Wardrobe** | Snap a photo and your wardrobe becomes searchable and organized |
| **AI Clothing Recognition** | LOOKSY understands clothing items automatically |
| **Personal Style Profile** | A living model of your taste, built from real choices over time |
| **Fashion Memory** | LOOKSY learns preferences from real choices over time — with evidence |
| **Outfit Intelligence** | Context-aware combinations for today: weather, occasion, rotation, palette |
| **Trust Layer** | Every recommendation explains why — before the user asks |

---

## 4. Why Now

For the first time, all four pieces exist — and LOOKSY combines them into one experience:

- **Vision models** can now understand clothing from a single photo (classification, attributes, style)
- **Embeddings** capture semantic characteristics of items and enable similarity search at scale
- **LLM-based assistants** can generate personalized, context-aware recommendations
- **Personalization** is becoming the core of the next generation of consumer AI products

The result: memory, not just generation.

---

## 5. Product Flow

```
Photo Upload
    ↓
AI Clothing Analysis        → user confirms or corrects
    ↓
Digital Wardrobe            → searchable, organized
    ↓
Personal Style Memory       → builds with every interaction
    ↓
Context-aware Outfit Recommendations  → weather, occasion, rotation
    ↓
User Feedback Loop          → Wear / Save / Swap → AI learns → better tomorrow
```

---

## 6. Core Differentiators

### 1. Fashion Memory
LOOKSY learns preferences over time. Every interaction — outfits worn, saved, swapped, skipped — is stored as evidence. Patterns become hypotheses with confidence levels; old preferences decay naturally when no longer confirmed. The user can see, confirm, correct, or delete any memory. This is a compounding data moat: the longer the usage, the more personal the system.

### 2. Explainable AI / Trust Layer
Trust Layer is not a feature — it's a product principle: **LOOKSY suggests, never prescribes. LOOKSY explains, never assumes.**

Positive reasoning: every recommendation includes an expandable "Why LOOKSY picked this" with verifiable evidence ("You wore navy 12 times this month", "Weather: 22°C"). Negative reasoning: LOOKSY also explains why an item was **not** recommended. Unexplained recommendation = guess.

This trust is what makes Fashion Memory possible — users share their real choices because LOOKSY shows its work.

### 3. Personal Style Intelligence
Not generic fashion rules — an individual model of taste, built from the user's own wardrobe and choices. LOOKSY presents preferences as suggestions backed by data, never as assumptions: "You tend to choose earth tones — based on your previous outfit choices."

### 4. Wardrobe-First Approach
The primary value is helping people use what they already own. Shopping intelligence (gap analysis, wishlist analysis) comes later, from the position of knowing the user's wardrobe — not from selling first.

---

## 7. Why LOOKSY Wins

- Starts with the user's existing wardrobe, not shopping
- Learns personal style instead of applying generic fashion rules
- Builds value through memory and repeated interaction
- Creates trust through transparent recommendations

---

## 8. MVP Status

**Status: In development.** Early stage — foundation phase (architecture, database, core infrastructure).

MVP scope (per product roadmap, planned for Q3 2026):

- Digital Wardrobe
- AI Clothing Recognition
- Outfit Generation
- Basic Fashion Memory
- Trust Layer
- Wear / Save / Swap Feedback Loop

---

## 9. Technology Foundation

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL + pgvector |
| ORM | Drizzle ORM |
| Auth | Clerk (demo-mode fallback) |
| Chat / generation | OpenAI-compatible endpoint (deepseek-v4-flash) |
| Vision AI | OpenAI-compatible vision (qwen3.7-plus) |
| Embeddings | Jina AI jina-embeddings-v4 (1536-dim) |

Architecture notes: modular architecture · scalable AI provider abstraction · vector-based personalization foundation.

---

## 10. Monetization Hypothesis

Not yet implemented — exploration directions planned for the monetization phase:

- Premium subscription tier
- AI style reports (weekly insights)
- Personalized wardrobe analysis
- Smart shopping recommendations (wishlist intelligence, compatibility, gap analysis)
- Affiliate partnerships

---

## 11. Roadmap

Planned timeline per product roadmap (internal plan — not achievements):

```
Phase 1 — Foundation               Q3 2026 (MVP)
        architecture · database · core infrastructure

Phase 2 — Wardrobe Intelligence    Q4 2026
        clothing recognition · digital closet

Phase 3 — Personal Intelligence    Q1 2027
        fashion memory · style profile · trust layer

Phase 4 — Monetization & Scale     Q2 2027
        premium tier · shopping intelligence · platform
```

---

## Final Statement

**Version A — for investors:**

LOOKSY is not just another AI fashion assistant. It is a personal style intelligence layer that gets smarter with every interaction — memory, trust, and personalization combine into a compounding asset. That is the foundation of a new category: AI that understands personal style.

**Version B — for the Alchemia Studio portfolio page:**

LOOKSY is not just another AI fashion assistant. It is a personal style intelligence layer that helps people understand, organize, and use their wardrobe — and it gets smarter about each user over time, with every recommendation backed by transparent reasoning. LOOKSY suggests, never prescribes. LOOKSY explains, never assumes.

---

*This document is a product one-pager for early-stage discussions. LOOKSY is in MVP development; no user metrics, revenue, or market traction are claimed.*
