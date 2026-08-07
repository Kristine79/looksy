# LOOKSY — Database Schema

> Version: 1.0 | Status: Active | Last updated: 2026-07-22
> Role: Data Engineer | Database Design & Management

---

## Table of Contents

1. [Schema Overview](#1-schema-overview)
2. [Drizzle ORM Setup](#2-drizzle-orm-setup)
3. [Core Tables](#3-core-tables)
4. [AI & Embeddings](#4-ai--embeddings)
5. [Outfit System](#5-outfit-system)
6. [Fashion Memory](#6-fashion-memory)
7. [Analytics & Subscriptions](#7-analytics--subscriptions)
8. [Indexes & Performance](#8-indexes--performance)
9. [Migrations](#9-migrations)
10. [Seeding & Testing](#10-seeding--testing)

---

## 1. Schema Overview

### 1.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LOOKSY Database Schema                       │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    users     │────<│  user_preferences │     │ user_subscriptions│
│              │     └──────────────────┘     └──────────────────┘
│  id (PK)     │                                        │
│  clerk_id    │                                        │
│  email       │                                        │
│  name        │                                        │
│  avatar_url  │                                        │
│  location    │                                        │
└──────┬───────┘                                        │
       │                                                │
       │ 1:N                                            │
       ▼                                                │
┌──────────────────┐                              ┌─────┴───────┐
│  clothing_items  │                              │  plans      │
│                  │                              │             │
│  id (PK)         │──────┐                       │  id (PK)    │
│  user_id (FK)    │      │                       │  name       │
│  type            │      │                       │  price      │
│  sub_type        │      │                       │  features   │
│  brand           │      │                       └─────────────┘
│  material        │      │
│  pattern         │      │
│  colors          │      │
│  season          │      │
│  formality       │      │
│  condition       │      │
│  status          │      │
│  wear_count      │      │
│  last_worn       │      │
│  metadata        │      │
└────────┬─────────┘      │
         │                │
         │ 1:N            │
         ▼                │
┌──────────────────┐      │
│   item_photos    │      │
│                  │      │
│  id (PK)         │      │
│  item_id (FK)    │      │
│  url             │      │
│  thumbnail       │      │
│  is_primary      │      │
└──────────────────┘      │
                          │
         ┌────────────────┘
         │ 1:N
         ▼
┌──────────────────┐
│ item_embeddings  │
│                  │
│  id (PK)         │
│  item_id (FK)    │
│  user_id (FK)    │
│  embedding       │ (vector 1536)
│  text_repr       │
│  model           │
└──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│    outfits       │────<│  outfit_items    │
│                  │     │                  │
│  id (PK)         │     │  id (PK)         │
│  user_id (FK)    │     │  outfit_id (FK)  │
│  name            │     │  item_id (FK)    │
│  occasion        │     │  position        │
│  weather         │     └──────────────────┘
│  explanation     │
│  scores          │
│  evidence        │
│  is_saved        │
│  feedback        │
└────────┬─────────┘
         │
         │ 1:N
         ▼
┌──────────────────┐
│    wear_log      │
│                  │
│  id (PK)         │
│  user_id (FK)    │
│  outfit_id (FK)  │
│  item_ids        │
│  worn_at         │
│  occasion        │
│  weather         │
│  feedback        │
└──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│ fashion_memories │     │ user_style_vectors│
│                  │     │                  │
│  id (PK)         │     │  user_id (PK)    │
│  user_id (FK)    │     │  style_vec       │ (vector 1536)
│  type            │     │  computed_at     │
│  category        │     └──────────────────┘
│  description     │
│  evidence        │
│  confidence      │
│  data_points     │
│  last_confirmed  │
│  status          │
└──────────────────┘

┌──────────────────┐
│ analytics_events │
│                  │
│  id (PK)         │
│  user_id (FK)    │
│  event_name      │
│  properties      │
│  created_at      │
└──────────────────┘
```

### 1.2 Table Summary

| Table | Purpose | Rows (est. at 5K users) |
|-------|---------|------------------------|
| users | User accounts | 5,000 |
| user_preferences | User settings | 5,000 |
| clothing_items | Wardrobe items | 125,000 |
| item_photos | Item images | 125,000 |
| item_embeddings | Vector embeddings | 125,000 |
| outfits | Generated outfits | 50,000 |
| outfit_items | Outfit-item junction | 250,000 |
| wear_log | Wear history | 150,000 |
| fashion_memories | AI-learned patterns | 25,000 |
| user_style_vectors | User style vectors | 5,000 |
| analytics_events | Event tracking | 1,000,000 |
| user_subscriptions | Pro subscriptions | 250 |
| plans | Subscription plans | 2 |

---

## 2. Drizzle ORM Setup

### 2.1 Configuration

```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### 2.2 Database Client

```typescript
// src/lib/db/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
```

### 2.3 Schema Aggregation

```typescript
// src/lib/db/schema.ts
export * from '../../modules/users/schema';
export * from '../../modules/closet/schema';
export * from '../../modules/outfits/schema';
export * from '../../modules/recommendations/schema';
export * from '../../modules/analytics/schema';
export * from '../../modules/subscriptions/schema';
```

---

## 3. Core Tables

### 3.1 Users

```typescript
// src/modules/users/schema.ts
import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  avatarUrl: text('avatar_url'),
  location: jsonb('location').$type<{
    city: string;
    lat: number;
    lon: number;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### 3.2 User Preferences

```typescript
export const userPreferences = pgTable('user_preferences', {
  userId: uuid('user_id').primaryKey().references(() => users.id, {
    onDelete: 'cascade',
  }),
  stylePreferences: jsonb('style_preferences').$type<{
    aesthetics: string[];
    formality: number; // 1-5
    colors: string[];
    brands: string[];
  }>(),
  notificationSettings: jsonb('notification_settings').$type<{
    pushEnabled: boolean;
    emailEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  }>().default({
    pushEnabled: true,
    emailEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  }),
  quizCompleted: boolean('quiz_completed').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### 3.3 Clothing Items

```typescript
// src/modules/closet/schema.ts
export const clothingItems = pgTable('clothing_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, {
    onDelete: 'cascade',
  }),
  type: varchar('type', { length: 50 }).notNull(), // shirt, pants, dress, etc.
  subType: varchar('sub_type', { length: 100 }), // button-down, slim-fit, etc.
  brand: varchar('brand', { length: 255 }),
  material: varchar('material', { length: 100 }),
  pattern: varchar('pattern', { length: 50 }), // solid, striped, plaid, etc.
  colors: jsonb('colors').$type<Array<{
    name: string;
    hex: string;
    dominance: number;
  }>>().notNull(),
  seasons: jsonb('seasons').$type<string[]>().notNull(), // spring, summer, fall, winter
  formality: integer('formality').default(3).notNull(), // 1-5
  condition: varchar('condition', { length: 50 }).default('good'),
  status: varchar('status', { length: 20 }).default('active'), // active, archived, donated
  wearCount: integer('wear_count').default(0),
  lastWorn: timestamp('last_worn'),
  metadata: jsonb('metadata'), // additional AI-extracted data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### 3.4 Item Photos

```typescript
export const itemPhotos = pgTable('item_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => clothingItems.id, {
    onDelete: 'cascade',
  }),
  url: text('url').notNull(),
  thumbnail: text('thumbnail'),
  isPrimary: boolean('is_primary').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

## 4. AI & Embeddings

### 4.1 Item Embeddings

```typescript
// src/modules/recommendations/schema.ts
import { vector } from 'drizzle-orm/pg-core';

export const itemEmbeddings = pgTable('item_embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => clothingItems.id, {
    onDelete: 'cascade',
  }),
  userId: uuid('user_id').notNull().references(() => users.id, {
    onDelete: 'cascade',
  }),
  embedding: vector('embedding', { dimensions: 1536 }).notNull(),
  textRepr: text('text_repr'), // text used to generate embedding
  model: varchar('model', { length: 50 }).default('text-embedding-3-small'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### 4.2 User Style Vectors

```typescript
export const userStyleVectors = pgTable('user_style_vectors', {
  userId: uuid('user_id').primaryKey().references(() => users.id, {
    onDelete: 'cascade',
  }),
  styleVec: vector('style_vec', { dimensions: 1536 }).notNull(),
  computedAt: timestamp('computed_at').defaultNow().notNull(),
});
```

### 4.3 Similarity Search Function

```sql
-- Create function for similarity search
CREATE OR REPLACE FUNCTION find_similar_items(
  query_embedding vector(1536),
  user_id_param uuid,
  exclude_item_id uuid DEFAULT NULL,
  result_limit integer DEFAULT 10
)
RETURNS TABLE (
  item_id uuid,
  distance float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ie.item_id,
    ie.embedding <=> query_embedding as distance
  FROM item_embeddings ie
  WHERE ie.user_id = user_id_param
    AND (exclude_item_id IS NULL OR ie.item_id != exclude_item_id)
  ORDER BY ie.embedding <=> query_embedding
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Outfit System

### 5.1 Outfits

```typescript
// src/modules/outfits/schema.ts
export const outfits = pgTable('outfits', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, {
    onDelete: 'cascade',
  }),
  name: varchar('name', { length: 255 }),
  occasion: varchar('occasion', { length: 100 }),
  weather: jsonb('weather').$type<{
    temperature: number;
    condition: string;
  }>(),
  explanation: text('explanation'),
  scores: jsonb('scores').$type<{
    colorHarmony: number;
    styleCoherence: number;
    weatherFit: number;
    rotationScore: number;
  }>(),
  evidence: jsonb('evidence').$type<Array<{
    type: string;
    text: string;
    source: string;
    confidence: number;
  }>>(),
  isSaved: boolean('is_saved').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### 5.2 Outfit Items

```typescript
export const outfitItems = pgTable('outfit_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  outfitId: uuid('outfit_id').notNull().references(() => outfits.id, {
    onDelete: 'cascade',
  }),
  itemId: uuid('item_id').notNull().references(() => clothingItems.id, {
    onDelete: 'cascade',
  }),
  position: integer('position').default(0), // display order
});
```

### 5.3 Wear Log

```typescript
export const wearLog = pgTable('wear_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, {
    onDelete: 'cascade',
  }),
  outfitId: uuid('outfit_id').references(() => outfits.id),
  itemIds: uuid('item_ids').array().notNull(), // array of item IDs
  wornAt: timestamp('worn_at').defaultNow().notNull(),
  occasion: varchar('occasion', { length: 100 }),
  weather: jsonb('weather').$type<{
    temperature: number;
    condition: string;
  }>(),
  feedback: jsonb('feedback').$type<{
    rating: number; // 1-4
    tags: string[];
    notes: string;
  }>(),
});
```

### 5.4 Outfit Generation Query

```typescript
// Find items suitable for outfit generation
async function getOutfitCandidates(
  userId: string,
  weather: { temperature: number; condition: string },
  occasion: string
) {
  const season = getSeasonFromTemperature(weather.temperature);

  return db
    .select()
    .from(clothingItems)
    .where(
      and(
        eq(clothingItems.userId, userId),
        eq(clothingItems.status, 'active'),
        // Season-appropriate items
        sql`${clothingItems.seasons} @> ${JSON.stringify([season])}`,
        // Exclude recently worn (7-day cooldown)
        or(
          isNull(clothingItems.lastWorn),
          sql`${clothingItems.lastWorn} < NOW() - INTERVAL '7 days'`
        )
      )
    )
    .orderBy(sql`RANDOM()`) // Randomize for variety
    .limit(50); // Limit for API cost
}
```

---

## 6. Fashion Memory

### 6.1 Fashion Memories

```typescript
// src/modules/recommendations/schema.ts
export const fashionMemories = pgTable('fashion_memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, {
    onDelete: 'cascade',
  }),
  type: varchar('type', { length: 50 }).notNull(), // color_preference, style_tendency, etc.
  category: varchar('category', { length: 100 }).notNull(),
  description: text('description').notNull(), // "You tend to choose earth tones"
  evidence: jsonb('evidence').$type<Array<{
    type: string;
    text: string;
    source: string;
    confidence: number;
  }>>(),
  confidence: real('confidence').notNull(), // 0-1
  dataPoints: integer('data_points').default(0),
  lastConfirmed: timestamp('last_confirmed'),
  lastInfluenced: timestamp('last_influenced'),
  status: varchar('status', { length: 20 }).default('emerging'), // emerging, possible, confirmed, fading, dormant
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### 6.2 Memory Update Function

```sql
-- Update memory confidence based on decay
CREATE OR REPLACE FUNCTION update_memory_confidence()
RETURNS TRIGGER AS $$
DECLARE
  days_since_confirmed integer;
  decay_factor real;
BEGIN
  -- Calculate days since last confirmation
  IF NEW.last_confirmed IS NOT NULL THEN
    days_since_confirmed := EXTRACT(DAY FROM NOW() - NEW.last_confirmed);
  ELSE
    days_since_confirmed := EXTRACT(DAY FROM NOW() - NEW.created_at);
  END IF;

  -- Calculate decay factor
  IF days_since_confirmed < 30 THEN
    decay_factor := 1.0;
  ELSIF days_since_confirmed < 90 THEN
    decay_factor := 0.8;
  ELSIF days_since_confirmed < 180 THEN
    decay_factor := 0.5;
  ELSE
    decay_factor := 0.2;
  END IF;

  -- Apply decay to confidence
  NEW.confidence := NEW.confidence * decay_factor;

  -- Update status based on confidence
  IF NEW.confidence < 0.2 THEN
    NEW.status := 'dormant';
  ELSIF NEW.confidence < 0.4 THEN
    NEW.status := 'fading';
  ELSIF NEW.confidence < 0.6 THEN
    NEW.status := 'emerging';
  ELSIF NEW.confidence < 0.8 THEN
    NEW.status := 'possible';
  ELSE
    NEW.status := 'confirmed';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply decay trigger
CREATE TRIGGER trigger_memory_decay
  BEFORE UPDATE ON fashion_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_memory_confidence();
```

---

## 7. Analytics & Subscriptions

### 7.1 Analytics Events

```typescript
// src/modules/analytics/schema.ts
export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  eventName: varchar('event_name', { length: 100 }).notNull(),
  properties: jsonb('properties'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### 7.2 User Subscriptions

```typescript
// src/modules/subscriptions/schema.ts
export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull(), // free, pro
  displayName: varchar('display_name', { length: 100 }).notNull(),
  price: integer('price'), // cents per month
  features: jsonb('features').$type<{
    maxItems: number;
    maxGenerationsPerDay: number;
    maxSavedOutfits: number;
    storageLimitMb: number;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userSubscriptions = pgTable('user_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, {
    onDelete: 'cascade',
  }),
  planId: uuid('plan_id').notNull().references(() => plans.id),
  status: varchar('status', { length: 50 }).default('active'), // active, canceled, past_due
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### 7.3 Default Plans

```sql
-- Insert default plans
INSERT INTO plans (id, name, display_name, price, features) VALUES
(
  gen_random_uuid(),
  'free',
  'Free',
  0,
  '{
    "maxItems": 50,
    "maxGenerationsPerDay": 5,
    "maxSavedOutfits": 10,
    "storageLimitMb": 500
  }'::jsonb
),
(
  gen_random_uuid(),
  'pro',
  'Pro',
  999, -- $9.99/month
  '{
    "maxItems": -1,
    "maxGenerationsPerDay": 50,
    "maxSavedOutfits": -1,
    "storageLimitMb": 10240
  }'::jsonb
);
```

---

## 8. Indexes & Performance

### 8.1 Indexes

```typescript
// Performance indexes
export const indexes = {
  // Users
  usersClerkId: uniqueIndex('idx_users_clerk_id').on(users.clerkUserId),

  // Clothing Items
  clothingItemsUser: index('idx_clothing_items_user').on(clothingItems.userId),
  clothingItemsType: index('idx_clothing_items_type').on(
    clothingItems.userId,
    clothingItems.type
  ),
  clothingItemsStatus: index('idx_clothing_items_status').on(
    clothingItems.userId,
    clothingItems.status
  ),

  // Item Photos
  itemPhotosItem: index('idx_item_photos_item').on(itemPhotos.itemId),

  // Item Embeddings
  itemEmbeddingsUser: index('idx_item_embeddings_user').on(itemEmbeddings.userId),
  itemEmbeddingsVector: index('idx_item_embeddings_vector')
    .using('ivfflat', itemEmbeddings.embedding)
    .with({ lists: 100 }),

  // Outfits
  outfitsUser: index('idx_outfits_user').on(outfits.userId),
  outfitsSaved: index('idx_outfits_saved').on(outfits.userId, outfits.isSaved),

  // Wear Log
  wearLogUserDate: index('idx_wear_log_user_date').on(
    wearLog.userId,
    wearLog.wornAt.desc()
  ),

  // Fashion Memories
  fashionMemoriesUser: index('idx_fashion_memories_user').on(fashionMemories.userId),
  fashionMemoriesStatus: index('idx_fashion_memories_status').on(
    fashionMemories.userId,
    fashionMemories.status
  ),

  // Analytics
  analyticsEventsName: index('idx_analytics_events_name').on(analyticsEvents.eventName),
  analyticsEventsUser: index('idx_analytics_events_user').on(analyticsEvents.userId),
  analyticsEventsDate: index('idx_analytics_events_date').on(analyticsEvents.createdAt),
};
```

### 8.2 Query Optimization

```typescript
// Optimized queries

// Get user's closet with photos (single query)
async function getUserCloset(userId: string) {
  return db
    .select({
      item: clothingItems,
      photo: itemPhotos,
    })
    .from(clothingItems)
    .leftJoin(itemPhotos, and(
      eq(itemPhotos.itemId, clothingItems.id),
      eq(itemPhotos.isPrimary, true)
    ))
    .where(eq(clothingItems.userId, userId))
    .orderBy(clothingItems.createdAt.desc());
}

// Get outfit with items and photos
async function getOutfitWithItems(outfitId: string) {
  return db
    .select({
      outfit: outfits,
      item: clothingItems,
      photo: itemPhotos,
      outfitItem: outfitItems,
    })
    .from(outfits)
    .innerJoin(outfitItems, eq(outfitItems.outfitId, outfits.id))
    .innerJoin(clothingItems, eq(clothingItems.id, outfitItems.itemId))
    .leftJoin(itemPhotos, and(
      eq(itemPhotos.itemId, clothingItems.id),
      eq(itemPhotos.isPrimary, true)
    ))
    .where(eq(outfits.id, outfitId))
    .orderBy(outfitItems.position);
}
```

### 8.3 Connection Pooling

```typescript
// src/lib/db/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Production: Use connection pooling
const client = postgres(process.env.DATABASE_URL!, {
  max: 10, // Maximum connections
  idle_timeout: 20, // Close idle connections after 20s
  connect_timeout: 10, // Connection timeout
  prepare: false, // Disable prepared statements for pooling
});

// Development: Single connection
const devClient = postgres(process.env.DATABASE_URL!, {
  max: 1,
});

export const db = drizzle(
  process.env.NODE_ENV === 'production' ? client : devClient
);
```

---

## 9. Migrations

### 9.1 Migration Strategy

```
Development Workflow:
├── 1. Edit schema files
├── 2. Run: pnpm drizzle-kit generate
├── 3. Review generated SQL
├── 4. Run: pnpm drizzle-kit migrate
└── 5. Test changes

Production Workflow:
├── 1. Merge to main
├── 2. CI runs: pnpm drizzle-kit generate
├── 3. CI runs: pnpm drizzle-kit migrate
└── 4. Verify deployment
```

### 9.2 Migration Files

```
src/lib/db/migrations/
├── 0000_initial.sql
├── 0001_add_embeddings.sql
├── 0002_add_fashion_memory.sql
└── 0003_add_subscriptions.sql
```

### 9.3 Rollback Strategy

```sql
-- Each migration should have a rollback
-- 0001_add_embeddings.sql

-- Forward
CREATE TABLE item_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES clothing_items(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rollback
DROP TABLE IF EXISTS item_embeddings;
```

---

## 10. Seeding & Testing

### 10.1 Seed Data

```typescript
// src/lib/db/seed.ts
import { db } from './client';
import { users, clothingItems, plans } from './schema';

async function seed() {
  // Create test user
  const [user] = await db
    .insert(users)
    .values({
      clerkUserId: 'test_user_123',
      email: 'test@looksy.app',
      name: 'Test User',
    })
    .returning();

  // Create test items
  const testItems = [
    {
      userId: user.id,
      type: 'shirt',
      subType: 'button-down',
      colors: [{ name: 'navy', hex: '#000080', dominance: 1 }],
      seasons: ['spring', 'fall'],
      formality: 3,
    },
    // ... more test items
  ];

  await db.insert(clothingItems).values(testItems);

  console.log('Seed data created successfully');
}

seed();
```

### 10.2 Test Data Factory

```typescript
// src/lib/db/factories.ts
import { faker } from '@faker-js/faker';

export function createTestItem(overrides?: Partial<typeof clothingItems.$inferInsert>) {
  return {
    userId: faker.string.uuid(),
    type: faker.helpers.arrayElement(['shirt', 'pants', 'dress', 'jacket']),
    colors: [{ name: faker.color.human(), hex: faker.color.rgb(), dominance: 1 }],
    seasons: faker.helpers.arrayElements(['spring', 'summer', 'fall', 'winter'], { min: 1, max: 4 }),
    formality: faker.number.int({ min: 1, max: 5 }),
    ...overrides,
  };
}

export function createTestOutfit(overrides?: Partial<typeof outfits.$inferInsert>) {
  return {
    userId: faker.string.uuid(),
    name: faker.lorem.words(3),
    occasion: faker.helpers.arrayElement(['work', 'casual', 'date', 'travel']),
    explanation: faker.lorem.sentence(),
    ...overrides,
  };
}
```

### 10.3 Test Database

```typescript
// src/lib/db/test-client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Use separate test database
const testClient = postgres(process.env.TEST_DATABASE_URL!, {
  max: 1,
});

export const testDb = drizzle(testClient);
```

---

*This database schema provides a solid foundation for LOOKSY, with proper relationships, performance optimization, and migration strategy. The Drizzle ORM approach ensures type safety throughout the stack.*
