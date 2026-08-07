# LOOKSY — Product Innovations v1.2

> Version: 1.2 | Status: Active | Last updated: 2026-07-22
> Role: Chief Product Officer | Fashion-Tech Strategy
> Positioning: LOOKSY is an AI stylist that learns your personal style over time.

---

## Table of Contents

1. [Trust Layer](#1-trust-layer)
2. [Daily Ritual](#2-daily-ritual)
3. [Fashion Memory](#3-fashion-memory)
4. [Style Evolution](#4-style-evolution)
5. [Shopping Intelligence](#5-shopping-intelligence)
6. [LOOKSY Understanding](#6-looksy-understanding)
7. [Style Journey & Milestones](#7-style-journey--milestones)
8. [Product Roadmap](#8-product-roadmap)
9. [Positioning](#9-positioning)

---

## 1. Trust Layer

### 1.1 Core Principle

Every AI recommendation in LOOKSY must be transparent. Users should never wonder "where did this come from?" The Trust Layer is not a feature — it's the foundation of how LOOKSY communicates with users.

**Rule:** LOOKSY explains its reasoning before the user has to ask.

**Principle:** An unexplained recommendation is just a guess.

### 1.2 How It Works

Every recommendation includes an expandable "Why LOOKSY picked this" section:

```
Why LOOKSY picked this:

✓ You wore navy items 12 times in the last month
✓ You saved 8 outfits with relaxed tailoring
✓ Today's weather matches lightweight wool
✓ Your calendar shows a business meeting
```

### 1.3 Negative Reasoning

LOOKSY also explains why it **didn't** recommend certain items:

```
Why LOOKSY skipped this item:

✗ Similar item already exists in your wardrobe
✗ Low compatibility with your color palette
✗ Rarely matches your usual occasions
```

This builds trust by showing the AI considers alternatives — not just the first option.

### 1.4 Evidence Categories

| Evidence Type | Example | Source |
|--------------|---------|--------|
| **Worn frequency** | "You wore navy items 12 times" | Wear log |
| **Saved preference** | "You saved 8 outfits with relaxed tailoring" | Outfit saves |
| **Style pattern** | "You tend toward earth tones" | Fashion Memory |
| **Weather context** | "Weather: 22°C, low humidity" | Weather API |
| **Calendar context** | "Your calendar shows a meeting" | Calendar integration |
| **Rotation logic** | "You haven't worn this in 12 days" | Wear tracking |
| **Color harmony** | "Navy + cream is in your top palettes" | Style analysis |
| **Negative signal** | "You already have 2 similar jackets" | Closet analysis |

### 1.5 Trust Principles

| Principle | Implementation |
|-----------|---------------|
| **Show your work** | Every recommendation has expandable evidence |
| **Explain rejections** | "Why not" is as important as "why" |
| **Be honest** | If data is limited: "Based on limited data" |
| **Invite correction** | "Not quite right? Tell us what you'd prefer" |
| **No black box** | User can always see why something was suggested |
| **Admit uncertainty** | "This is a new style direction — want to explore it?" |

### 1.6 Confidence Language

LOOKSY uses honest language about what it knows:

| Confidence | LOOKSY Says |
|-----------|-------------|
| High | "Based on your style patterns..." |
| Medium | "LOOKSY noticed you tend to..." |
| Low | "This is a new pattern — you may enjoy..." |
| Very low | "Based on limited data, you might like..." |

---

## 2. Daily Ritual

### 2.1 Concept

Every morning, LOOKSY delivers a personalized outfit recommendation — tailored to the weather, the user's mood, and what they've been wearing lately. The goal: make LOOKSY a natural part of the morning routine, like checking the weather.

**Core principle:** The daily ritual should feel helpful, not prescriptive. LOOKSY suggests — the user decides.

### 2.2 Smart Morning Mode

LOOKSY works fast. The user should be able to decide in seconds.

```
07:30 AM

Your outfit is ready.

┌─────────────────────────────────────────────┐
│                                             │
│        [Outfit Visual Preview]              │
│                                             │
│     "Meeting Ready"                         │
│     22°C, Partly cloudy                     │
│                                             │
└─────────────────────────────────────────────┘

┌──────────┐  ┌──────────┐  ┌──────────┐    │
│   Wear   │  │  Change  │  │ Not today│    │
│          │  │          │  │          │    │
└──────────┘  └──────────┘  └──────────┘    │

Why LOOKSY picked this:
✓ You wore navy blazers 14 times
✓ You saved similar outfits 8 times
✓ Weather: 22°C, low humidity
```

**Key actions:**
- **Wear** — accept the outfit, mark items as worn
- **Change** — adjust one or two items
- **Not today** — skip this recommendation

No mandatory configuration. No long setup. Just decide.

### 2.3 The Morning Screen (Full View)

```
┌─────────────────────────────────────────────┐
│                                             │
│         Wednesday, July 22                  │
│         Good morning, Alex                  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │        [Outfit Visual Preview]        │  │
│  │                                       │  │
│  │     Outfit of the Day                 │  │
│  │     "Meeting Ready"                   │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  24°C  Partly cloudy                 │  │
│  │  Meeting at 10am                      │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  Why LOOKSY picked this:             │  │
│  │                                       │  │
│  │  ✓ You wore navy blazers 14 times    │  │
│  │  ✓ You saved similar outfits 8 times │  │
│  │  ✓ You tend toward structured pieces │  │
│  │  ✓ Weather: 22°C, low humidity       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │   Wear   │  │   Swap   │  │  Save   │  │
│  │   This   │  │  Items   │  │  for    │  │
│  │          │  │          │  │  Later  │  │
│  └──────────┘  └──────────┘  └─────────┘  │
│                                             │
│  Skip for today →                          │
│                                             │
└─────────────────────────────────────────────┘
```

### 2.4 Components

| Element | Implementation |
|---------|---------------|
| **Outfit selection** | AI analyzes weather, recent wear history, style patterns |
| **Visual presentation** | Items arranged as a flat-lay or styled on a mannequin silhouette |
| **Explanation** | Natural language: why this outfit, why today, what makes it work |
| **One-tap action** | "Wear This" — marks items as worn, updates rotation tracking |
| **Evidence** | Expandable section showing the data behind the recommendation |

### 2.5 Weather Context

```
Weather Integration:
├── Temperature → fabric weight recommendations
├── Conditions → practical adjustments (rain = no suede)
├── Humidity → material breathability considerations
├── UV Index → color recommendations (light colors for sun)
└── Forecast → multi-day outfit planning (future)
```

### 2.6 Occasion Selector (MVP)

```
Quick context input (optional):

┌─────────────────────────────────────────┐
│  What's the occasion today?             │
│                                         │
│  [Work]  [Casual]  [Date]              │
│  [Travel]  [Event]  [No preference]    │
└─────────────────────────────────────────┘
```

**MVP:** Simple occasion buttons. No calendar integration required.

**Future:** Optional calendar integration for automatic occasion detection.

### 2.7 Mood Selector

```
Morning Mood Input (quick, non-intrusive):
┌─────────────────────────────────────────┐
│  How are you feeling today?             │
│                                         │
│  [Confident]  [Relaxed]                │
│  [Energized]  [Creative]               │
│  [Safe]       [Surprise me]            │
└─────────────────────────────────────────┘

Mood affects:
- Color palette selection (confident → bolder options)
- Formality preference (relaxed → casual)
- Risk tolerance (safe → proven combinations)
- Novelty level (surprise → unusual pairings)
```

### 2.8 AI Explanation

Every outfit comes with a personalized rationale:

**Explanation components:**
1. **Why this outfit** — contextual reasoning (weather, occasion, mood)
2. **Why these colors** — color theory applied to their palette
3. **Why now** — rotation logic (haven't worn this in X days, seasonal relevance)
4. **Style connection** — links to their style profile ("fits your minimalist tendency")
5. **Pro tip** — fashion advice ("roll up the sleeves for a more relaxed look")

**Tone:** Warm, knowledgeable, slightly witty. Never preachy. Like a stylish friend, not a textbook.

**Key rule:** Every claim must be backed by data the user can verify. "You tend toward earth tones" is backed by "You wore earth tones 67% of the time in the last 30 days."

### 2.9 Delivery

| Channel | Timing | Content |
|---------|--------|---------|
| Push notification | 7:00 AM (configurable) | "Your outfit is ready" with thumbnail |
| In-app morning card | On first open | Full outfit presentation with evidence |
| Widget (iOS) | Glanceable | Outfit preview + weather |
| Email digest | Weekly summary | "This week's outfits" + insights |

### 2.10 Outfit Feedback Loop

After wearing an outfit, LOOKSY asks for feedback:

```
How did it feel?

😊 Loved it
🙂 Good
😐 Okay
🙅 Not for me
```

If "Not for me":

```
What was off?

[Too formal]  [Too casual]
[Uncomfortable]  [Wrong weather]
[Not my style]  [Color mismatch]
```

This data is the primary source for model learning. Every outfit feedback improves future recommendations.

### 2.11 Engagement Loop

```
Open app → See outfit → Understand why → Tap "Wear This" →
Wear outfit → Give feedback → LOOKSY learns →
Better recommendations tomorrow → Repeat

Key: The feedback loop is the critical action.
     Every response feeds the AI and builds trust.
```

---

## 3. Fashion Memory

### 3.1 Concept

LOOKSY builds a persistent, evolving understanding of each user's fashion preferences. Fashion Memory captures what users like, what they avoid, and the patterns that emerge from their choices over time.

**Core principle:** LOOKSY learns your style patterns and helps you understand your own preferences. It doesn't claim to know you better than you know yourself — it helps you see patterns you might not notice.

### 3.2 Memory as Hypotheses

LOOKSY treats every learned preference as a **hypothesis**, not absolute truth. The AI says: "Based on your behavior, we think X" — not "We know X about you."

| Old Approach | New Approach |
|--------------|--------------|
| "You prefer earth tones" | "You tend to choose earth tones" |
| "You love structured blazers" | "Structured pieces appear in 73% of your saved outfits" |
| "You never wear prints" | "You've worn prints in 4 of 42 outfits" |
| "Your style is minimalist" | "Your style leans toward minimal" |

### 3.3 Memory with Evidence

Every memory includes evidence:

```
LOOKSY noticed:

You tend to choose olive and navy colors.

Based on:
• 23 outfits selected
• 7 saved combinations
• 12 worn items

Is this accurate?

[Yes, that's me]
[Not really]
[Adjust preference]
```

### 3.4 Memory Confidence States

LOOKSY doesn't show every weak hypothesis to the user. Internal confidence determines visibility:

| Confidence | State | User Sees |
|-----------|-------|-----------|
| **0–40%** | Emerging signal | Nothing (used internally only) |
| **41–70%** | Possible pattern | Nothing (used carefully in recommendations) |
| **71%+** | Confirmed pattern | Shown in Memory Dashboard with evidence |

**Rule:** Don't overwhelm users with uncertain guesses. Wait until a pattern is strong enough to present with confidence.

### 3.5 Memory Decay

LOOKSY understands that style changes. Old preferences gradually lose influence if the user no longer confirms them.

```
Memory: Oversized streetwear preference

Last confirmed: January 2025
Current influence: Low
Reason: User hasn't chosen oversized items in 6 months
```

#### Decay Rules

| Memory Age | Last Confirmed | Influence |
|-----------|---------------|-----------|
| Recent | Within 30 days | Full |
| Active | Within 90 days | High |
| Aging | 90–180 days | Medium |
| Fading | 180+ days | Low |
| Dormant | Never confirmed | Minimal |

**Key rule:** Decay is gradual, not sudden. Old preferences don't disappear — they quietly recede. If the user re-engages with an old style, the memory reactivates.

### 3.6 Memory Architecture

```
Fashion Memory
│
├── Explicit Preferences (stated)
│   ├── Favorite colors (user selected)
│   ├── Disliked styles (user rejected)
│   ├── Preferred brands
│   ├── Size information
│   └── Budget sensitivity
│
├── Behavioral Patterns (observed)
│   ├── Items most worn → "You tend toward earth tones"
│   ├── Items least worn → "You rarely choose bold patterns"
│   ├── Outfits saved vs dismissed
│   ├── Swap patterns in outfit generation
│   └── Seasonal preferences
│
├── Contextual Preferences (inferred with confidence)
│   ├── "You tend to choose structured pieces for meetings"
│   ├── "You prefer comfort on Mondays"
│   ├── "You dress up more when it's sunny"
│   └── "You avoid loud prints in professional settings"
│
├── Negative Space (what user avoids)
│   ├── Colors never combined together
│   ├── Styles consistently rejected
│   ├── Brands avoided
│   └── Combinations that were dismissed
│
└── Memory Metadata
    ├── Created date
    ├── Last confirmed date
    ├── Last influenced recommendation
    ├── Confidence score (internal)
    └── Decay status
```

### 3.7 Memory Transparency Dashboard

```
Your Fashion Memory

LOOKSY is learning your style. Here's what
we've picked up so far:

─────────────────────────────────────────────

Color Preferences
"You tend to choose earth tones"
Based on: 37 outfits analyzed, 12 saved looks, 18 worn items
[Confirm] [Correct] [Delete]

Silhouette Preference
"You tend toward structured over relaxed fits"
Based on: 28 outfits analyzed
[Confirm] [Correct] [Delete]

Occasion Pattern
"You tend to dress up for Monday meetings"
Based on: 8 observations
[Confirm] [Correct] [Delete]

Things You Avoid
"You rarely choose bold prints"
Based on: 42 outfits analyzed
[Confirm] [Correct] [Delete]

─────────────────────────────────────────────

[View All Memories]
[Reset Memory]
[Export Data]

Your data is yours. You can correct, delete,
or reset any preference at any time.
```

### 3.8 Memory Types & Signals

| Memory Type | Source | Decay Rate | User Can Edit |
|------------|--------|------------|---------------|
| **Favorite color** | Explicit + worn frequency | Slow | Yes |
| **Disliked style** | Explicit rejection | None | Yes |
| **Preferred brand** | Worn frequency | Slow | Yes |
| **Successful combo** | Outfit worn + positive feedback | Medium | Yes |
| **Rejected combo** | Dismissed outfit + no wear | Medium | Yes |
| **Context preference** | Correlation between context + choice | Medium | Yes |
| **Occasion style** | Calendar + outfit correlation | Low | Yes |

### 3.9 Memory Lifecycle

```
New interaction
│
├── 1. Capture raw signal
│   ├── User taps "Wear This" → positive signal
│   ├── User gives outfit feedback → explicit signal
│   ├── User dismisses outfit → mild negative signal
│   ├── User edits AI classification → correction signal
│   ├── User saves outfit → strong positive signal
│   └── User swaps item in generated outfit → preference signal
│
├── 2. Process signal
│   ├── Update relevant memory type
│   ├── Adjust confidence score
│   ├── Cross-reference with existing memories
│   ├── Update decay timestamp
│   └── Log data points for transparency
│
├── 3. Store memory
│   ├── Update user_style_profile in database
│   ├── Update confidence metadata
│   ├── Log evidence chain
│   └── Prepare transparency data (what + confidence + basis)
│
└── 4. Apply memory
    ├── Feed into outfit generation prompt
    ├── Influence recommendation ranking
    ├── Generate evidence text for recommendations
    └── Present to user with "Is this accurate?" prompt
```

### 3.10 Memory in Action

**Scenario: User rejects an outfit**

```
AI generates: "Casual Friday" outfit with striped shirt + khaki pants
User: Dismisses immediately (signal: negative)

Memory update:
├── Pattern: "You tend to avoid striped shirts for casual outfits"
├── Confidence: Low (single data point, not shown to user)
├── Evidence: 1 dismissal, 0 saves of striped casual outfits
└── User prompt: "Not a fan of stripes for casual? Let us know."

Next day, AI generates similar outfit with solid shirt instead:
User: Saves it (signal: positive)

Memory update:
├── Pattern confirmed: "You prefer solid colors for casual outfits"
├── Confidence: Medium (two consistent signals)
├── Evidence: 2 casual outfits, 1 saved (solid), 1 dismissed (striped)
└── No user prompt needed — pattern is emerging
```

**Scenario: Context preference learned**

```
Observation pattern over 2 months:
- Mondays: User selects outfits with structured pieces
- Mondays: Outfits tend to be neutral colors
- Mondays: User often chooses blazers

Inference:
├── "On Mondays, you tend to choose structured, neutral outfits"
├── Confidence: Medium (consistent over 8 weeks, but n=8)
├── Evidence: 8 Monday outfits, 6 featured structured pieces
└── User can confirm or dismiss

AI explanation: "You tend to reach for structured pieces on
Mondays — this blazer combo fits that pattern. Want to keep
this direction?"
```

### 3.11 Memory Confidence Thresholds

| Confidence | Interpretation | AI Behavior |
|-----------|----------------|-------------|
| **0–40%** | Emerging pattern | Don't surface to user yet; use quietly in recommendations |
| **41–60%** | Possible pattern | Use in recommendations; don't claim in evidence text |
| **61–80%** | Likely pattern | Surface in evidence with confidence shown |
| **81–95%** | Strong pattern | Confidently include in explanations |
| **96–100%** | Established preference | Treat as confirmed user preference |

---

## 4. Style Evolution

### 4.1 Concept

Style is not static. It evolves with life changes, experience, and discovery. LOOKSY tracks this evolution and presents it as a visual narrative — helping users understand how their style might be changing.

**Core principle:** Style evolution is a personal journey, not a judgment. LOOKSY observes changes and asks the user to confirm — it never declares "your style changed" without asking.

### 4.2 Style Timeline

```
Your Style Evolution

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Oct 2025          Jan 2026          Jul 2026
●─────────────────●─────────────────●
│                 │                 │
Casual Street     Minimal Casual    Minimal Premium
• Oversized       • Fitted basics   • Tailored
• Bold colors     • Neutral palette • Earth tones
• Graphic tees    • Plain knits     • Quality fabr.

"Over 9 months, your choices have moved from
casual streetwear toward a more refined
direction. Your color palette has shifted
from bold to earth tones."
```

### 4.3 Style Shift Detection

When LOOKSY detects a possible shift in style, it presents it as a **question**, not a statement.

```
LOOKSY noticed changes

Compared with 9 months ago:

+ More neutral colors
+ More structured pieces
- Less graphic prints

Does this reflect your current style?

┌──────────────────────┐  ┌──────────────────────┐
│  Yes, this is me     │  │  No, it's temporary  │
└──────────────────────┘  └──────────────────────┘
```

If "Yes": LOOKSY adjusts style profile and future recommendations
If "No": LOOKSY maintains current profile, treats as variation

#### Shift Detection Rules

| Signal | Threshold | Action |
|--------|-----------|--------|
| Color palette shift | >20% change in dominant colors over 30 days | Ask user |
| Formality shift | >0.5 point change in average formality over 30 days | Ask user |
| Brand shift | New dominant brand not in previous top 5 | Ask user |
| Pattern shift | New pattern appears in >15% of recent outfits | Ask user |
| Silhouette shift | Fit preference change (slim ↔ relaxed) | Ask user |

**Key rule:** Always ask. Never assume. The user is the authority on their own style.

### 4.4 Evolution Dimensions

| Dimension | What Changes | How Measured |
|-----------|-------------|-------------|
| **Formality** | Casual ↔ Refined | Average formality of worn items over time |
| **Color palette** | Bold ↔ Muted | Color diversity and saturation trends |
| **Brand alignment** | High-street ↔ Premium | Brand tier distribution in worn items |
| **Pattern usage** | Safe ↔ Experimental | Pattern diversity over time |
| **Fit preference** | Relaxed ↔ Tailored | Sub-type analysis (oversized, slim, regular) |
| **Risk tolerance** | Safe ↔ Bold | Novelty score of chosen outfits |
| **Seasonal awareness** | Unaware ↔ Adaptable | Weather-appropriate outfit ratio |

### 4.5 Style DNA (Current Snapshot)

```
Style DNA — Alex Chen
Generated: July 2026

Primary Direction: Minimal Premium
├── Based on: 142 outfits analyzed

Color Profile:
├── Dominant: Navy (23%), Cream (18%), Olive (15%)
├── Accent: Rust (8%), Forest Green (6%)
├── Less frequent: Neon, pastel pink
└── Palette temperature: Warm neutral

Silhouette:
├── Tendency: Relaxed tailoring
├── Fit: Between slim and regular
├── Proportions: Balanced, not oversized
└── Frequent piece: Structured blazer

Fabric:
├── Preferred: Cotton, linen, merino wool
├── Less frequent: Polyester, shiny materials
└── Texture: Subtle texture preferred

Formality Range:
├── Work: 3.8/5 (smart casual to business)
├── Weekend: 2.1/5 (casual relaxed)
├── Evening: 3.5/5 (elevated casual)
└── Average: 3.1/5

Style Words: Effortless, Curated, Earthy, Understated
```

### 4.6 Comparison Modes

| Mode | Description |
|------|-------------|
| **Month vs Month** | "June vs July — you wore more earth tones this month" |
| **Season vs Season** | "Summer vs Winter — your formality dropped 0.8 points" |
| **Year vs Year** | "2025 vs 2026 — you discovered structured pieces" |
| **Then vs Now** | Full evolution from first outfit to latest |

---

## 5. Shopping Intelligence

### 5.1 Concept

Before users buy anything, LOOKSY helps them understand how a potential purchase fits with their existing wardrobe. This transforms shopping from impulse-driven to intentional.

**Core principle:** The best purchase is one that multiplies your wardrobe's value. LOOKSY helps you see that value.

### 5.2 Wishlist Intelligence (MVP v1.2)

```
Will this fit my wardrobe?

User photographs or pastes a product:

┌─────────────────────────────────────────────────────┐
│  LOOKSY Analysis: Navy Wool Blazer                  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │                                              │  │
│  │  [Product Image]                             │  │
│  │                                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  Compatibility: Strong match                       │
│                                                     │
│  This blazer would work with:                      │
│  ├── 18 items in your wardrobe                    │
│  ├── Your earth-tone palette                      │
│  └── Your structured silhouette preference        │
│                                                     │
│  Creates 7 possible outfits                        │
│                                                     │
│  Something to consider:                            │
│  You already have a navy jacket (more casual).     │
│  This blazer adds formal versatility.              │
│                                                     │
│  Why LOOKSY recommends this:                       │
│  ✓ Fills a gap in your formal wear                 │
│  ✓ Pairs with your most-worn items                 │
│  ✓ Season-appropriate for fall/winter              │
│                                                     │
│  Why LOOKSY hesitates:                             │
│  ✗ You already own a navy jacket                   │
│  ✗ Similar texture to items you own                │
│                                                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  │
│  │   Looks    │  │  Consider  │  │    Skip    │  │
│  │   great    │  │  alternatives│ │            │  │
│  └────────────┘  └────────────┘  └────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### MVP Input Methods

| Method | Implementation |
|--------|---------------|
| **Photo scan** | User photographs item in store → AI analyzes |
| **Link paste** | User pastes product URL → AI scrapes + analyzes |

#### MVP Decision Scale

| Compatibility | LOOKSY Says |
|--------------|-------------|
| **Strong** | "Looks great" — strong addition to wardrobe |
| **Good** | "Worth considering" — good fit, may overlap with existing |
| **Weak** | "Consider alternatives" — could work, but may not maximize wardrobe |
| **Poor** | "Skip" — doesn't align well with current style/wardrobe |

### 5.3 Future Versions

| Version | Feature | Description |
|---------|---------|-------------|
| v1.3 | **Wardrobe Gap Analysis** | Proactive suggestions for missing essentials |
| v1.4 | **Browser Extension** | Real-time shopping intelligence on retailer sites |
| v2.0 | **Affiliate Commerce** | Curated shopping with revenue attribution |
| v2.0 | **Price Tracking** | Alert when wishlist items go on sale |
| v2.1 | **Shopping Assistant** | Conversational AI for purchase decisions |

### 5.4 Post-Purchase Learning

```
Feedback loop:

User buys recommended item
→ LOOKSY tracks: did they follow recommendation?
→ If yes: recommendation model strengthens
→ If no: learn from what they bought instead
→ If item is rarely worn: recommendation recalibrates

Buy → Wear (or not) → Update model → Better recommendations
```

---

## 6. LOOKSY Understanding

### 6.1 Concept

Instead of scoring the user's style (which can feel judgmental), LOOKSY measures **how well it understands** the user's style. The metric reflects the AI's learning progress, not the user's worth.

**Core principle:** This is not a style grade. It's a progress indicator for how well LOOKSY knows you.

### 6.2 Understanding Levels

LOOKSY uses human-readable levels, not precise percentages:

```
LOOKSY Understanding: Growing

Here's how well we know each area:

─────────────────────────────────────────────

Wardrobe Health        ████████░░  Familiar
LOOKSY has a good understanding of your
wardrobe. Most essentials are covered.

Versatility            ██████░░░░  Growing
LOOKSY has seen you in a few contexts.
More occasions would help here.

Personal Consistency   ███████░░░  Familiar
Your style patterns are clear.
Recommendations should feel on-target.

Style Growth           ███████░░░  Growing
LOOKSY can see your style direction.
Your recent choices suggest a shift toward
structured, earth-tone pieces.

─────────────────────────────────────────────

Based on:
✓ 46 outfit choices
✓ 23 worn items
✓ 12 saved looks
```

### 6.3 Understanding Levels

| Level | What It Means | User Experience |
|-------|---------------|-----------------|
| **Learning** | LOOKSY is just getting started | General suggestions, limited personalization |
| **Growing** | Patterns are emerging | Improving relevance, some personalized picks |
| **Familiar** | LOOKSY knows your style | Consistently relevant recommendations |
| **Deep Understanding** | LOOKSY knows you well | Feels like a personal stylist |

### 6.4 Understanding Dimensions

| Dimension | What It Measures | How to Improve |
|-----------|-----------------|----------------|
| **Wardrobe Health** | How complete is the wardrobe for the user's style | Add items, fill gaps, maintain items |
| **Versatility** | How many different contexts LOOKSY has seen | Use for different occasions, seasons |
| **Personal Consistency** | How clear the style patterns are | Consistent choices help LOOKSY learn |
| **Style Growth** | Whether style direction is clear | Engage with recommendations, provide feedback |
| **Engagement Depth** | How much data LOOKSY has to work with | Upload items, log outfits, give feedback |

### 6.5 Weekly Report

```
Your Week in Style

LOOKSY Understanding: Growing → Familiar

What improved:
├── Personal Consistency grew
│   (Your choices this week were very on-brand)
└── Wardrobe Health grew
    (You wore 2 underused items)

Where LOOKSY could learn more:
└── Versatility: Try wearing outfits for
    a new occasion type

This week's outfit highlight:
┌──────────────────────────────────────────┐
│ Tuesday's meeting look                   │
│ Why it worked: weather match, strong     │
│ color harmony, appropriate formality     │
└──────────────────────────────────────────┘
```

---

## 7. Style Journey & Milestones

### 7.1 Concept

LOOKSY celebrates personal progress, not competition. Users reach milestones for their individual style journey — not for outperforming others. Fashion is personal expression; the only benchmark is your own growth.

**Core principle:** Motivate through self-discovery, not social pressure.

### 7.2 Style Journey

```
Your Style Journey

Milestones:
✓ Found your signature colors
✓ Built your first capsule wardrobe
✓ Created 100 looks
✓ Wore something new for 7 days straight
✓ LOOKSY learned your style patterns
○ Explored a new style direction
○ Built a complete seasonal wardrobe
○ Maintained consistent style for 3 months
```

### 7.3 Milestone Categories

#### Wardrobe Milestones

| Milestone | Achievement |
|-----------|-------------|
| **First Upload** | Add your first clothing item |
| **Wardrobe 10** | Upload 10 items |
| **Wardrobe 25** | Upload 25 items |
| **Wardrobe 50** | Upload 50 items |
| **Full Wardrobe** | Upload 100 items |
| **Color Collector** | Have items in 8+ colors |
| **Organized** | Categorize all items with tags |

#### Outfit Milestones

| Milestone | Achievement |
|-----------|-------------|
| **First Look** | Generate your first outfit |
| **Look Week** | Wear different outfits 7 days straight |
| **Look Month** | 30 consecutive days of outfit logging |
| **50 Looks** | Create 50 unique outfit combinations |
| **Season Master** | Create outfits for all 4 seasons |
| **Occasion Pro** | Create outfits for 5+ occasions |

#### Style Development Milestones

| Milestone | Achievement |
|-----------|-------------|
| **Colors Found** | LOOKSY identifies your signature colors |
| **Style Emerging** | LOOKSY Understanding reaches Growing |
| **Style Clear** | LOOKSY Understanding reaches Familiar |
| **Style Defined** | LOOKSY Understanding reaches Deep Understanding |
| **Evolution Tracked** | 3-month style evolution visible |
| **Palette Pro** | Consistent color palette for 60 days |

#### Engagement Milestones

| Milestone | Achievement |
|-----------|-------------|
| **Week One** | 7 days of daily engagement |
| **Month One** | 30 days of engagement |
| **Year One** | 365 days of engagement |
| **100 Looks** | Create 100 different outfits |
| **Feedback Given** | Confirm or correct 10 memories |

### 7.4 Personal Progress

```
Your Progress This Month

Milestones achieved:
✓ Look Week — 7 days of different outfits
✓ Colors Found — Earth tones identified

In progress:
○ Style Clear — currently at Growing
○ Wardrobe 50 — 38/50 items uploaded

Your style this month:
├── 12 unique outfits worn
├── 8 items newly added
└── Most worn: Navy blazer (6 times)
```

### 7.5 Engagement Hooks (Subtle, Not Aggressive)

| Hook | Trigger | Tone |
|------|---------|------|
| **Morning outfit** | Daily push notification | "Your outfit is ready" |
| **Milestone achieved** | After qualifying action | "You found your signature colors" |
| **Weekly summary** | Sunday evening | "This week in your style" |
| **Understanding update** | When understanding grows | "LOOKSY is getting to know you better" |
| **Style shift** | Detected pattern change | "Your style may be evolving — want to explore?" |

**Rules:**
- Max 1 push notification per day
- Never guilt-trip: no "You missed a day!"
- Never compare: no "You're rank #47"
- Always positive: celebrate progress, not perfection

### 7.6 Anti-Patterns (What We Avoid)

| Anti-Pattern | Why | Alternative |
|-------------|-----|-------------|
| Leaderboards | Fashion is not a competition | Personal progress only |
| XP / Levels | Feels like a game, not a tool | Milestones feel earned, not grinded |
| Streak pressure | "Don't break your streak!" causes anxiety | Gentle encouragement, no guilt |
| Social comparison | "Your friend has higher style score" is toxic | Individual journey focus |
| Shame-based motivation | "You wore the same outfit twice" is hurtful | Positive framing: "Try something new" |
| Aggressive notifications | Causes app fatigue | Max 1 push/day, opt-in only |
| Pay-to-win | Undermines trust | All features available to all users |

---

## 8. Product Roadmap

### MVP (v1.0 — 0-3 months)

| Feature | Priority | Why |
|---------|----------|-----|
| **Digital Wardrobe** | P0 | Foundation of everything |
| **AI Clothing Recognition** | P0 | Core value proposition |
| **Outfit Generation** | P0 | Daily engagement driver |
| **Basic Fashion Memory** | P0 | Competitive differentiator |
| **Trust Layer** | P0 | Builds trust from day one |
| **Wear / Save / Swap Feedback** | P0 | Feeds the learning loop |

### Version 1.1 (3-6 months)

| Feature | Priority | Why |
|---------|----------|-----|
| **Outfit Feedback Loop** | P0 | Primary learning signal |
| **Style DNA** | P1 | Deepens personalization |
| **LOOKSY Understanding** | P1 | Transparency + engagement |
| **Memory Transparency** | P1 | User control + trust |
| **Weekly Reports** | P1 | Retention through insight |
| **Basic Milestones** | P1 | Celebrates personal progress |

### Version 1.2 — Monetization (6-9 months)

| Feature | Priority | Why |
|---------|----------|-----|
| **Wishlist Intelligence** | P0 | Pre-purchase analysis |
| **Shopping Intelligence** | P0 | Revenue driver |
| **Product Compatibility** | P0 | Core shopping feature |
| **Affiliate Monetization** | P0 | Business model |
| **Wardrobe Gap Analysis** | P1 | Drives intentional purchases |

### Future (9+ months)

| Feature | Description |
|---------|-------------|
| **Browser Extension** | Real-time shopping intelligence |
| **Retailer Integrations** | Direct product feeds |
| **Social Features** | Opt-in outfit sharing |
| **Community** | Style inspiration (not competition) |

---

## 9. Positioning

### Product Statement

LOOKSY is a personal AI stylist that learns your style over time. It suggests outfits based on your wardrobe and the weather — and always explains why.

### Competitive Moat

LOOKSY's competitive moat is not recommendation accuracy alone.

The moat is a **trusted AI stylist that builds understanding over time**.

Every interaction makes LOOKSY more personalized, transparent, and useful — while keeping the user in control of their own style identity.

### Key Differentiators

| Differentiator | What It Means |
|---------------|---------------|
| **Trust Layer** | Every recommendation is explainable |
| **Negative Reasoning** | Explains why items were NOT recommended |
| **Memory as Hypotheses** | AI presents preferences as suggestions, not facts |
| **Memory Decay** | Old preferences fade naturally over time |
| **User Control** | Users confirm, correct, or delete any memory |
| **Style Shift Detection** | AI asks before assuming changes |
| **LOOKSY Understanding** | Measures AI learning, not user worth |
| **Personal Milestones** | Celebrates progress, never competes |

### What LOOKSY Is Not

| LOOKSY Is | LOOKSY Is Not |
|-----------|---------------|
| A personal stylist | A fashion judge |
| A style assistant | A rating system |
| A wardrobe manager | A game |
| A daily ritual | A source of anxiety |
| A trusted advisor | A black box |

---

*This document defines LOOKSY as a premium, trust-focused AI stylist. The product learns with the user, explains its reasoning, and celebrates personal progress — never judges, never pressures, never gamifies self-expression.*
