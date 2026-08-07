# LOOKSY — UX Research

> Version: 1.0 | Status: Active | Last updated: 2026-07-22
> Role: UX Lead | User Research & Experience Design

---

## Table of Contents

1. [Research Overview](#1-research-overview)
2. [User Personas](#2-user-personas)
3. [User Journeys](#3-user-journeys)
4. [Information Architecture](#4-information-architecture)
5. [Interaction Patterns](#5-interaction-patterns)
6. [Usability Testing Plan](#6-usability-testing-plan)
7. [Metrics & Success Criteria](#7-metrics--success-criteria)

---

## 1. Research Overview

### 1.1 Research Goals

| Goal | Method | Timeline |
|------|--------|----------|
| Understand fashion decision-making | User interviews | Week 1-2 |
| Identify pain points in wardrobe management | Contextual inquiry | Week 2-3 |
| Validate AI stylist concept | Concept testing | Week 3-4 |
| Test outfit generation flow | Prototype testing | Week 4-5 |
| Measure trust in AI recommendations | Usability testing | Week 5-6 |

### 1.2 Research Questions

| Question | Why It Matters |
|----------|---------------|
| How do people decide what to wear? | Understand the decision process we're enhancing |
| What frustrates people about their wardrobe? | Identify pain points we can solve |
| How do people feel about AI making fashion suggestions? | Understand trust barriers |
- What makes someone trust an AI recommendation? | Design for trust from day one |
| How do people discover new outfit combinations? | Understand current behavior we're improving |

### 1.3 Research Methods

| Method | Participants | Duration | Output |
|--------|-------------|----------|--------|
| User interviews | 15-20 | 45 min each | Personas, pain points |
| Contextual inquiry | 5-8 | 60 min each | Workflow insights |
| Concept testing | 20-25 | 30 min each | Concept validation |
| Prototype testing | 15-20 | 45 min each | Usability insights |
| Diary study | 10-15 | 2 weeks | Behavioral patterns |

---

## 2. User Personas

### 2.1 Primary Persona: Alex Chen

```
Name: Alex Chen
Age: 28
Occupation: Product Designer
Location: San Francisco

GOALS:
- Look put-together without overthinking
- Build a versatile, quality wardrobe
- Stop impulse buying things that don't match

FRUSTRATIONS:
- "I have a closet full of clothes but nothing to wear"
- "I buy things that look good in the store but don't match anything"
- "I waste time every morning deciding what to wear"

TECH COMFORT: High
FASHION CONFIDENCE: Medium
BUDGET: $200-400/month on clothes

QUOTE: "I want to look good, but I don't want to think about it too much."
```

### 2.2 Secondary Persona: Maya Patel

```
Name: Maya Patel
Age: 34
Occupation: Marketing Manager
Location: New York City

GOALS:
- Dress appropriately for various occasions
- Look professional without being boring
- Make better use of what she already owns

FRUSTRATIONS:
- "I buy things for specific occasions and never wear them again"
- "I can't tell if an outfit works until I'm already out the door"
- "Fashion advice online is too generic"

TECH COMFORT: High
FASHION CONFIDENCE: Medium-High
BUDGET: $300-500/month on clothes

QUOTE: "I want a stylist who actually gets my life."
```

### 2.3 Tertiary Persona: Jordan Williams

```
Name: Jordan Williams
Age: 22
Occupation: Software Engineer
Location: Austin, TX

GOALS:
- Look more put-together at work
- Experiment with style without embarrassment
- Learn fashion basics without judgment

FRUSTRATIONS:
- "I don't know what colors go together"
- "Fashion advice feels like it's for people who already know what they're doing"
- "I'm embarrassed to ask basic questions"

TECH COMFORT: High
FASHION CONFIDENCE: Low
BUDGET: $100-200/month on clothes

QUOTE: "I just want someone to tell me what works."
```

### 2.4 Persona Summary

| Persona | Age | Fashion Confidence | Tech Comfort | Primary Need |
|---------|-----|-------------------|--------------|--------------|
| Alex Chen | 28 | Medium | High | Efficiency + quality |
| Maya Patel | 34 | Medium-High | High | Versatility + appropriateness |
| Jordan Williams | 22 | Low | High | Guidance + confidence |

---

## 3. User Journeys

### 3.1 Journey: First-Time User

```
Stage 1: Discovery
├── User hears about LOOKSY from friend/ad
├── Visits landing page
├── Reads value proposition: "AI stylist that learns your style"
└── Signs up with Google/Apple

Stage 2: Onboarding
├── Welcome screen: "Let's learn about your style"
├── Quick quiz (optional, 3 questions):
│   ├── "What's your typical style?" (casual/smart/creative)
│   ├── "What occasions do you dress for?" (work/weekend/evening)
│   └── "What colors do you gravitate toward?" (color picker)
├── Tutorial: "Here's how LOOKSY works"
└── First action: "Add your first item"

Stage 3: First Value
├── User uploads first clothing item
├── AI classifies: "Navy cotton button-down shirt"
├── User confirms/corrects classification
├── AI generates first outfit suggestion
├── User sees "Why LOOKSY picked this"
└── User wears outfit or saves for later

Stage 4: Engagement
├── User adds more items over next few days
├── Outfit suggestions improve with more data
├── User gives feedback on outfits
├── Fashion Memory starts building
└── User checks daily outfit suggestion

Stage 5: Habit Formation
├── User opens app every morning
├── Checks outfit suggestion
├── Wears outfit or modifies
├── Gives feedback
└── LOOKSY learns and improves
```

### 3.2 Journey: Daily Outfit Selection

```
Morning Routine (7:30 AM)
│
├── Push notification: "Your outfit is ready"
│
├── Open app
│   ├── See outfit preview
│   ├── Weather: 22°C, partly cloudy
│   ├── Occasion: "Work meeting at 10am"
│   └── Outfit: "Meeting Ready" - blazer + shirt + chinos
│
├── Review outfit
│   ├── Tap "Why LOOKSY picked this"
│   ├── See evidence:
│   │   ├── "You wore navy blazers 14 times"
│   │   ├── "You saved similar outfits 8 times"
│   │   └── "Weather: 22°C, low humidity"
│   └── Decide: Wear / Swap / Skip
│
├── If "Wear This":
│   ├── Items marked as worn
│   ├── Wear count updated
│   ├── Outfit saved to history
│   └── "Have a great day!"
│
├── If "Swap Items":
│   ├── Select item to swap
│   ├── See alternative suggestions
│   ├── Choose new item
│   └── Updated outfit ready
│
└── If "Not Today":
    ├── "No problem! Here's another option"
    ├── See alternative outfit
    └── Or browse closet manually
```

### 3.3 Journey: Adding Items to Closet

```
User Takes Photo
│
├── Open app → Tap "Add Item"
│
├── Camera/Upload screen
│   ├── Take photo with camera
│   ├── Or upload from gallery
│   └── Tips: "Good lighting, plain background"
│
├── Photo uploaded
│   ├── Processing indicator: "AI is analyzing..."
│   ├── Wait 2-4 seconds
│   └── Result: "Navy cotton button-down shirt"
│
├── Review classification
│   ├── Confident: "AI identified this as..."
│   ├── Less confident: "Is this a...?"
│   └── Manual entry: "Help us identify this"
│
├── Edit details (optional)
│   ├── Correct colors
│   ├── Adjust formality
│   ├── Add brand
│   └── Add notes
│
├── Save item
│   ├── Item added to closet
│   ├── Embedding generated
│   └── "Item saved! AI will use this for outfits"
│
└── Continue adding
    ├── Add another item
    └── Or return to closet
```

### 3.4 Journey: Fashion Memory Review

```
User Opens Fashion Memory
│
├── Navigate to Profile → Fashion Memory
│
├── See "What LOOKSY has learned"
│   ├── Color Preferences
│   │   ├── "You tend to choose earth tones"
│   │   ├── Based on: 37 outfits, 12 saved looks
│   │   └── [Confirm] [Correct] [Delete]
│   │
│   ├── Silhouette Preference
│   │   ├── "You tend toward structured fits"
│   │   ├── Based on: 28 outfits analyzed
│   │   └── [Confirm] [Correct] [Delete]
│   │
│   └── Things You Avoid
│       ├── "You rarely choose bold prints"
│       ├── Based on: 42 outfits analyzed
│       └── [Confirm] [Correct] [Delete]
│
├── User can:
│   ├── Confirm pattern: "Yes, that's me"
│   ├── Correct pattern: "Not really, I prefer..."
│   ├── Delete pattern: "Remove this"
│   └── Reset all: "Start fresh"
│
└── Confirmation
    ├── "Thanks! LOOKSY will use this."
    └── Recommendations update within 24 hours
```

### 3.5 Journey: Style Evolution Check

```
User Opens Style Evolution
│
├── Navigate to Profile → Style Evolution
│
├── See timeline
│   ├── Oct 2025: Casual Street
│   │   • Oversized, bold colors, graphic tees
│   ├── Jan 2026: Minimal Casual
│   │   • Fitted basics, neutral palette
│   └── Jul 2026: Minimal Premium
│       • Tailored, earth tones, quality fabrics
│
├── AI observation
│   ├── "Over 9 months, your choices have moved from
│   │    casual streetwear toward a more refined direction."
│   └── "Your color palette has shifted from bold to earth tones."
│
├── User can:
│   ├── Confirm: "Yes, this is my style now"
│   ├── Dismiss: "No, it's temporary"
│   └── Explore: "Tell me more about this shift"
│
└── If confirmed:
    ├── Style profile updated
    ├── Future recommendations adjusted
    └── "Your style direction has been updated."
```

---

## 4. Information Architecture

### 4.1 Sitemap

```
Home (Morning Screen)
├── Outfit of the Day
├── Weather Context
├── Quick Actions (Wear/Swap/Skip)
│
├── Closet
│   ├── Grid View
│   ├── List View
│   ├── Filters (type, color, season, brand)
│   ├── Search
│   ├── Add Item
│   └── Item Detail
│       ├── Photos
│       ├── Metadata
│       ├── AI Classification
│       ├── Edit
│       └── Similar Items
│
├── Outfits
│   ├── Generate New
│   ├── Saved Outfits
│   ├── Outfit History
│   ├── Calendar View
│   └── Outfit Detail
│       ├── Items
│       ├── Explanation
│       ├── Evidence
│       └── Feedback
│
├── Style
│   ├── Fashion Memory
│   ├── Style DNA
│   ├── Style Evolution
│   ├── Weekly Report
│   └── Milestones
│
└── Settings
    ├── Account
    ├── Notifications
    ├── Preferences
    ├── Privacy
    ├── Subscription
    └── Help
```

### 4.2 Navigation Structure

```
Mobile: Bottom Navigation
├── Home (outfit of the day)
├── Closet (wardrobe browsing)
├── + (add item - floating action button)
├── Outfits (generation & history)
└── Profile (style & settings)

Desktop: Sidebar Navigation
├── Dashboard
├── Closet
├── Outfits
├── Style
│   ├── Fashion Memory
│   ├── Style DNA
│   └── Evolution
├── Settings
└── Help
```

### 4.3 Key Screens

| Screen | Purpose | Key Elements |
|--------|---------|--------------|
| Home | Daily outfit | Outfit preview, weather, actions |
| Closet | Browse items | Grid/list, filters, search |
| Add Item | Upload photo | Camera/upload, classification review |
| Generate | Create outfit | Context selection, generation |
| Outfit Detail | View outfit | Items, explanation, evidence |
| Fashion Memory | AI learning | Patterns, evidence, controls |
| Style DNA | Current snapshot | Metrics, visualizations |
| Evolution | Style timeline | Changes over time |

---

## 5. Interaction Patterns

### 5.1 Core Interactions

| Interaction | Trigger | Response |
|-------------|---------|----------|
| Upload item | Tap "Add" | Camera/upload → AI analysis → Save |
| Generate outfit | Tap "Generate" | Context selection → AI generation → Display |
| Wear outfit | Tap "Wear This" | Mark worn → Update history → Feedback prompt |
| Swap item | Tap "Swap" | Show alternatives → Select → Update outfit |
| Confirm memory | Tap "Confirm" | Update confidence → Apply to recommendations |
| Correct memory | Tap "Correct" | Show correction form → Update memory |
| Delete memory | Tap "Delete" | Confirm → Remove memory |

### 5.2 Feedback Patterns

| Feedback Type | When | How |
|---------------|------|-----|
| Outfit feedback | After wearing | 4-point scale + optional tags |
| Classification feedback | After AI identifies | Edit/correct interface |
| Memory feedback | In Fashion Memory | Confirm/correct/delete |
| Weekly feedback | Sunday evening | Summary + "How did we do?" |

### 5.3 Loading States

| State | Duration | UX |
|-------|----------|-----|
| AI analyzing photo | 2-4s | Skeleton + "AI is analyzing..." |
| Generating outfit | 3-8s | Skeleton + "Finding your perfect look..." |
| Computing style DNA | 2-5s | Progress bar + "Crunching your style data..." |
| Uploading photo | 1-3s | Progress bar + preview |

### 5.4 Error States

| Error | Message | Action |
|-------|---------|--------|
| Photo upload failed | "Couldn't upload photo. Try again." | Retry button |
| AI classification failed | "AI is taking a break. Enter details manually." | Manual form |
| Outfit generation failed | "Having trouble generating outfits. Try again." | Retry button |
| Network error | "You're offline. Changes will sync when reconnected." | Auto-retry |

### 5.5 Empty States

| State | Message | Action |
|-------|---------|--------|
| Empty closet | "Your wardrobe is waiting" | "Add your first item" |
| No outfits | "Let's create your first outfit" | "Browse your closet" |
| No search results | "No matches found" | "Clear filters" |
| No saved outfits | "No saved outfits yet" | "Save an outfit you love" |

---

## 6. Usability Testing Plan

### 6.1 Test Scenarios

| Scenario | Goal | Metrics |
|----------|------|---------|
| First-time onboarding | Can user complete setup? | Time, completion rate, errors |
| Add clothing item | Is photo upload intuitive? | Time, success rate, retries |
| Generate outfit | Can user get first recommendation? | Time, comprehension, trust |
| Review evidence | Is Trust Layer clear? | Comprehension, trust score |
| Correct AI classification | Is feedback easy? | Time, success rate |
| Review Fashion Memory | Is AI learning transparent? | Comprehension, control perception |

### 6.2 Test Protocol

```
Pre-Test:
├── Demographics questionnaire
├── Fashion confidence self-assessment
├── Tech comfort self-assessment
└── Current wardrobe habits

Test Tasks:
├── Task 1: Sign up and complete onboarding (5 min)
├── Task 2: Add 3 clothing items (10 min)
├── Task 3: Generate an outfit (5 min)
├── Task 4: Review and provide feedback (5 min)
├── Task 5: Check Fashion Memory (5 min)
└── Task 6: Style Evolution review (5 min)

Post-Test:
├── System Usability Scale (SUS)
├── Trust in AI questionnaire
├── Net Promoter Score (NPS)
├── Open feedback
└── Think-aloud debrief
```

### 6.3 Success Criteria

| Metric | Target | How Measured |
|--------|--------|-------------|
| Task completion rate | > 90% | Observe during testing |
| Time to first outfit | < 5 minutes | Timer during testing |
| Trust score | > 4/5 | Post-test questionnaire |
| SUS score | > 80 | Standard SUS calculation |
| NPS | > 50 | Post-test questionnaire |

### 6.4 Recruitment Criteria

| Criteria | Requirement |
|----------|-------------|
| Age | 22-45 |
| Fashion confidence | Medium (not expert, not clueless) |
| Tech comfort | Medium-High |
| Smartphone usage | Daily |
| Shopping frequency | At least monthly |
| Diversity | Equal gender split, diverse backgrounds |

---

## 7. Metrics & Success Criteria

### 7.1 Engagement Metrics

| Metric | Target (3 months) | How Measured |
|--------|-------------------|-------------|
| Daily Active Users (DAU) | 30% of registered | Analytics |
| Outfit generations/day | 2 per active user | API logs |
| Items uploaded/user | 25 average | Database |
| Time in app/day | 3-5 minutes | Session tracking |
| Retention (7-day) | 40% | Cohort analysis |
| Retention (30-day) | 25% | Cohort analysis |

### 7.2 AI Quality Metrics

| Metric | Target | How Measured |
|--------|--------|-------------|
| Classification accuracy | > 90% | User corrections |
| Outfit acceptance rate | > 60% | "Wear This" / total |
| Feedback score | > 3.5/5 | Outfit feedback |
| Evidence comprehension | > 80% | User testing |

### 7.3 Trust Metrics

| Metric | Target | How Measured |
|--------|--------|-------------|
| Trust Layer usage | > 70% | Click-through on "Why" |
| Memory confirmation rate | > 60% | "Yes, that's me" responses |
| Correction rate | < 20% | AI classification corrections |
| NPS | > 50 | Post-use survey |

### 7.4 Business Metrics

| Metric | Target (6 months) | How Measured |
|--------|-------------------|-------------|
| Registered users | 5,000 | Database |
| Pro conversion | 5% | Subscription data |
| Pro retention (monthly) | 90% | Subscription data |
| Cost per user | < $0.50/month | OpenAI + infrastructure |

---

## Appendix: Research Templates

### User Interview Script

```
Introduction (5 min):
- Thank participant
- Explain purpose (understand fashion habits, not judge)
- Record consent

Warm-up (10 min):
- Tell me about your typical morning routine
- How do you decide what to wear?
- What frustrates you about your wardrobe?

Deep Dive (20 min):
- Walk me through your closet organization
- How often do you buy new clothes?
- What happens when you buy something that doesn't match?
- Have you used any fashion/styling apps?
- What worked? What didn't?

Concept Testing (10 min):
- [Show LOOKSY concept]
- What do you think this does?
- Would you use this? Why/why not?
- What concerns would you have?
- What would make you trust AI recommendations?

Wrap-up (5 min):
- Any other thoughts?
- Thank participant
```

### Concept Testing Script

```
Introduction (2 min):
- "I'll show you a concept for a new app"
- "I want your honest reaction"

Presentation (5 min):
- Show landing page / key screens
- Explain value proposition
- No implementation details

Questions (15 min):
- What do you think this app does?
- Who is this for?
- Would you use this? Why/why not?
- What concerns would you have?
- What would make you trust it?
- How much would you pay for this?

Competitive (5 min):
- Have you used similar apps?
- What do they do well?
- What do they do poorly?
- How would this be different?

Wrap-up (3 min):
- Any other thoughts?
- Thank participant
```

---

*This UX research plan ensures LOOKSY is built with deep understanding of user needs, behaviors, and concerns. The personas and journeys guide design decisions, while the testing plan validates assumptions before and during development.*
