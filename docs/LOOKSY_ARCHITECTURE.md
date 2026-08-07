# LOOKSY — Product Architecture

> Version: 1.0 | Status: Draft | Last updated: 2026-07-22

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Core User Scenarios](#2-core-user-scenarios)
3. [User Journeys](#3-user-journeys)
4. [System Architecture](#4-system-architecture)
5. [Service Decomposition](#5-service-decomposition)
6. [Data Flow](#6-data-flow)
7. [MVP Scope](#7-mvp-scope)
8. [Future Extensions](#8-future-extensions)

---

## 1. Product Vision

### 1.1 What is LOOKSY

LOOKSY is a personal AI stylist application that builds a digital wardrobe for each user, analyzes their style, generates outfit recommendations, and over time becomes a digital twin of the user's taste.

### 1.2 Problem Statement

People own more clothes than they realize. Most wardrobe items are underutilized. Users lack tools to:
- Maintain awareness of what they actually own
- Combine existing items into coherent outfits
- Make informed purchasing decisions that complement their existing wardrobe
- Develop and evolve personal style systematically

### 1.3 Solution

LOOKSY solves this by:
- Digitizing the physical wardrobe through AI-powered photo analysis
- Understanding style through behavioral signals and explicit preferences
- Generating outfit recommendations from existing wardrobe items
- Curating shopping suggestions that extend the wardrobe logically
- Learning taste over time to become a personalized style authority

### 1.4 Target Users

| Segment | Description |
|---------|-------------|
| Primary | Style-conscious adults 22–40 who own 50–200+ clothing items and want to maximize wardrobe utility |
| Secondary | Fashion enthusiasts who enjoy building outfits and tracking trends |
| Tertiary | Gift-givers and personal shoppers who need insight into someone else's style |

### 1.5 Core Value Proposition

> "Know what you own. Wear what fits. Buy what matters."

### 1.6 Success Metrics

| Metric | Target |
|--------|--------|
| Daily Active Users (DAU) | 30% of registered users within 6 months |
| Wardrobe digitization rate | Average 40+ items per user |
| Outfit generation engagement | 3+ outfit views per session |
| Shopping conversion | 5% click-to-purchase on recommendations |
| Retention (D30) | 40% |

---

## 2. Core User Scenarios

### Scenario 1: Morning Outfit Decision
User opens the app, specifies context (weather, occasion, mood), and receives 3–5 outfit options from their existing wardrobe. User selects one and marks it as "worn" for wardrobe rotation tracking.

### Scenario 2: Wardrobe Digitization
User photographs a new purchase. AI automatically categorizes it (type, color, pattern, material, brand, season). Item appears in the digital closet with rich metadata. User can adjust tags if needed.

### Scenario 3: Style Discovery
User browses AI-generated style profiles. The app identifies that the user gravitates toward "minimalist casual" with a neutral color palette, and surfaces outfit templates matching that aesthetic.

### Scenario 4: Shopping with Context
User is browsing an online store or receives a push notification. LOOKSY analyzes a potential purchase against the existing wardrobe and advises: "This navy blazer pairs well with 12 items you already own" or "You already have 3 similar items — consider this alternative instead."

### Scenario 5: Wardrobe Gap Analysis
AI identifies that the user frequently creates outfits missing a specific type of item (e.g., "you need a versatile brown belt") and generates a prioritized shopping list.

### Scenario 6: Seasonal Transition
App proactively suggests archiving summer items and surfaces forgotten fall/winter pieces that complement current style evolution.

### Scenario 7: Social / Occasion Planning
User plans for an event (wedding, job interview, date). Provides context. AI generates outfit recommendations appropriate for the occasion, pulling from the user's actual wardrobe.

---

## 3. User Journeys

### 3.1 First Launch

```
Onboarding Flow (target: < 5 minutes to "wow moment")
│
├── Welcome Screen
│   └── Value proposition: "Your AI Stylist"
│
├── Style Quiz (optional, skippable)
│   ├── 5–7 quick visual questions
│   ├── Choose preferred aesthetics from image grid
│   ├── Frequency: dressy vs casual
│   └── Budget sensitivity signal
│
├── Camera Permission
│   ├── Request camera access
│   └── Fallback: upload from gallery
│
├── First Item Photo
│   ├── Guided photography (lighting, angle hints)
│   ├── AI processes and identifies the item
│   ├── Shows enriched metadata card
│   └── User confirms or edits
│
├── Quick Add Prompt
│   ├── "Add 5 more items to unlock your first outfit"
│   ├── Bulk photo mode
│   └── Skip option (pre-seeded demo closet)
│
└── First Outfit Generated
    └── "Wow" moment — AI creates first outfit from available items
```

**Key UX Principles:**
- Never block on empty state — provide a demo wardrobe or seed suggestions
- Progressive disclosure — don't overwhelm with all features at once
- Immediate value delivery — show AI capability within first 3 minutes

### 3.2 Wardrobe Upload

```
Upload Flow
│
├── Single Item Mode
│   ├── Open camera or gallery
│   ├── Capture / select photo
│   ├── AI vision processing (1–3 sec)
│   │   ├── Item type detection
│   │   ├── Color extraction
│   │   ├── Pattern recognition
│   │   ├── Material estimation
│   │   └── Brand logo detection (when visible)
│   ├── Result card displayed
│   │   ├── Photo thumbnail
│   │   ├── Auto-filled metadata
│   │   └── Editable fields
│   ├── User confirms / adjusts
│   └── Item saved to closet
│
├── Bulk Upload Mode
│   ├── Select multiple photos
│   ├── Queue processing with progress indicator
│   ├── Batch review screen
│   │   ├── Swipe through results
│   │   ├── Flag incorrect classifications
│   │   └── Quick-edit metadata
│   └── Batch save
│
└── Import from External (future)
    ├── Photo library scan
    ├── E-commerce order import
    └── Barcode / receipt scanning
```

### 3.3 First Outfit Creation

```
Outfit Generation Flow
│
├── Entry Points
│   ├── "Create Outfit" button (primary CTA)
│   ├── Daily outfit notification
│   └── Style quiz completion
│
├── Context Input
│   ├── Occasion (work, casual, formal, sport, date)
│   ├── Weather (auto-detected or manual)
│   │   ├── Temperature
│   │   └── Conditions (sunny, rainy, cold)
│   ├── Mood / preference (optional)
│   │   ├── "Keep it safe"
│   │   ├── "Surprise me"
│   │   └── "Be bold"
│   └── Dress code constraints (if applicable)
│
├── AI Generation
│   ├── Filter closet by season/weather appropriateness
│   ├── Apply style rules and color harmony
│   ├── Generate 3–5 outfit combinations
│   └── Rank by relevance score
│
├── Results Display
│   ├── Outfit cards with visual layout
│   │   ├── Items arranged as ensemble
│   │   ├── Color palette visualization
│   │   └── Match confidence score
│   ├── "Why this works" explanation
│   ├── Swap individual items
│   ├── Save to "My Outfits"
│   └── Share / screenshot
│
└── Post-Selection
    ├── "Wear this today" → marks items as recently worn
    ├── Rotation tracking begins
    └── Feedback loop: user rates outfit (implicit/explicit)
```

### 3.4 Daily Usage

```
Daily Engagement Flow
│
├── Morning Notification (optional)
│   ├── "What to wear today?"
│   ├── Weather-appropriate suggestion
│   └── One-tap outfit view
│
├── Closet Browsing
│   ├── Grid / list view of wardrobe
│   ├── Filters: type, color, season, brand, wear count
│   ├── Sort: newest, most worn, least worn, color
│   └── Item detail with outfit history
│
├── Wardrobe Analytics (passive)
│   ├── Items by category breakdown
│   ├── Color distribution
│   ├── Wear frequency heatmap
│   ├── "Neglected items"提醒
│   └── Cost-per-wear calculation
│
├── Outfit History
│   ├── Calendar view of worn outfits
│   ├── Re-wear suggestions
│   └── Style evolution timeline
│
└── Quick Actions
    ├── Photo new item
    ├── Generate outfit
    ├── Search closet
    └── Shopping recommendations
```

### 3.5 AI Stylist Interaction

```
Conversational Stylist Flow
│
├── Chat Interface
│   ├── Natural language input
│   ├── Quick-action chips (suggestions)
│   └── Voice input (future)
│
├── Conversation Types
│   │
│   ├── Recommendation Requests
│   │   ├── "What should I wear to a garden party?"
│   │   ├── "I need something comfortable for a long flight"
│   │   └── "Help me style these new jeans"
│   │
│   ├── Wardrobe Advice
│   │   ├── "Can I wear navy with black?"
│   │   ├── "Is this still in style?"
│   │   └── "What's missing from my wardrobe?"
│   │
│   ├── Shopping Guidance
│   │   ├── "I need a versatile jacket under $200"
│   │   ├── "Would this work with what I own?"
│   │   └── "Find me alternatives to this item"
│   │
│   ├── Style Coaching
│   │   ├── "What's my style profile?"
│   │   ├── "How has my style changed this year?"
│   │   └── "Teach me about color matching"
│   │
│   └── Wardrobe Management
│       ├── "Donate items I haven't worn in 6 months"
│       ├── "Archive my summer clothes"
│       └── "Organize by occasion"
│
├── Response Format
│   ├── Text explanation
│   ├── Visual outfit cards
│   ├── Item cards with details
│   └── Action buttons (wear, save, shop)
│
└── Personality & Tone
    ├── Professional but warm
    ├── Non-judgmental
    ├── Encouraging experimentation
    └── Adapts to user communication style
```

---

## 4. System Architecture

### 4.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  iOS App  │  │ Android  │  │   Web    │  │ Future:  │  │
│  │ (SwiftUI) │  │  (KMP)   │  │  (Next)  │  │  Watch   │  │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └──────────┘  │
│        └──────────────┼─────────────┘                      │
│                       │                                     │
└───────────────────────┼─────────────────────────────────────┘
                        │ HTTPS / WSS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Gateway (Kong / Traefik)            │  │
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐  │  │
│  │  │ Rate    │ │   Auth   │ │  WAF   │ │   SSL    │  │  │
│  │  │ Limiting│ │ (JWT/OA) │ │        │ │ Terminate│  │  │
│  │  └─────────┘ └──────────┘ └────────┘ └──────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER (Backend)                   │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │   Auth   │ │  Closet  │ │  Outfit  │ │   AI     │     │
│  │ Service  │ │ Service  │ │ Service  │ │ Stylist  │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │Recommend.│ │Analytics │ │ Shopping │                   │
│  │ Engine   │ │ Service  │ │ Service  │                   │
│  └──────────┘ └──────────┘ └──────────┘                   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Message Bus (Redis Streams / Kafka)        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└──────┬──────────┬──────────┬──────────┬────────────────────┘
       │          │          │          │
       ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                              │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │PostgreSQL│ │  Redis   │ │ Qdrant / │ │  S3 /    │     │
│  │ (Primary)│ │ (Cache + │ │ Pinecone │ │  R2      │     │
│  │          │ │  Session)│ │(Vector DB)│ │(Object   │     │
│  │          │ │          │ │          │ │ Storage) │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     AI LAYER                                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │               AI Orchestrator                         │  │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────────────┐  │  │
│  │  │ Vision    │ │  NLP /    │ │  Recommendation   │  │  │
│  │  │ Pipeline  │ │  LLM      │ │  Pipeline         │  │  │
│  │  │(GPT-4o/   │ │ (Claude/  │ │  (Custom ML +     │  │  │
│  │  │ Gemini)   │ │  GPT-4o)  │ │   Embeddings)     │  │  │
│  │  └───────────┘ └───────────┘ └───────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Custom ML Models (Fine-tuned)                 │  │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────────────┐  │  │
│  │  │  Style    │ │  Color    │ │  Outfit           │  │  │
│  │  │ Classifier│ │  Harmony  │ │  Compatibility    │  │  │
│  │  └───────────┘ └───────────┘ └───────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL INTEGRATIONS                       │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Weather  │ │ E-commerce│ │ Payment  │ │Analytics │     │
│  │ API      │ │ Affiliates│ │ (Stripe) │ │ (Mixpanel│     │
│  │          │ │          │ │          │ │ /Amplitude│    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **iOS Client** | Swift + SwiftUI | Native performance for camera, on-device ML |
| **Android Client** | Kotlin Multiplatform (KMP) with Compose | Shared business logic, native UI |
| **Web Client** | Next.js 14+ (App Router) | SSR for SEO, React ecosystem |
| **API Gateway** | Kong or Traefik | Rate limiting, auth, routing, observability |
| **Backend Services** | Node.js (NestJS) or Go | TypeScript for speed-to-market; Go for performance-critical services |
| **Primary Database** | PostgreSQL 16+ | ACID, JSONB for flexible metadata, mature ecosystem |
| **Cache / Sessions** | Redis 7+ | Session store, rate limiting, real-time features |
| **Vector Database** | Qdrant (self-hosted) or Pinecone (managed) | Similarity search for outfit/style matching |
| **Object Storage** | AWS S3 or Cloudflare R2 | Photo storage, CDN integration |
| **Message Bus** | Redis Streams (MVP) → Kafka (scale) | Async processing, event-driven architecture |
| **AI Vision** | OpenAI GPT-4o / Google Gemini Pro Vision | State-of-the-art image understanding |
| **LLM (Conversational)** | Anthropic Claude 3.5 / GPT-4o | Natural stylist conversation |
| **Embeddings** | OpenAI text-embedding-3-large | Item and style vectorization |
| **Custom ML** | PyTorch + Hugging Face | Fine-tuned classifiers for style, color, compatibility |
| **Deployment** | Kubernetes (EKS / GKE) | Auto-scaling, service mesh, observability |
| **CI/CD** | GitHub Actions + ArgoCD | GitOps workflow |
| **Monitoring** | Grafana + Prometheus + Sentry | Full observability stack |

### 4.3 Frontend Architecture

```
Frontend (per platform)
│
├── Presentation Layer
│   ├── Screens / Pages
│   ├── Reusable UI Components (Design System)
│   └── Animations & Transitions
│
├── State Management
│   ├── Server State (React Query / SwiftData)
│   ├── Client State (Zustand / local)
│   └── Optimistic Updates
│
├── Data Layer
│   ├── API Client (REST + WebSocket)
│   ├── Local Cache / Offline Support
│   ├── Camera Integration
│   └── Push Notifications
│
└── Cross-Cutting
    ├── Accessibility (a11y)
    ├── Internationalization (i18n)
    ├── Analytics Events
    └── Error Boundary
```

**Key Frontend Decisions:**
- Camera processing: on-device ML for instant feedback (Core ML / ML Kit), cloud AI for deep analysis
- Offline support: cache last-synced wardrobe, queue uploads
- Shared components via design system; platform-specific navigation patterns

### 4.4 Backend Architecture

```
Backend Services (each service owns its data)
│
├── API Layer (REST + GraphQL hybrid)
│   ├── REST for CRUD operations
│   └── GraphQL for complex queries (outfit generation, recommendations)
│
├── Business Logic Layer
│   ├── Domain models
│   ├── Use cases / Application services
│   └── Validation rules
│
├── Infrastructure Layer
│   ├── Database repositories
│   ├── Cache managers
│   ├── Event publishers / consumers
│   └── External API clients
│
└── Cross-Cutting
    ├── Authentication middleware (JWT)
    ├── Authorization (RBAC + resource ownership)
    ├── Request validation (Zod / io-ts)
    ├── Error handling
    ├── Logging
    └── Tracing (OpenTelemetry)
```

### 4.5 Database Strategy

| Database | Purpose | Scaling Strategy |
|----------|---------|-----------------|
| PostgreSQL | User data, wardrobe items, outfits, relationships | Read replicas, partitioning by user_id |
| Redis | Sessions, rate limits, hot cache, real-time features | Cluster mode, eviction policies |
| Qdrant / Pinecone | Style vectors, item embeddings, similarity search | Horizontal sharding, index optimization |
| S3 / R2 | Photo originals, processed images, thumbnails | CDN (CloudFront / Cloudflare) |

### 4.6 AI Layer Architecture

```
AI Orchestrator
│
├── Vision Pipeline
│   ├── Image preprocessing (crop, enhance, normalize)
│   ├── Primary classification (multi-modal LLM)
│   ├── Confidence scoring
│   ├── Metadata extraction
│   └── Fallback chain (GPT-4o → Gemini → custom model)
│
├── NLP / Conversational Pipeline
│   ├── Intent classification
│   ├── Context assembly (user history, closet, preferences)
│   ├── LLM inference with system prompt
│   ├── Response formatting
│   └── Tool calling (outfit generation, search, etc.)
│
├── Recommendation Pipeline
│   ├── User style profile computation
│   ├── Item embedding generation
│   ├── Similarity search
│   ├── Outfit compatibility scoring
│   ├── Personalized ranking
│   └── Explanation generation
│
└── Feedback Loop
    ├── User interactions → implicit signals
    ├── Explicit ratings → training data
    ├── A/B testing framework
    └── Model fine-tuning pipeline
```

---

## 5. Service Decomposition

### 5.1 Authentication Service

**Responsibility:** User identity, session management, access control.

| Concern | Implementation |
|---------|---------------|
| Registration | Email, phone, social (Google, Apple, Facebook) |
| Authentication | JWT access tokens + refresh tokens |
| Session Management | Redis-backed sessions, device tracking |
| Authorization | RBAC (user, premium, admin) + resource ownership |
| Security | Rate limiting, brute-force protection, token rotation |
| Multi-tenancy | User data isolation via user_id scoping |

**API Surface:**
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `DELETE /auth/account`
- `GET /auth/me`
- OAuth callbacks

### 5.2 Closet Service

**Responsibility:** CRUD operations for wardrobe items, categorization, metadata management.

| Concern | Implementation |
|---------|---------------|
| Item CRUD | Create, read, update, delete clothing items |
| Photo Management | Upload to storage, trigger AI processing |
| Categorization | Type, color, pattern, material, season, occasion |
| Search & Filter | Full-text + faceted search across wardrobe |
| Wardrobe Analytics | Aggregate stats (item count, categories, wear history) |
| Item Lifecycle | Active → archived → donated/discarded |

**API Surface:**
- `POST /closet/items` — add item (photo upload)
- `GET /closet/items` — list with filters
- `GET /closet/items/:id` — item detail
- `PATCH /closet/items/:id` — update metadata
- `DELETE /closet/items/:id` — remove item
- `GET /closet/stats` — wardrobe analytics
- `POST /closet/items/batch` — bulk upload
- `GET /closet/search` — search closet

**Data Ownership:** Owns `clothing_items`, `item_categories`, `item_photos` tables.

### 5.3 Outfit Service

**Responsibility:** Outfit creation, storage, history, and management.

| Concern | Implementation |
|---------|---------------|
| Outfit Generation | Coordinate with AI to create outfit combinations |
| Outfit Storage | Save outfits, tag, categorize |
| Wear Tracking | Mark items as worn, update wear counts |
| History | Calendar view, outfit journal |
| Sharing | Generate outfit cards, social sharing |
| Constraints | Weather, occasion, dress code filters |

**API Surface:**
- `POST /outfits/generate` — AI-generated outfit
- `POST /outfits` — save manual outfit
- `GET /outfits` — list saved outfits
- `GET /outfits/:id` — outfit detail
- `DELETE /outfits/:id` — remove outfit
- `POST /outfits/:id/wear` — mark as worn today
- `GET /outfits/history` — wear history
- `GET /outfits/calendar` — calendar view

**Data Ownership:** Owns `outfits`, `outfit_items`, `wear_log` tables.

### 5.4 AI Stylist Service

**Responsibility:** Natural language interaction, style coaching, contextual advice.

| Concern | Implementation |
|---------|---------------|
| Chat Interface | WebSocket-based real-time conversation |
| Intent Recognition | Classify user requests into action types |
| Context Assembly | Gather user profile, closet, history for LLM |
| LLM Orchestration | Multi-turn conversation with tool calling |
| Response Generation | Text + visual outfit cards + item suggestions |
| Personality | Consistent stylist persona, adaptive tone |
| Conversation Memory | Persistent chat history per user |

**API Surface:**
- `WS /stylist/chat` — real-time chat
- `POST /stylist/message` — single message (REST fallback)
- `GET /stylist/conversations` — list conversations
- `GET /stylist/conversations/:id` — conversation history
- `POST /stylist/style-profile` — compute/update style profile

**Data Ownership:** Owns `conversations`, `messages`, `style_profiles` tables.

### 5.5 Recommendation Engine

**Responsibility:** Outfit suggestions, item recommendations, wardrobe analysis.

| Concern | Implementation |
|---------|---------------|
| Style Profiling | Continuous learning from user behavior |
| Outfit Scoring | Compatibility matrix between items |
| Personalized Ranking | Collaborative + content-based filtering |
| Gap Analysis | Identify missing wardrobe pieces |
| Shopping Integration | Surface relevant products from partners |
| A/B Testing | Test recommendation strategies |

**API Surface:**
- `GET /recommendations/outfits` — daily outfit suggestions
- `GET /recommendations/shopping` — shopping suggestions
- `GET /recommendations/gaps` — wardrobe gaps
- `POST /recommendations/feedback` — user feedback signal
- `GET /recommendations/style-profile` — current style assessment

**Data Ownership:** Owns `recommendations`, `style_vectors`, `user_preferences` tables.

### 5.6 Analytics Service

**Responsibility:** User behavior tracking, business metrics, product analytics.

| Concern | Implementation |
|---------|---------------|
| Event Tracking | Client and server events |
| User Analytics | DAU, session length, feature usage |
| Business Metrics | Revenue, conversion, retention cohorts |
| Product Analytics | Funnel analysis, A/B test results |
| Recommendation Metrics | Click-through, conversion, satisfaction |
| Data Warehouse | Aggregated data for reporting |

**API Surface:**
- `POST /analytics/events` — ingest events
- `GET /analytics/dashboard` — business dashboard
- `GET /analytics/user/:id` — individual user analytics
- Internal only — primarily consumes events from other services

**Data Ownership:** Owns `events`, `metrics`, `aggregations` tables + analytics data warehouse.

### 5.7 Shopping Service

**Responsibility:** E-commerce integrations, affiliate management, purchase tracking.

| Concern | Implementation |
|---------|---------------|
| Product Catalog | Aggregate products from partner retailers |
| Partner Management | Affiliate programs, API integrations |
| Price Tracking | Monitor prices, alert on drops |
| Purchase Attribution | Track clicks, conversions, commissions |
| Product Matching | Match products to wardrobe gaps |
| Wishlist | User-saved items for later |

**API Surface:**
- `GET /shopping/products` — browse products
- `GET /shopping/products/:id` — product detail
- `POST /shopping/wishlist` — add to wishlist
- `GET /shopping/wishlist` — list wishlist
- `POST /shopping/click/:productId` — track affiliate click
- `GET /shopping/partners` — available partners

**Data Ownership:** Owns `products`, `partners`, `wishlist`, `affiliate_events` tables.

### 5.8 Service Communication

```
Synchronous (REST / GraphQL):
  Client → API Gateway → Service
  Service → Service (only for critical-path reads)

Asynchronous (Event Bus):
  Closet Service → "item.created" → AI Layer (embedding generation)
  Closet Service → "item.updated" → Recommendation Engine (re-score)
  Outfit Service → "outfit.worn" → Analytics, Recommendation Engine
  AI Stylist → "recommendation.generated" → Outfit Service
  Shopping Service → "product.matched" → AI Stylist (for conversation)
```

---

## 6. Data Flow

### 6.1 Photo Ingestion Pipeline

```
User photographs clothing item
│
├── Step 1: Client-Side Preprocessing
│   ├── Image resize (max 2048px longest edge)
│   ├── Orientation correction (EXIF)
│   ├── Basic quality check (blur detection, minimum resolution)
│   └── Compress to JPEG/WebP
│
├── Step 2: Upload to Object Storage
│   ├── Generate presigned upload URL
│   ├── Upload original to S3/R2
│   ├── Generate thumbnail (300px, 600px, 1200px)
│   └── Return photo IDs
│
├── Step 3: AI Vision Analysis (async)
│   ├── Receive photo URL
│   ├── Preprocessing: background removal, lighting normalization
│   ├── Primary analysis (GPT-4o Vision or Gemini)
│   │   ├── Item type (shirt, pants, dress, jacket, shoes, accessory)
│   │   ├── Sub-type (button-down, polo, slim-fit, etc.)
│   │   ├── Primary color + secondary colors (hex values)
│   │   ├── Pattern (solid, striped, plaid, floral, abstract)
│   │   ├── Material estimation (cotton, denim, leather, silk, etc.)
│   │   ├── Season suitability (spring, summer, fall, winter)
│   │   ├── Formality level (1–5 scale)
│   │   ├── Brand detection (when logo visible)
│   │   └── Condition assessment
│   ├── Confidence scoring (per attribute)
│   └── Low-confidence flagging for human review
│
├── Step 4: Metadata Enrichment
│   ├── Color palette extraction (dominant + accent colors)
│   ├── Style tag generation (vintage, minimalist, streetwear, etc.)
│   └── Cross-reference with brand database (if available)
│
├── Step 5: Embedding Generation
│   ├── Visual embedding (CLIP-based, 512-dim vector)
│   ├── Attribute embedding (text-based, 256-dim vector)
│   ├── Combined embedding for similarity search
│   └── Store in vector database (Qdrant / Pinecone)
│
├── Step 6: Database Persistence
│   ├── Save item record (PostgreSQL)
│   ├── Link photos
│   ├── Store embeddings reference
│   └── Emit "item.created" event
│
└── Step 7: Post-Creation Actions
    ├── Trigger recommendation refresh for user
    ├── Update wardrobe analytics
    ├── Notify client via WebSocket (processing complete)
    └── Queue style profile recalculation (if > 20 items)
```

### 6.2 Outfit Generation Pipeline

```
User requests outfit / Daily auto-generation
│
├── Step 1: Context Assembly
│   ├── Fetch user's closet (active items only)
│   ├── Get current weather (location-based API)
│   ├── Get occasion / constraints (from user input)
│   ├── Fetch user style profile
│   ├── Fetch recent outfit history (avoid repetition)
│   └── Fetch item wear counts (promote rotation)
│
├── Step 2: Candidate Filtering
│   ├── Filter by season appropriateness
│   ├── Filter by weather suitability (no shorts in snow)
│   ├── Filter by formality match
│   ├── Exclude recently worn items (configurable cooldown)
│   └── Weight by wear count (prefer underused items)
│
├── Step 3: AI-Powered Combination Generation
│   ├── Send filtered candidates to LLM with style prompt
│   ├── LLM generates outfit combinations with reasoning
│   ├── Parallel: run embedding similarity for complementary items
│   └── Merge LLM suggestions with embedding-based suggestions
│
├── Step 4: Scoring & Ranking
│   ├── Color harmony score (complementary/analogous/triadic)
│   ├── Style coherence score (consistent aesthetic)
│   ├── Context match score (occasion + weather fit)
│   ├── Novelty score (haven't worn this combo before)
│   ├── User preference score (learned from past feedback)
│   └── Weighted composite → final ranking
│
├── Step 5: Presentation
│   ├── Generate visual outfit card
│   ├── Generate "why this works" explanation text
│   ├── Provide swap alternatives for each item
│   └── Return 3–5 ranked options
│
└── Step 6: Feedback Capture
    ├── Track: viewed, saved, worn, dismissed
    ├── Implicit: time spent viewing, swaps made
    └── Update recommendation model with signals
```

### 6.3 AI Stylist Conversation Pipeline

```
User sends message in stylist chat
│
├── Step 1: Message Processing
│   ├── Parse and validate input
│   ├── Detect language
│   ├── Run sentiment analysis (optional)
│   └── Classify intent
│       ├── outfit_request → Outfit Generation Pipeline
│       ├── wardrobe_query → Closet search
│       ├── style_question → Knowledge retrieval
│       ├── shopping_help → Shopping Service
│       ├── general_chat → Conversational response
│       └── wardrobe_management → Closet operations
│
├── Step 2: Context Assembly
│   ├── User profile (style, preferences, history)
│   ├── Wardrobe snapshot (key items, stats)
│   ├── Recent conversation history (last 20 messages)
│   ├── Current context (time, weather, location)
│   └── Relevant outfit history
│
├── Step 3: LLM Inference
│   ├── System prompt (stylist persona + capabilities)
│   ├── Assembled context
│   ├── User message
│   ├── Available tools (outfit gen, search, recommend)
│   └── Stream response to client
│
├── Step 4: Tool Execution (if applicable)
│   ├── LLM requests tool call
│   ├── Execute tool (e.g., generate outfit)
│   ├── Return result to LLM
│   └── LLM incorporates into response
│
├── Step 5: Response Delivery
│   ├── Stream text tokens to client
│   ├── Attach visual cards (outfits, items)
│   ├── Attach action buttons
│   └── Save message to conversation history
│
└── Step 6: Learning
    ├── Log intent classification accuracy
    ├── Track tool call success
    ├── Capture user satisfaction (implicit + explicit)
    └── Feed into fine-tuning dataset
```

### 6.4 Embedding & Similarity Pipeline

```
Item added / updated / style profile changed
│
├── Visual Embedding
│   ├── Input: item photo (cropped, normalized)
│   ├── Model: CLIP ViT-L/14 or custom fine-tuned
│   ├── Output: 512-dimensional vector
│   └── Store in vector DB with metadata payload
│
├── Attribute Embedding
│   ├── Input: item metadata text (type, color, pattern, material, brand)
│   ├── Model: text-embedding-3-large
│   ├── Output: 256-dimensional vector
│   └── Store alongside visual embedding
│
├── Style Profile Embedding
│   ├── Input: aggregated user preferences + interaction history
│   ├── Model: custom (fine-tuned on fashion data)
│   ├── Output: 256-dimensional style vector
│   └── Updated on meaningful interaction thresholds
│
└── Similarity Operations
    ├── "Find similar items" → cosine similarity on visual embeddings
    ├── "Find complementary items" → learned compatibility model
    ├── "Find outfits like this" → outfit embedding similarity
    └── "Style this like me" → project item onto user style space
```

---

## 7. MVP Scope

### 7.1 In Scope (MVP — v1.0)

| Feature | Priority | Description |
|---------|----------|-------------|
| **User Registration** | P0 | Email + social auth (Google, Apple) |
| **Camera / Photo Upload** | P0 | Single item photo with AI processing |
| **AI Item Classification** | P0 | Auto-detect type, color, pattern, material, season |
| **Digital Closet** | P0 | Browse, search, filter wardrobe items |
| **Item Editing** | P0 | Correct AI classification, add manual tags |
| **Outfit Generation** | P0 | AI-generated outfits from closet items |
| **Weather Integration** | P0 | Weather-based filtering for outfit suggestions |
| **Wear Tracking** | P0 | Mark outfits as worn, track frequency |
| **Basic Style Profile** | P1 | Auto-computed style preferences |
| **Push Notifications** | P1 | Daily outfit suggestion |
| **Outfit History** | P1 | Calendar view of past outfits |

### 7.2 Explicitly Out of Scope (MVP)

| Feature | Target Release |
|---------|---------------|
| AI Stylist chat | v1.2 |
| Shopping / affiliate integration | v1.3 |
| Social features (sharing, follows) | v1.4 |
| Barcode / receipt scanning | v1.2 |
| E-commerce import | v2.0 |
| Voice input | v2.0 |
| On-device ML | v1.5 |
| Wardrobe analytics dashboard | v1.2 |
| Web app | v1.1 |
| Android app | v1.1 |

### 7.3 MVP Technical Constraints

- **Platform:** iOS only (fastest path to market for target demo)
- **AI Provider:** Single provider (OpenAI GPT-4o) — minimize complexity
- **Backend:** Monolith-first with clear service boundaries (extract later)
- **Database:** Single PostgreSQL instance + Redis + S3
- **Vector DB:** Deferred to v1.2 — use basic metadata filtering initially
- **Deployment:** Single-region cloud (AWS us-east-1 or eu-west-1)

### 7.4 MVP Success Criteria

| Metric | Target (3 months post-launch) |
|--------|-------------------------------|
| Registered users | 5,000 |
| Items uploaded per user (avg) | 25 |
| DAU/MAU ratio | 25% |
| Outfit generations per DAU | 2+ |
| NPS | > 40 |
| Crash rate | < 1% |
| AI classification accuracy | > 85% |

### 7.5 MVP Architecture Decision Records

**ADR-001: Monolith-first**
- Decision: Build as modular monolith, extract services when team/revenue justifies
- Rationale: Faster iteration, simpler deployment, lower operational cost at small scale
- Consequence: Service extraction planned for v1.5+

**ADR-002: iOS-first**
- Decision: Launch iOS only, add web and Android post-MVP
- Rationale: Target audience skews iOS (fashion-conscious, higher spend), faster to ship one platform well
- Consequence: Delayed reach, but higher quality initial experience

**ADR-003: Single AI provider**
- Decision: Use OpenAI GPT-4o for both vision and LLM
- Rationale: Reduces integration complexity, single billing relationship, consistent API
- Consequence: Vendor lock-in risk, mitigated by clean abstraction layer

---

## 8. Future Extensions

### 8.1 Near-Term (v1.1–v1.5)

| Feature | Description |
|---------|-------------|
| **Web App** | Next.js companion app for closet management and outfit planning |
| **Android App** | Kotlin Multiplatform with shared business logic |
| **AI Stylist Chat** | Conversational interface for style advice |
| **Wardrobe Analytics** | Usage statistics, cost-per-wear, wardrobe value |
| **Barcode Scanning** | Scan care labels for automatic brand/material detection |
| **Bulk Upload** | Process 10+ photos in batch |
| **On-Device ML** | Fast on-device classification, cloud fallback |
| **Outfit Templates** | Save outfit formulas for quick reuse |

### 8.2 Mid-Term (v2.0–v2.5)

| Feature | Description |
|---------|-------------|
| **Shopping Integration** | Affiliate partnerships with major retailers |
| **Social Features** | Follow stylists, share outfits, community feed |
| **E-commerce Import** | Auto-import purchases from email receipts |
| **Virtual Try-On** | AI-powered try-on visualization |
| **Capsule Wardrobe** | AI-curated minimal wardrobe plans |
| **Shared Closets** | Family / couple closet management |
| **Multi-Language** | Full i18n support |
| **Style Evolution** | Visual timeline of style changes over months/years |

### 8.3 Long-Term (v3.0+)

| Feature | Description |
|---------|-------------|
| **Digital Twin** | Fully autonomous AI that shops and plans on user's behalf |
| **AR Integration** | AR closet visualization, in-store AR styling |
| **Sustainability Score** | Environmental impact tracking per outfit |
| **Personal Shopper Marketplace** | Connect with human stylists for premium consultations |
| **B2B / White Label** | License AI stylist engine to retailers |
| **Fashion Industry API** | Data insights for brands and trend analysis |
| **Wearable Integration** | Smart mirror, smart closet hardware |

### 8.4 Platform Evolution

```
v1.0 (MVP)          → iOS Monolith
v1.1–v1.4           → iOS + Web + Android, feature expansion
v1.5–v1.9           → Service extraction, microservices transition
v2.0–v2.5           → Full platform, shopping, social
v3.0+               → AI-first platform, hardware, B2B
```

---

## Appendix A: Key Design Principles

1. **Privacy-First:** Wardrobe photos are personal. Encrypt at rest and in transit. Never use user photos for model training without explicit consent. GDPR/CCPA compliant from day one.

2. **Progressive Intelligence:** AI improves with each interaction. Early users get value from basic classification; power users get deeply personalized recommendations.

3. **Offline-Resilient:** Core closet browsing must work offline. Outfit generation requires connectivity but should degrade gracefully.

4. **Speed Matters:** Photo-to-metadata in under 5 seconds. Outfit generation in under 3 seconds. Chat responses stream in real-time.

5. **Delight Over Utility:** Every interaction should feel slightly magical. Unexpected outfit combinations, witty stylist personality, beautiful visual presentation.

---

## Appendix B: Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI classification accuracy too low | User frustration, manual correction burden | Multi-model fallback, confidence thresholds, user correction feedback loop |
| Photo quality inconsistent | Poor AI results, user abandonment | On-device preprocessing, quality hints, example photos |
| Cold start (no items in closet) | No outfit generation possible | Demo closet option, guided onboarding, shopping integration |
| Privacy concerns (wardrobe photos) | User reluctance to upload | Clear privacy policy, encryption, consent controls |
| AI provider cost at scale | Margin erosion | Cache aggressively, batch processing, fine-tune smaller models |
| Outfit diversity fatigue | Same recommendations repeated | Novelty scoring, style evolution tracking, random exploration |

---

*This document is a living artifact. Update as architectural decisions are made and validated through implementation.*
