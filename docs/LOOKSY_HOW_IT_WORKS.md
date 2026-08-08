# How LOOKSY Works

> Status: **MVP in development.** No launched users or revenue are claimed.
> This document explains the product for non-technical readers.
> Developers: technical details live in the architecture documents (see "Further reading" at the end).

---

## From Wardrobe App to Personal Style Intelligence

LOOKSY is not only an app that generates outfits.

It creates a **personal style intelligence system** that understands:

- what a person owns;
- what they wear;
- what they prefer;
- how their style evolves over time.

Every piece of the system — from the first photo to a recommended outfit — is designed
around one idea: **the more you use LOOKSY, the better it understands you.**

---

## 1. Adding Clothes

It starts with what you already have. A user uploads a photo of a clothing item.

AI analyzes the photo and recognizes:

- clothing category (shirt, jacket, trousers, dress…);
- colors;
- style;
- season suitability;
- formality level;
- other attributes.

Simple flow:

```
Photo
  ↓
AI Clothing Recognition
  ↓
Digital Wardrobe
```

The user can confirm or correct what AI recognized. The user always has the final word.

---

## 2. Digital Wardrobe

LOOKSY transforms a collection of photos into an **organized, intelligent wardrobe**.

Each item gets:

- **visual information** — the photo itself;
- **metadata** — category, colors, style, season, formality;
- **relationships with other items** — which items look similar, which go together.

Why does this matter? A wardrobe with photos alone is just a photo album.
A wardrobe with structured information about every item can be:

- **searched** — "show me all my summer jackets";
- **understood** — by both the user and the AI.

The digital wardrobe becomes the foundation everything else is built on.

---

## 3. Understanding Similar Items (Embeddings)

For AI to work with a wardrobe, it needs to understand *meaning*, not just photos.

For each clothing item, AI creates a **"digital fingerprint"** that captures its
characteristics in a way machines can compare.

**Similar items have similar fingerprints.**

Example — a white shirt:

```
White shirt
  ↓
similar:
  • white blouse
  • minimal jacket
  • neutral style items
```

This is how LOOKSY finds items that go well together and avoids combining things
that clash. These digital fingerprints are called **embeddings**.

No math needed to understand the effect: similar items cluster together,
and LOOKSY can find them instantly, even in a large wardrobe.

---

## 4. How LOOKSY Finds Relevant Information (RAG)

LOOKSY does **not** ask an AI model to guess from nothing.

Before generating a recommendation, it **retrieves** the relevant information
from the user's own personal knowledge base:

- the user's clothes;
- previous outfits;
- wear history;
- saved looks;
- style memories.

```
User request
  ↓
Search personal wardrobe knowledge
  ↓
AI creates recommendation
```

This approach is called **RAG — retrieval + generation**:
first find the right facts, then generate an answer based on those facts.
The result: recommendations are grounded in *this user's* wardrobe and history,
not in generic fashion rules.

---

## 5. Learning From User Behavior (Feedback Loop)

Every interaction with LOOKSY becomes a **signal** — a piece of evidence about
what the user actually likes.

Examples of signals:

- the user **wears** an outfit;
- the user **saves** an outfit;
- the user **swaps** an item for another one;
- the user **skips** a recommendation.

LOOKSY learns:

- what works;
- what does not;
- what patterns appear repeatedly.

One action means little. Repeating patterns mean a lot.

---

## 6. Personal Style Memory

Feedback, accumulated over time, creates **long-term understanding** — a
personal style memory.

Example. If signals repeat:

- wears earth tones often;
- saves similar outfits;
- chooses neutral colors;

then the memory forms:

> "This user tends to prefer earth tones."

Important: **a memory is never a guess.** Every memory has supporting
evidence — the actual actions that created it. LOOKSY can always show
where a memory came from, and the user can confirm, correct, or delete it.

---

## 7. Confidence Model

LOOKSY does not immediately assume preferences. It measures its own confidence
and adjusts it over time.

Example:

- one interaction → **"possible preference"**;
- repeated behavior → **"strong preference"**.

Confidence changes over time:

- old preferences **fade** when they are no longer confirmed by new behavior;
- new behavior **updates** the understanding.

A single episode never becomes a strong belief. LOOKSY stays honest about
how sure it is.

---

## 8. Trust Layer: Why LOOKSY Made This Recommendation

Every recommendation should answer the question: **"Why this outfit?"**

LOOKSY explains its reasoning with concrete, verifiable evidence:

> "I selected this jacket because:
> - you wore it 8 times;
> - you often choose similar colors;
> - it matches your saved outfits."

LOOKSY never claims AI is always correct. Instead, it emphasizes
**transparency**: the reasoning is visible, grounded in real data,
and the user can disagree.

LOOKSY suggests — it never prescribes.

---

## 9. What Happens If AI Is Unavailable?

AI services can temporarily fail — that is normal for any cloud system.

LOOKSY is designed to **degrade gracefully**:

- instead of showing an error, it uses the available wardrobe data;
- it provides **deterministic recommendations** based on stored information
  (similar items, wear history, colors, saved outfits);
- the user experience stays intact.

Even without AI, the wardrobe remains searchable, and the user's data
is never lost. AI is an enhancement — the user's wardrobe data is the foundation.

---

## 10. Complete System Flow

```
1. User uploads photo of clothing item
        ↓
2. AI recognizes item (category, colors, style, season, formality)
        ↓
3. Item joins the Digital Wardrobe with its own "fingerprint"
        ↓
4. User requests a look (occasion, mood, weather)
        ↓
5. LOOKSY searches personal wardrobe knowledge
        ↓
6. AI creates a recommendation — with visible reasoning ("Why this outfit?")
        ↓
7. User reacts: wears / saves / swaps / skips
        ↓
8. Feedback becomes evidence → personal style memory updates
        ↓
9. Next recommendation is more personal — the loop continues
```

The more the loop runs, the more intelligent the system becomes —
**that is how LOOKSY gets smarter over time.**

---

## Further Reading

Product-oriented:

- [LOOKSY One Pager](LOOKSY_ONE_PAGER.md) — vision, problem, solution;
- [LOOKSY Product Innovations](LOOKSY_PRODUCT_INNOVATIONS.md) — detailed product concepts;
- [LOOKSY Roadmap](LOOKSY_ROADMAP.md) — phases and plans.

Technical (for developers):

- [LOOKSY Architecture](LOOKSY_ARCHITECTURE.md) and [MVP Architecture](LOOKSY_MVP_ARCHITECTURE.md);
- [LOOKSY AI Layer](LOOKSY_AI_LAYER.md) — vision, embeddings, RAG;
- [LOOKSY Recommendation Engine](LOOKSY_RECOMMENDATION_ENGINE.md);
- [LOOKSY Fashion Memory Automation](LOOKSY_FASHION_MEMORY_AUTOMATION.md) — evidence and confidence model;
- [ARCHITECTURE_DECISIONS](ARCHITECTURE_DECISIONS.md) — ADRs behind the system.
