# LOOKSY — Implementation Plan

> Version: 1.0 | Status: Active | Last updated: 2026-07-22
> Approach: Incremental, phase-gated development

---

## Table of Contents

1. [Implementation Philosophy](#1-implementation-philosophy)
2. [Phase 0 — Architecture Review](#2-phase-0--architecture-review)
3. [Phase 1 — Project Foundation](#3-phase-1--project-foundation)
4. [Phase 2 — Database Layer](#4-phase-2--database-layer)
5. [Phase 3 — Design System Implementation](#5-phase-3--design-system-implementation)
6. [Phase 4 — First User Flow (Digital Wardrobe)](#6-phase-4--first-user-flow-digital-wardrobe)
7. [Phase 5 — Fashion Memory Foundation](#7-phase-5--fashion-memory-foundation)
8. [Phase 6 — Outfit Generation](#8-phase-6--outfit-generation)
9. [Post-MVP Phases](#9-post-mvp-phases)
10. [Quality Gates](#10-quality-gates)

---

## 1. Implementation Philosophy

### 1.1 Core Principles

| Principle | Implementation |
|-----------|---------------|
| **Incremental** | Build in small, testable increments |
| **Phase-gated** | Each phase requires approval before proceeding |
| **Production-ready** | Every phase produces deployable code |
| **No big-bang** | Never build entire features at once |
| **Test-first** | Verify before claiming completion |

### 1.2 What Each Phase Produces

Each phase delivers:
1. Working, deployable code
2. Documentation of changes
3. Test results
4. Architecture review notes
5. List of decisions made

### 1.3 What Each Phase Does NOT Produce

Each phase does NOT:
1. Skip ahead to future features
2. Make temporary/mock implementations
3. Leave technical debt undocumented
4. Build without testing
5. Commit without verification

---

## 2. Phase 0 — Architecture Review

**Duration:** Current session
**Goal:** Validate all technical decisions before writing code

### 2.1 Deliverables

| Deliverable | Status | Description |
|-------------|--------|-------------|
| IMPLEMENTATION_PLAN.md | Done | This document |
| ARCHITECTURE_DECISIONS.md | Pending | All architectural decisions documented |
| Technical Assumptions | Pending | List of assumptions we're making |
| Unresolved Questions | Pending | Questions requiring answers |

### 2.2 Documentation Review Summary

| Document | Key Decisions | Impact on Implementation |
|----------|---------------|-------------------------|
| LOOKSY_MVP_ARCHITECTURE.md | Modular monolith, 8 modules | Folder structure, import rules |
| LOOKSY_AI_ARCHITECTURE.md | Provider abstraction, interfaces | AI module structure |
| LOOKSY_DATABASE_SCHEMA.md | Drizzle ORM, pgvector | Schema files, migrations |
| LOOKSY_DESIGN_SYSTEM.md | Custom colors, Inter + Playfair | Tailwind config, CSS variables |
| LOOKSY_PRODUCT_INNOVATIONS.md | Trust Layer, Fashion Memory | Memory system design |
| LOOKSY_ROADMAP.md | 6 phases, 12-week MVP | Timeline alignment |
| LOOKSY_UX_RESEARCH.md | Personas, journeys | Page structure, user flows |

### 2.3 Phase Exit Criteria

- [ ] All documentation reviewed
- [ ] Architecture decisions documented
- [ ] Technical assumptions listed
- [ ] Unresolved questions identified
- [ ] User approval received

---

## 3. Phase 1 — Project Foundation

**Duration:** 1-2 days
**Goal:** Clean, empty application that runs locally

### 3.1 Technical Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | App Router, React 19 |
| TypeScript | 5.x | Strict mode |
| Tailwind CSS | 4.x | Styling |
| shadcn/ui | latest | Component library |
| Drizzle ORM | latest | Database access |
| PostgreSQL | 15+ | Database (via Supabase) |
| Clerk | latest | Authentication |
| Vitest | latest | Testing |
| ESLint | latest | Linting |
| Prettier | latest | Formatting |

### 3.2 Implementation Steps

#### Step 3.2.1: Project Initialization

```bash
# Create Next.js project
npx create-next-app@latest looksy \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

# Navigate to project
cd looksy
```

#### Step 3.2.2: TypeScript Configuration

```json
// tsconfig.json - Strict mode
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

#### Step 3.2.3: Install Dependencies

```bash
# Core dependencies
npm install drizzle-orm postgres
npm install -D drizzle-kit
npm install @clerk/nextjs
npm install openai
npm install zod

# UI dependencies
npm install @tanstack/react-query
npm install react-hook-form @hookform/resolvers
npm install lucide-react

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D @vitejs/plugin-react

# Development
npm install -D prettier eslint-config-prettier
npm install -D @typescript-eslint/eslint-plugin
```

#### Step 3.2.4: Folder Architecture

```
looksy/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth route group
│   │   ├── (dashboard)/       # Dashboard route group
│   │   ├── api/               # API routes
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Home page
│   │   └── not-found.tsx      # 404 page
│   │
│   ├── modules/               # Domain modules
│   │   ├── auth/              # Authentication
│   │   ├── users/             # User management
│   │   ├── closet/            # Wardrobe items
│   │   ├── outfits/           # Outfit generation
│   │   ├── ai/                # AI abstraction layer
│   │   ├── recommendations/   # Recommendations
│   │   ├── analytics/         # Event tracking
│   │   └── subscriptions/     # Billing
│   │
│   ├── lib/                   # Shared utilities
│   │   ├── db/                # Database
│   │   ├── errors.ts          # Error handling
│   │   ├── logger.ts          # Logging
│   │   └── validators.ts      # Zod schemas
│   │
│   ├── components/            # Shared UI components
│   │   ├── ui/                # shadcn/ui base
│   │   └── layout/            # Layout components
│   │
│   └── hooks/                 # Shared React hooks
│
├── public/                    # Static assets
├── drizzle.config.ts          # Drizzle config
├── .env.local                 # Environment variables
├── .env.example               # Environment template
└── package.json
```

#### Step 3.2.5: Environment Configuration

```bash
# .env.example
# Database
DATABASE_URL="postgresql://postgres:password@localhost:54322/looksy"

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# AI
AI_API_KEY=""

# Supabase
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### Step 3.2.6: ESLint Configuration

```javascript
// eslint.config.js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Enforce module boundaries
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/modules/auth",
              message: "Import from '@/modules/auth' only via index.ts",
            },
            {
              name: "@/modules/users",
              message: "Import from '@/modules/users' only via index.ts",
            },
            // Add other modules as they are created
          ],
          patterns: [
            {
              group: ["@/modules/*/!(index).ts", "@/modules/*/!(index).tsx"],
              message: "Do not import from module internals. Use the module's index.ts.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ["node_modules/", ".next/", "src/lib/db/migrations/"],
  },
];
```

#### Step 3.2.7: Database Client

```typescript
// src/lib/db/client.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Use connection pooling in production
const client = postgres(connectionString, {
  max: process.env.NODE_ENV === "production" ? 10 : 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
```

#### Step 3.2.8: Error Handling Foundation

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      `${resource} not found${id ? `: ${id}` : ""}`,
      "NOT_FOUND",
      404
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, "FORBIDDEN", 403);
  }
}

// Error handler for API routes
export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    );
  }

  console.error("Unexpected error:", error);
  return Response.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    },
    { status: 500 }
  );
}
```

#### Step 3.2.9: Logging Foundation

```typescript
// src/lib/logger.ts
type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

class Logger {
  private level: LogLevel;
  private context: LogContext;

  constructor(level: LogLevel = "info", context: LogContext = {}) {
    this.level = level;
    this.context = context;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.level];
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...(data ? { data } : {}),
    };
    return JSON.stringify(logEntry);
  }

  debug(message: string, data?: unknown) {
    if (this.shouldLog("debug")) {
      console.debug(this.formatMessage("debug", message, data));
    }
  }

  info(message: string, data?: unknown) {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage("info", message, data));
    }
  }

  warn(message: string, data?: unknown) {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, data));
    }
  }

  error(message: string, error?: unknown) {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, error));
    }
  }

  child(context: LogContext): Logger {
    return new Logger(this.level, { ...this.context, ...context });
  }
}

export function createLogger(context?: LogContext): Logger {
  const level = (process.env.LOG_LEVEL as LogLevel) || "info";
  return new Logger(level, context);
}

export const logger = createLogger();
```

#### Step 3.2.10: Validation Layer

```typescript
// src/lib/validators.ts
import { z } from "zod";

// Common validators
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const urlSchema = z.string().url();

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Sort
export const sortSchema = z.object({
  field: z.string(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// Date range
export const dateRangeSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
});

// API response wrapper
export function createApiResponse<T>(data: T) {
  return { data, error: null };
}

export function createApiError(code: string, message: string) {
  return { data: null, error: { code, message } };
}
```

#### Step 3.2.11: Testing Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

// src/test/setup.ts
import "@testing-library/jest-dom";
```

### 3.3 Phase Exit Criteria

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] Application shows empty page at localhost:3000
- [ ] Folder structure matches spec
- [ ] ESLint module boundaries configured
- [ ] Environment variables documented

---

## 4. Phase 2 — Database Layer

**Duration:** 2-3 days
**Goal:** Complete database architecture with migrations

### 4.1 Tables to Implement

| Table | Module | Priority | Dependencies |
|-------|--------|----------|--------------|
| users | users | P0 | None |
| user_preferences | users | P0 | users |
| clothing_items | closet | P0 | users |
| item_photos | closet | P0 | clothing_items |
| item_embeddings | recommendations | P0 | clothing_items, users |
| outfits | outfits | P0 | users |
| outfit_items | outfits | P0 | outfits, clothing_items |
| wear_log | outfits | P0 | users, outfits |
| fashion_memories | recommendations | P1 | users |
| user_style_vectors | recommendations | P1 | users |
| analytics_events | analytics | P1 | users |
| user_subscriptions | subscriptions | P1 | users |
| plans | subscriptions | P1 | None |

### 4.2 Implementation Steps

#### Step 4.2.1: Schema Files

Create Drizzle schema for each module:

```
src/modules/
├── users/schema.ts
├── closet/schema.ts
├── outfits/schema.ts
├── recommendations/schema.ts
├── analytics/schema.ts
└── subscriptions/schema.ts
```

#### Step 4.2.2: Schema Aggregation

```typescript
// src/lib/db/schema.ts
export * from "../../modules/users/schema";
export * from "../../modules/closet/schema";
export * from "../../modules/outfits/schema";
export * from "../../modules/recommendations/schema";
export * from "../../modules/analytics/schema";
export * from "../../modules/subscriptions/schema";
```

#### Step 4.2.3: Generate Migrations

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate
```

#### Step 4.2.4: Seed Data

```typescript
// src/lib/db/seed.ts
import { db } from "./client";
import { users, clothingItems, plans } from "./schema";

async function seed() {
  // Create plans
  await db.insert(plans).values([
    {
      name: "free",
      displayName: "Free",
      price: 0,
      features: {
        maxItems: 50,
        maxGenerationsPerDay: 5,
        maxSavedOutfits: 10,
        storageLimitMb: 500,
      },
    },
    {
      name: "pro",
      displayName: "Pro",
      price: 999,
      features: {
        maxItems: -1,
        maxGenerationsPerDay: 50,
        maxSavedOutfits: -1,
        storageLimitMb: 10240,
      },
    },
  ]);

  console.log("Seed data created successfully");
}

seed();
```

### 4.3 Phase Exit Criteria

- [ ] All tables created in schema files
- [ ] Migrations generated and applied
- [ ] Seed data works
- [ ] Database connection verified
- [ ] Type inference works correctly
- [ ] Indexes created for performance

---

## 5. Phase 3 — Design System Implementation

**Duration:** 2-3 days
**Goal:** Application shell with navigation and core components

### 5.1 Components to Implement

| Component | Priority | Location |
|-----------|----------|----------|
| Application Shell | P0 | src/components/layout/ |
| Navigation | P0 | src/components/layout/ |
| Sidebar (Desktop) | P0 | src/components/layout/ |
| Mobile Navigation | P0 | src/components/layout/ |
| Page Container | P0 | src/components/layout/ |
| Typography | P0 | src/components/ui/ |
| Colors | P0 | tailwind.config.ts |
| Button | P0 | src/components/ui/ |
| Card | P0 | src/components/ui/ |
| Empty State | P1 | src/components/ui/ |
| Loading Skeleton | P1 | src/components/ui/ |

### 5.2 Implementation Steps

#### Step 5.2.1: Initialize shadcn/ui

```bash
# Initialize shadcn/ui
npx shadcn@latest init

# Add base components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add skeleton
npx shadcn@latest add dropdown-menu
npx shadcn@latest add sheet
```

#### Step 5.2.2: Custom Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neutral palette
        neutral: {
          50: "#FAFAF8",
          100: "#F5F5F0",
          200: "#E8E8E3",
          300: "#D4D4CF",
          400: "#A3A39E",
          500: "#73736E",
          600: "#52524E",
          700: "#40403C",
          800: "#262624",
          900: "#171715",
        },
        // Primary palette (Forest Green)
        primary: {
          50: "#F0F5F1",
          100: "#D9E8DB",
          200: "#B3D1B7",
          300: "#8DBA93",
          400: "#67A36F",
          500: "#4A8B53",
          600: "#3A6F42",
          700: "#2A5331",
          800: "#1A3720",
          900: "#0A1B10",
        },
        // Secondary palette (Warm Sand)
        secondary: {
          50: "#FBF9F5",
          100: "#F5F0E6",
          200: "#EBE1CD",
          300: "#E1D2B4",
          400: "#D7C39B",
          500: "#CDB482",
          600: "#B89A68",
          700: "#9A7D4E",
          800: "#7C6134",
          900: "#5E451A",
        },
        // Tertiary palette (Muted Rose)
        tertiary: {
          50: "#FDF5F7",
          100: "#F9E5EB",
          200: "#F3CBD7",
          300: "#EDB1C3",
          400: "#E797AF",
          500: "#E17D9B",
          600: "#C9637F",
          700: "#A94963",
          800: "#892F47",
          900: "#69152B",
        },
        // Feedback colors
        success: "#5A8A6A",
        warning: "#C49A2A",
        error: "#B85450",
        info: "#5A7A9A",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

#### Step 5.2.3: Application Shell

```typescript
// src/components/layout/app-shell.tsx
import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <Sidebar />
      </div>

      {/* Mobile nav */}
      <div className="lg:hidden">
        <MobileNav />
      </div>

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
```

#### Step 5.2.4: Navigation Component

```typescript
// src/components/layout/sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shirt, Sparkles, User, Settings } from "lucide-react";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Closet", href: "/closet", icon: Shirt },
  { name: "Outfits", href: "/outfits", icon: Sparkles },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-white border-r border-neutral-200">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <span className="text-xl font-semibold text-neutral-800">LOOKSY</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium
                transition-colors
                ${isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800"
                }
              `}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-neutral-200 p-4">
        <div className="text-xs text-neutral-500">
          LOOKSY v0.1.0
        </div>
      </div>
    </div>
  );
}
```

### 5.3 Phase Exit Criteria

- [ ] Application shell renders correctly
- [ ] Navigation works on desktop and mobile
- [ ] Colors match design system
- [ ] Typography is correct
- [ ] Components are reusable
- [ ] No lint errors
- [ ] No type errors

---

## 6. Phase 4 — First User Flow (Digital Wardrobe)

**Duration:** 3-5 days
**Goal:** Complete item upload flow with AI placeholder

### 6.1 User Journey

```
User → Opens wardrobe → Sees empty state → Clicks "Add Item"
→ Uploads photo → AI placeholder analyzes → Item saved → Appears in closet
```

### 6.2 Implementation Steps

#### Step 6.2.1: Closet Module (Partial)

```
src/modules/closet/
├── index.ts          # Public API
├── schema.ts         # Already created in Phase 2
├── service.ts        # Item CRUD operations
├── types.ts          # TypeScript types
└── ai-classifier.ts  # Placeholder for AI
```

#### Step 6.2.2: AI Abstraction Layer (Partial)

```
src/modules/ai/
├── index.ts          # Public API
├── types.ts          # AI interfaces
├── providers/
│   ├── types.ts      # Provider interfaces
│   └── mock.ts       # Mock provider for development
└── vision.ts         # Vision service (uses provider)
```

#### Step 6.2.3: API Routes

```
src/app/api/
├── closet/
│   ├── route.ts          # GET /api/closet (list items)
│   └── [id]/
│       └── route.ts      # GET /api/closet/[id]
└── upload/
    └── route.ts          # POST /api/upload
```

#### Step 6.2.4: Server Actions

```typescript
// src/modules/closet/actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { closetService } from "./service";
import { aiClassifier } from "./ai-classifier";

export async function addToCloset(photoUrl: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // 1. Analyze photo with AI (placeholder)
  const metadata = await aiClassifier.classify(photoUrl);

  // 2. Save item to database
  const item = await closetService.createItem({
    userId,
    photoUrl,
    metadata,
  });

  return item;
}
```

#### Step 6.2.5: Closet Page

```typescript
// src/app/(dashboard)/closet/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ClosetContent } from "./closet-content";

export default async function ClosetPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-800">Your Closet</h1>
      <ClosetContent userId={userId} />
    </div>
  );
}
```

#### Step 6.2.6: AI Classifier (Placeholder)

```typescript
// src/modules/closet/ai-classifier.ts
import { type ClothingMetadata } from "../ai/types";

export async function classify(photoUrl: string): Promise<ClothingMetadata> {
  // Placeholder implementation
  // In production, this would call the AI module
  return {
    type: "shirt",
    subType: "button-down",
    colors: [{ name: "navy", hex: "#000080", dominance: 1 }],
    pattern: "solid",
    material: "cotton",
    seasons: ["spring", "fall"],
    formality: 3,
    brand: null,
    confidence: 0.85,
  };
}
```

### 6.3 Phase Exit Criteria

- [ ] User can upload a photo
- [ ] Photo is stored in Supabase Storage
- [ ] AI classifier returns metadata
- [ ] Item is saved to database
- [ ] Item appears in closet
- [ ] Error handling works
- [ ] Loading states work

---

## 7. Phase 5 — Fashion Memory Foundation

**Duration:** 2-3 days
**Goal:** Memory storage and user correction flow

### 7.1 Components

| Component | Purpose |
|-----------|---------|
| Memory Service | Store and retrieve memories |
| Confidence Calculator | Calculate and update confidence |
| Evidence Tracker | Track evidence for each memory |
| User Correction Flow | Allow users to correct memories |

### 7.2 Implementation Steps

#### Step 7.2.1: Memory Service

```typescript
// src/modules/recommendations/memory-service.ts
import { db } from "@/lib/db/client";
import { fashionMemories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const memoryService = {
  async getMemories(userId: string) {
    return db
      .select()
      .from(fashionMemories)
      .where(
        and(
          eq(fashionMemories.userId, userId),
          eq(fashionMemories.status, "confirmed")
        )
      );
  },

  async confirmMemory(memoryId: string) {
    return db
      .update(fashionMemories)
      .set({
        lastConfirmed: new Date(),
        confidence: Math.min(1, 0.8 + 0.1), // Boost confidence
      })
      .where(eq(fashionMemories.id, memoryId));
  },

  async correctMemory(memoryId: string, description: string) {
    return db
      .update(fashionMemories)
      .set({
        description,
        lastConfirmed: new Date(),
        confidence: 0.5, // Reset confidence
      })
      .where(eq(fashionMemories.id, memoryId));
  },

  async deleteMemory(memoryId: string) {
    return db
      .delete(fashionMemories)
      .where(eq(fashionMemories.id, memoryId));
  },
};
```

#### Step 7.2.2: Confidence Calculator

```typescript
// src/modules/recommendations/confidence.ts
interface MemoryUpdate {
  dataPoints: number;
  consistency: number;
  lastSignal: Date;
  userConfirmed: boolean;
}

export function calculateConfidence(update: MemoryUpdate): number {
  const dataPointsScore = Math.min(update.dataPoints / 20, 1);
  const consistencyScore = update.consistency;
  const recencyScore = calculateRecencyScore(update.lastSignal);
  const confirmationBonus = update.userConfirmed ? 0.2 : 0;

  return Math.min(
    dataPointsScore * 0.3 +
      consistencyScore * 0.4 +
      recencyScore * 0.1 +
      confirmationBonus,
    1
  );
}

function calculateRecencyScore(lastSignal: Date): number {
  const daysSince =
    (Date.now() - lastSignal.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince < 7) return 1;
  if (daysSince < 30) return 0.8;
  if (daysSince < 90) return 0.6;
  if (daysSince < 180) return 0.4;
  return 0.2;
}
```

### 7.3 Phase Exit Criteria

- [ ] Memory service works
- [ ] Confidence calculation is correct
- [ ] User can confirm memories
- [ ] User can correct memories
- [ ] User can delete memories
- [ ] Evidence is tracked

---

## 8. Phase 6 — Outfit Generation

**Duration:** 3-5 days
**Goal:** Complete outfit generation with Trust Layer

### 8.1 Components

| Component | Purpose |
|-----------|---------|
| Outfit Generator | Generate outfit combinations |
| Scoring Engine | Score and rank outfits |
| Evidence Generator | Generate "Why LOOKSY picked this" |
| Trust Layer UI | Display evidence and reasoning |

### 8.2 Implementation Steps

#### Step 8.2.1: Outfit Generator

```typescript
// src/modules/outfits/generator.ts
import { type OutfitContext, type OutfitSuggestion } from "./types";

export async function generateOutfits(
  context: OutfitContext
): Promise<OutfitSuggestion[]> {
  // 1. Filter candidates based on context
  const candidates = filterCandidates(context);

  // 2. Generate combinations with AI
  const combinations = await generateCombinations(candidates, context);

  // 3. Score and rank
  const scored = scoreOutfits(combinations, context);

  // 4. Generate evidence
  const withEvidence = scored.map((outfit) => ({
    ...outfit,
    evidence: generateEvidence(outfit, context),
  }));

  return withEvidence;
}
```

#### Step 8.2.2: Trust Layer

```typescript
// src/components/outfits/trust-layer.tsx
import { type OutfitSuggestion } from "@/modules/outfits/types";

interface TrustLayerProps {
  outfit: OutfitSuggestion;
}

export function TrustLayer({ outfit }: TrustLayerProps) {
  return (
    <div className="rounded-lg bg-neutral-100 p-4">
      <h3 className="text-sm font-medium text-neutral-800">
        Why LOOKSY picked this
      </h3>
      <ul className="mt-2 space-y-2">
        {outfit.evidence.map((evidence, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-neutral-600">
            <span className="text-primary-500">✓</span>
            {evidence.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 8.3 Phase Exit Criteria

- [ ] Outfit generation works
- [ ] Outfits are scored and ranked
- [ ] Evidence is generated
- [ ] Trust Layer displays correctly
- [ ] User can give feedback
- [ ] Feedback is stored

---

## 9. Post-MVP Phases

| Phase | Focus | Duration |
|-------|-------|----------|
| v1.1 | Intelligence (Style DNA, Understanding) | 3 months |
| v1.2 | Monetization (Pro, Shopping Intelligence) | 3 months |
| v2.0 | Scale (Social, Community, Mobile) | 3 months |

---

## 10. Quality Gates

### 10.1 Per-Phase Checklist

Before moving to next phase:

- [ ] All code passes `npm run lint`
- [ ] All code passes `npm run typecheck`
- [ ] All tests pass (`npm test`)
- [ ] `npm run build` succeeds
- [ ] Application runs locally
- [ ] No console errors
- [ ] Documentation updated
- [ ] Architecture decisions documented

### 10.2 Code Quality

| Metric | Target |
|--------|--------|
| Test coverage | > 80% |
| Type coverage | 100% (strict mode) |
| Lint errors | 0 |
| Build time | < 60s |
| Bundle size | < 500KB (initial) |

### 10.3 Performance

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| Cumulative Layout Shift | < 0.1 |

---

*This implementation plan provides a structured, incremental approach to building LOOKSY. Each phase produces working, deployable code while maintaining quality and architectural integrity.*
