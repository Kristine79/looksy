import { db } from "@/lib/db/client";
import { ClosetRepository } from "@/modules/closet";
import type { AddToWardrobeInput } from "@/modules/closet";
import { EmbeddingsRepository } from "@/modules/ai";
import { OutfitsRepository, OutfitService } from "@/modules/outfits";
import { MemoriesRepository } from "@/modules/recommendations";
import { UsersRepository } from "@/modules/users";
import { ANALYTICS_EVENTS, emitEvent } from "@/modules/analytics";
import { logger } from "@/lib/logger";
import {
  DEMO_ITEMS,
  DEMO_MEMORIES,
  DEMO_OUTFITS,
  EMBEDDING_DIMENSIONS,
  demoPhoto,
  makeDemoVector,
} from "./data";

export interface LoadDemoResult {
  status: "loaded" | "skipped";
  itemCount: number;
  outfitCount: number;
  memoryCount: number;
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

/**
 * Loads the demo wardrobe for a user. Idempotent: if the user already has any
 * active items the call is a no-op (never duplicates or overwrites user data).
 *
 * Runs in a single transaction — a failure midway rolls back everything, so
 * the account never ends up with partial demo data and can always retry.
 *
 * Pure demo path — no AI provider calls: photos are local SVG data URLs and
 * embeddings are deterministic vectors, so the whole flow works offline.
 */
export async function loadDemoContent(userId: string): Promise<LoadDemoResult> {
  return db.transaction(async (tx) => {
    const closetRepository = new ClosetRepository(tx);

    const existing = await closetRepository.findItems(userId, {
      status: "active",
      limit: 1,
    });
    if (existing.length > 0) {
      return {
        status: "skipped",
        itemCount: 0,
        outfitCount: 0,
        memoryCount: 0,
      };
    }

    const embeddingsRepository = new EmbeddingsRepository(tx);
    const itemIds: string[] = [];

    for (const [index, def] of DEMO_ITEMS.entries()) {
      const input: AddToWardrobeInput = {
        type: def.type,
        subType: def.subType,
        notes: def.notes,
        condition: "good",
      };
      const item = await closetRepository.insertItem(userId, input);

      await closetRepository.updateAiMetadata(item.id, {
        type: def.type,
        subType: def.subType,
        material: def.material,
        pattern: def.pattern,
        colors: def.colors,
        seasons: def.seasons,
        formality: def.formality,
        aiStatus: "completed",
        aiConfidence: 0.9,
        aiModelVersion: "demo-v1",
        aiProcessedAt: new Date(),
        metadata: { style: ["minimal"], demo: true },
      });

      await closetRepository.insertPhoto(item.id, {
        url: demoPhoto(def.hex),
        thumbnailUrl: null,
        storagePath: null,
        isPrimary: true,
        sortOrder: 0,
      });

      await embeddingsRepository.upsertItemEmbedding({
        itemId: item.id,
        userId,
        embedding: makeDemoVector(index),
        textRepr: `${def.type} ${def.subType ?? ""}`.trim(),
        model: "demo-v1",
        dimension: EMBEDDING_DIMENSIONS,
      });

      itemIds.push(item.id);
    }

    const outfitService = new OutfitService(new OutfitsRepository(tx));
    const outfitsRepository = new OutfitsRepository(tx);
    let outfitCount = 0;

    for (const def of DEMO_OUTFITS) {
      const outfit = await outfitService.createOutfit(
        userId,
        {
          name: def.name,
          source: "ai",
          occasion: def.occasion,
          explanation: def.explanation,
          scores: { total: 0.85 },
          evidence: def.evidence.map((entry) => ({
            type: entry.type,
            text: entry.text,
            source: "style_context",
            confidence: 0.9,
          })),
          generationContext: {
            candidatesCount: def.itemIndexes.length,
            model: "demo-v1",
            promptVersion: "demo",
          },
        },
        def.itemIndexes.map((itemIndex, position) => ({
          itemId: itemIds[itemIndex]!,
          position,
        })),
      );
      outfitCount += 1;

      await outfitsRepository.insertWearLog(userId, {
        outfitId: outfit.id,
        itemIds: def.itemIndexes.map((itemIndex) => itemIds[itemIndex]!),
        wornAt: daysAgo(4),
        source: "demo",
      });
    }

    const memoriesRepository = new MemoriesRepository(tx);
    let memoryCount = 0;

    for (const def of DEMO_MEMORIES) {
      const memory = await memoriesRepository.insertMemory(userId, {
        type: def.type,
        category: def.category,
        description: def.description,
        confidence: def.confidence,
        dataPoints: def.dataPoints,
        source: def.source,
      });
      await memoriesRepository.updateMemory(memory.id, {
        status: def.confirmed ? "confirmed" : "possible",
        consistency: def.consistency,
        userConfirmedAt: def.confirmed ? new Date() : null,
        lastSignalAt: new Date(),
      });
      for (const entry of def.evidence) {
        await memoriesRepository.insertEvidence(memory.id, {
          type: entry.type,
          text: entry.text,
          sourceType: entry.sourceType,
          confidence: 0.9,
        });
      }
      memoryCount += 1;
    }

    emitEvent(userId, ANALYTICS_EVENTS.DEMO_CONTENT_LOADED, {
      itemCount: itemIds.length,
      outfitCount,
      memoryCount,
    });
    logger.info("demo_content_loaded", {
      userId,
      itemCount: itemIds.length,
      outfitCount,
      memoryCount,
    });

    return {
      status: "loaded",
      itemCount: itemIds.length,
      outfitCount,
      memoryCount,
    };
  });
}

/** Convenience guard: true when this userId is the seeded demo identity. */
export async function isDemoIdentity(userId: string): Promise<boolean> {
  const demoUser = await new UsersRepository(db).findByClerkId("demo_user");
  return demoUser?.id === userId;
}
