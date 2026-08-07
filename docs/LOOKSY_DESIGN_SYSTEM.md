# LOOKSY — Design System

> Version: 1.0 | Status: Active | Last updated: 2026-07-22
> Role: Design Lead | Premium Fashion-Tech UI System

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Components](#5-components)
6. [Iconography](#6-iconography)
7. [Motion & Animation](#7-motion--animation)
8. [Photography & Imagery](#8-photography--imagery)
9. [Empty States](#9-empty-states)
10. [Accessibility](#10-accessibility)

---

## 1. Design Philosophy

### 1.1 Core Principles

| Principle | Implementation |
|-----------|---------------|
| **Quiet Luxury** | Understated elegance, no visual noise |
| **Human-Centered** | Every element serves the user's needs |
| **Trust Through Transparency** | Clear explanations, honest AI communication |
| **Premium Feel** | Apple-like attention to detail |
| **Warm minimalism** | Clean but not cold |

### 1.2 Design Values

```
LOOKSY Design Values:

1. Calm
   - No overwhelming colors
   - Generous whitespace
   - Clear visual hierarchy

2. Intelligent
   - AI explanations feel natural
   - Evidence is accessible, not academic
   - Complexity is hidden, simplicity is revealed

3. Personal
   - Adapts to user's style
   - Celebrates individual expression
   - Never judges or compares

4. Premium
   - Subtle animations
   - High-quality imagery
   - Refined typography
   - Attention to micro-interactions
```

### 1.3 Anti-Patterns

| Don't | Do Instead |
|-------|-----------|
| Cluttered interfaces | Generous whitespace |
| Aggressive notifications | Gentle, timely suggestions |
| Judgmental language | Supportive, encouraging tone |
| Complex onboarding | Progressive disclosure |
| Generic templates | Personalized experience |
| Gamification | Meaningful milestones |
| Social comparison | Individual progress |

---

## 2. Color System

### 2.1 Palette Architecture

```
Color System
│
├── Neutrals (90% of UI)
│   ├── Background: warm off-white
│   ├── Surface: soft white
│   ├── Text: rich charcoal
│   └── Borders: subtle gray
│
├── Accents (8% of UI)
│   ├── Primary: deep forest green (trust, nature)
│   ├── Secondary: warm sand (warmth, approachability)
│   └── Tertiary: muted rose (subtle fashion accent)
│
└── Feedback (2% of UI)
    ├── Success: sage green
    ├── Warning: amber
    ├── Error: muted red
    └── Info: slate blue
```

### 2.2 Color Tokens

```css
/* Neutral Palette */
--color-neutral-50: #FAFAF8;   /* Warm white background */
--color-neutral-100: #F5F5F0;  /* Surface */
--color-neutral-200: #E8E8E3;  /* Borders */
--color-neutral-300: #D4D4CF;  /* Subtle borders */
--color-neutral-400: #A3A39E;  /* Placeholder text */
--color-neutral-500: #73736E;  /* Secondary text */
--color-neutral-600: #52524E;  /* Muted text */
--color-neutral-700: #40403C;  /* Body text */
--color-neutral-800: #262624;  /* Headings */
--color-neutral-900: #171715;  /* Near black */

/* Primary Palette (Forest Green) */
--color-primary-50: #F0F5F1;
--color-primary-100: #D9E8DB;
--color-primary-200: #B3D1B7;
--color-primary-300: #8DBA93;
--color-primary-400: #67A36F;
--color-primary-500: #4A8B53;  /* Primary */
--color-primary-600: #3A6F42;
--color-primary-700: #2A5331;
--color-primary-800: #1A3720;
--color-primary-900: #0A1B10;

/* Secondary Palette (Warm Sand) */
--color-secondary-50: #FBF9F5;
--color-secondary-100: #F5F0E6;
--color-secondary-200: #EBE1CD;
--color-secondary-300: #E1D2B4;
--color-secondary-400: #D7C39B;
--color-secondary-500: #CDB482;  /* Secondary */
--color-secondary-600: #B89A68;
--color-secondary-700: #9A7D4E;
--color-secondary-800: #7C6134;
--color-secondary-900: #5E451A;

/* Tertiary Palette (Muted Rose) */
--color-tertiary-50: #FDF5F7;
--color-tertiary-100: #F9E5EB;
--color-tertiary-200: #F3CBD7;
--color-tertiary-300: #EDB1C3;
--color-tertiary-400: #E797AF;
--color-tertiary-500: #E17D9B;  /* Tertiary */
--color-tertiary-600: #C9637F;
--color-tertiary-700: #A94963;
--color-tertiary-800: #892F47;
--color-tertiary-900: #69152B;

/* Feedback Colors */
--color-success: #5A8A6A;
--color-warning: #C49A2A;
--color-error: #B85450;
--color-info: #5A7A9A;
```

### 2.3 Dark Mode

```css
/* Dark Mode Overrides */
--color-neutral-50: #1A1A18;
--color-neutral-100: #242422;
--color-neutral-200: #2E2E2C;
--color-neutral-300: #383836;
--color-neutral-400: #5A5A58;
--color-neutral-500: #7A7A78;
--color-neutral-600: #9A9A98;
--color-neutral-700: #B8B8B6;
--color-neutral-800: #D6D6D4;
--color-neutral-900: #F5F5F3;
```

### 2.4 Color Usage

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| Background | neutral-50 | neutral-50 |
| Card/Surface | white | neutral-100 |
| Primary Text | neutral-800 | neutral-900 |
| Secondary Text | neutral-500 | neutral-600 |
| Borders | neutral-200 | neutral-300 |
| Primary Action | primary-500 | primary-400 |
| Secondary Action | secondary-500 | secondary-400 |
| Success | success | success |
| Error | error | error |

---

## 3. Typography

### 3.1 Font Stack

```css
/* Primary: Inter for UI */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Display: For hero text and large headings */
--font-display: 'Playfair Display', Georgia, serif;

/* Mono: For code and data */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 3.2 Type Scale

```css
/* Display */
--text-display-lg: 3.5rem / 1.1;    /* 56px */
--text-display-md: 2.5rem / 1.2;    /* 40px */
--text-display-sm: 2rem / 1.25;     /* 32px */

/* Heading */
--text-heading-lg: 1.5rem / 1.3;    /* 24px */
--text-heading-md: 1.25rem / 1.35;  /* 20px */
--text-heading-sm: 1.125rem / 1.4;  /* 18px */

/* Body */
--text-body-lg: 1.125rem / 1.6;     /* 18px */
--text-body-md: 1rem / 1.6;         /* 16px */
--text-body-sm: 0.875rem / 1.5;     /* 14px */

/* Caption */
--text-caption-lg: 0.875rem / 1.4;  /* 14px */
--text-caption-md: 0.75rem / 1.4;   /* 12px */
--text-caption-sm: 0.6875rem / 1.3; /* 11px */
```

### 3.3 Font Weights

| Weight | Usage |
|--------|-------|
| 400 (Regular) | Body text, captions |
| 500 (Medium) | Labels, buttons, navigation |
| 600 (Semibold) | Subheadings, emphasis |
| 700 (Bold) | Headings, important text |

### 3.4 Typography Rules

| Rule | Example |
|------|---------|
| Max line length | 60-75 characters |
| Paragraph spacing | 1.5x font size |
| Heading hierarchy | Never skip levels (h1 → h3) |
| Text alignment | Left-aligned (never justified) |
| Mixed fonts | Display + Sans only, max 2 families |

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

```css
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### 4.2 Grid System

```css
/* Mobile First */
--grid-columns: 4;
--grid-gutter: var(--space-4);
--grid-margin: var(--space-4);

/* Tablet */
@media (min-width: 768px) {
  --grid-columns: 8;
  --grid-gutter: var(--space-6);
  --grid-margin: var(--space-8);
}

/* Desktop */
@media (min-width: 1024px) {
  --grid-columns: 12;
  --grid-gutter: var(--space-6);
  --grid-margin: var(--space-12);
}
```

### 4.3 Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| Mobile | 0 - 640px | Single column, stacked |
| Tablet | 641 - 1024px | 2-column layout |
| Desktop | 1025 - 1440px | Full layout |
| Wide | 1441px+ | Max-width containers |

### 4.4 Container Widths

```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1440px;
```

### 4.5 Layout Principles

| Principle | Implementation |
|-----------|---------------|
| Generous whitespace | At least 24px between major sections |
| Consistent padding | 16px mobile, 24px tablet, 32px desktop |
| Visual breathing room | No element should feel cramped |
| Clear hierarchy | Spacing communicates importance |
| Mobile-first | Design for smallest screen first |

---

## 5. Components

### 5.1 Component Library

Built on shadcn/ui with custom extensions:

```
src/components/
├── ui/                    # shadcn/ui base
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── toast.tsx
│   └── ...
│
├── closet/                # Closet-specific
│   ├── clothing-card.tsx
│   ├── upload-zone.tsx
│   ├── filter-panel.tsx
│   └── item-detail.tsx
│
├── outfits/               # Outfit-specific
│   ├── outfit-card.tsx
│   ├── outfit-grid.tsx
│   ├── outfit-detail.tsx
│   └── outfit-feedback.tsx
│
├── ai/                    # AI-specific
│   ├── confidence-badge.tsx
│   ├── evidence-card.tsx
│   ├── explanation-panel.tsx
│   └── loading-skeleton.tsx
│
└── layout/                # Layout
    ├── header.tsx
    ├── sidebar.tsx
    ├── mobile-nav.tsx
    └── page-container.tsx
```

### 5.2 Button Styles

```typescript
// Button variants
const buttonVariants = {
  primary: {
    base: 'bg-primary-500 text-white hover:bg-primary-600',
    active: 'active:bg-primary-700',
    disabled: 'bg-neutral-300 text-neutral-500 cursor-not-allowed',
  },
  secondary: {
    base: 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200',
    active: 'active:bg-neutral-300',
    disabled: 'bg-neutral-100 text-neutral-400 cursor-not-allowed',
  },
  ghost: {
    base: 'bg-transparent text-neutral-700 hover:bg-neutral-100',
    active: 'active:bg-neutral-200',
    disabled: 'text-neutral-400 cursor-not-allowed',
  },
  danger: {
    base: 'bg-error text-white hover:bg-error/90',
    active: 'active:bg-error/80',
    disabled: 'bg-neutral-300 text-neutral-500 cursor-not-allowed',
  },
};

// Button sizes
const buttonSizes = {
  sm: 'h-8 px-3 text-body-sm',
  md: 'h-10 px-4 text-body-md',
  lg: 'h-12 px-6 text-body-lg',
  xl: 'h-14 px-8 text-body-lg',
};
```

### 5.3 Card Styles

```typescript
const cardStyles = {
  default: 'bg-white rounded-xl border border-neutral-200 shadow-sm',
  elevated: 'bg-white rounded-xl shadow-md',
  interactive: 'bg-white rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow',
  glass: 'bg-white/80 backdrop-blur-sm rounded-xl border border-neutral-200/50',
};
```

### 5.4 Clothing Card

```
┌─────────────────────────────────┐
│                                 │
│     [Clothing Item Photo]       │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Confidence: 92%         │   │
│  └─────────────────────────┘   │
│                                 │
│  Navy Cotton Shirt              │
│  Button-down • Smart casual     │
│                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐     │
│  │Edit │ │Wear │ │More │     │
│  └─────┘ └─────┘ └─────┘     │
│                                 │
└─────────────────────────────────┘
```

### 5.5 Outfit Card

```
┌─────────────────────────────────┐
│                                 │
│  "Meeting Ready"                │
│  Wednesday, 22°C                │
│                                 │
│  ┌─────────────────────────┐   │
│  │   [Outfit Preview]      │   │
│  │   Items arranged as     │   │
│  │   flat-lay composition  │   │
│  └─────────────────────────┘   │
│                                 │
│  Why LOOKSY picked this:        │
│  ✓ Earth tones match your      │
│    style (23 outfits)          │
│  ✓ Weather-appropriate         │
│  ✓ Haven't worn in 12 days     │
│                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐     │
│  │Wear │ │Swap │ │Save │     │
│  │This │ │Items│ │     │     │
│  └─────┘ └─────┘ └─────┘     │
│                                 │
└─────────────────────────────────┘
```

### 5.6 Trust Layer Component

```
┌─────────────────────────────────┐
│ Why LOOKSY picked this:         │
│                                 │
│ ┌───────────────────────────┐  │
│ │ ✓ Worn frequency          │  │
│ │ You wore navy items 12    │  │
│ │ times in the last month   │  │
│ └───────────────────────────┘  │
│                                 │
│ ┌───────────────────────────┐  │
│ │ ✓ Saved preference        │  │
│ │ You saved 8 outfits with  │  │
│ │ relaxed tailoring         │  │
│ └───────────────────────────┘  │
│                                 │
│ ┌───────────────────────────┐  │
│ │ ✓ Weather context         │  │
│ │ 22°C, low humidity        │  │
│ └───────────────────────────┘  │
│                                 │
│ Not quite right?                │
│ [Tell us what you'd prefer]     │
│                                 │
└─────────────────────────────────┘
```

---

## 6. Iconography

### 6.1 Icon Style

- **Style:** Outlined, 1.5px stroke
- **Size:** 24x24px default, 20x20px small, 32x32px large
- **Color:** Inherits from text color
- **Library:** Lucide React (consistent with shadcn/ui)

### 6.2 Icon Categories

| Category | Icons | Usage |
|----------|-------|-------|
| Navigation | home, search, plus, user, settings | Bottom nav, sidebar |
| Clothing | shirt, pants, dress, shoes, jacket, watch, glasses | Item type filters |
| Actions | upload, edit, trash, check, x, chevron | User interactions |
| AI | sparkles, brain, lightbulb, eye | AI-related features |
| Weather | sun, cloud, rain, snow, thermometer | Weather context |
| Feedback | heart, thumbs-up, thumbs-down, star | Feedback collection |

### 6.3 Custom Icons

```typescript
// Custom LOOKSY icons
const customIcons = {
  looksyLogo: LooksyLogoIcon,
  fashionMemory: FashionMemoryIcon,
  styleEvolution: StyleEvolutionIcon,
  trustLayer: TrustLayerIcon,
  wardrobe: WardrobeIcon,
};
```

---

## 7. Motion & Animation

### 7.1 Animation Principles

| Principle | Implementation |
|-----------|---------------|
| **Purposeful** | Every animation has a reason |
| **Subtle** | Never distracting or overwhelming |
| **Fast** | 150-300ms for most transitions |
| **Smooth** | Use easing curves, not linear |
| **Consistent** | Same animation for same action |

### 7.2 Timing Tokens

```css
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 350ms;
--duration-slower: 500ms;

--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### 7.3 Animation Patterns

```typescript
// Fade in
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.25 },
};

// Slide up
const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

// Scale in (for cards)
const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

// Stagger children
const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};
```

### 7.4 Loading States

```typescript
// Skeleton loading
const skeletonPulse = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Shimmer effect
const shimmer = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};
```

### 7.5 Micro-Interactions

| Interaction | Animation | Duration |
|-------------|-----------|----------|
| Button press | Scale down 0.98 | 100ms |
| Card hover | Elevation + shadow | 200ms |
| Toggle switch | Slide + color change | 200ms |
| Toast appear | Slide up + fade | 300ms |
| Page transition | Cross-fade | 250ms |
| Modal open | Scale up + fade | 250ms |
| Pull to refresh | Rotation | Continuous |

---

## 8. Photography & Imagery

### 8.1 Photography Style

| Aspect | Guideline |
|--------|-----------|
| **Lighting** | Soft, natural light (no harsh shadows) |
| **Background** | Clean, minimal (white, light gray, or natural) |
| **Composition** | Centered or rule of thirds |
| **Color** | True to life, slightly warm |
| **Mood** | Calm, elegant, approachable |

### 8.2 Image Treatment

```css
/* Standard image styles */
.image-clothing {
  border-radius: 12px;
  object-fit: cover;
  background-color: var(--color-neutral-100);
}

.image-outfit {
  border-radius: 16px;
  object-fit: cover;
  background-color: var(--color-neutral-50);
}

/* Loading placeholder */
.image-placeholder {
  background: linear-gradient(
    135deg,
    var(--color-neutral-100) 0%,
    var(--color-neutral-200) 100%
  );
}
```

### 8.3 Image Sizes

| Context | Size | Aspect Ratio |
|---------|------|--------------|
| Clothing card thumbnail | 400x400px | 1:1 |
| Clothing detail | 800x800px | 1:1 |
| Outfit preview | 600x800px | 3:4 |
| Hero image | 1200x600px | 2:1 |
| Avatar | 200x200px | 1:1 |

### 8.4 Image Optimization

```typescript
// Next.js Image component configuration
const imageConfig = {
  sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  quality: 85,
  placeholder: 'blur',
  blurDataURL: 'data:image/jpeg;base64,...', // tiny placeholder
};
```

---

## 9. Empty States

### 9.1 Empty State Philosophy

Empty states should:
- **Educate** — explain what goes here
- **Encourage** — motivate the user to take action
- **Delight** — use warm, friendly language
- **Guide** — provide clear next steps

### 9.2 Empty State Examples

**Empty Closet:**
```
Your wardrobe is waiting

Start building your digital closet by
uploading your first clothing item.

AI will automatically identify colors,
materials, and styles.

[Upload your first item]

Tip: Start with your most-worn pieces
for the best recommendations.
```

**No Outfits Generated:**
```
Let's create your first outfit

Once you've added a few items to your
closet, LOOKSY can suggest outfits
tailored to your style and the weather.

[Browse your closet]

We recommend at least 10 items for
the best outfit suggestions.
```

**Empty Search Results:**
```
No matches found

Try adjusting your filters or
uploading new items to expand
your wardrobe.

[Clear filters] [Upload item]
```

### 9.3 Empty State Illustrations

- Use simple, line-art illustrations
- Warm, friendly colors (primary + secondary palette)
- Show the action being performed (e.g., uploading a photo)
- Keep text minimal (2-3 lines max)

---

## 10. Accessibility

### 10.1 WCAG 2.1 AA Compliance

| Criterion | Target | Implementation |
|-----------|--------|---------------|
| Color contrast | 4.5:1 minimum | Test all text against backgrounds |
| Keyboard navigation | Full support | Focus states, tab order, shortcuts |
| Screen readers | Semantic HTML | ARIA labels, alt text, roles |
| Motion | Respect preferences | `prefers-reduced-motion` |
| Touch targets | 44x44px minimum | All interactive elements |

### 10.2 Focus States

```css
/* Focus ring */
.focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Remove default outline, add custom */
button:focus-visible {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
  border-radius: 4px;
}
```

### 10.3 ARIA Patterns

```typescript
// Modal dialog
<Dialog
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
>

// Loading state
<div
  role="status"
  aria-live="polite"
  aria-label="Loading outfit suggestions"
>
  <span className="sr-only">Loading...</span>
</div>

// Progress indicator
<div
  role="progressbar"
  aria-valuenow={progress}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-label="Upload progress"
/>
```

### 10.4 Color Blindness

| Color | Safe Alternative |
|-------|-----------------|
| Red/Green | Use icons + text labels |
| Blue/Yellow | Ensure sufficient contrast |
| All colors | Never use color as sole indicator |

### 10.5 Screen Reader Testing

- Test with VoiceOver (macOS)
- Test with NVDA (Windows)
- Test with TalkBack (Android)
- Verify all interactive elements are announced
- Verify all images have meaningful alt text
- Verify all form fields have labels

---

## Appendix: Design Tokens (JSON)

```json
{
  "color": {
    "neutral": {
      "50": "#FAFAF8",
      "100": "#F5F5F0",
      "200": "#E8E8E3",
      "300": "#D4D4CF",
      "400": "#A3A39E",
      "500": "#73736E",
      "600": "#52524E",
      "700": "#40403C",
      "800": "#262624",
      "900": "#171715"
    },
    "primary": {
      "50": "#F0F5F1",
      "100": "#D9E8DB",
      "200": "#B3D1B7",
      "300": "#8DBA93",
      "400": "#67A36F",
      "500": "#4A8B53",
      "600": "#3A6F42",
      "700": "#2A5331",
      "800": "#1A3720",
      "900": "#0A1B10"
    }
  },
  "spacing": {
    "1": "0.25rem",
    "2": "0.5rem",
    "3": "0.75rem",
    "4": "1rem",
    "5": "1.25rem",
    "6": "1.5rem",
    "8": "2rem",
    "10": "2.5rem",
    "12": "3rem",
    "16": "4rem"
  },
  "typography": {
    "fontFamily": {
      "sans": "Inter, sans-serif",
      "display": "Playfair Display, serif",
      "mono": "JetBrains Mono, monospace"
    }
  }
}
```

---

*This design system creates a premium, trustworthy, and human-centered visual language for LOOKSY. Every element is designed to feel calm, intelligent, and personal — like a trusted friend helping with your style.*
