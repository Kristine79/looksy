import { z } from "zod";
import { db } from "@/lib/db/client";
import { ClosetRepository, ClosetService } from "@/modules/closet";
import type { WardrobeItemWithPhotos } from "@/modules/closet";
import {
  ClothingAnalysisService,
  EmbeddingsRepository,
  OpenAIProvider,
  getAIProviderConfig,
} from "@/modules/ai";
import type { AnalysisOutcome } from "@/modules/ai";
import { ImageStorageService, resolvePhotoUrl } from "@/modules/storage";
import { ANALYTICS_EVENTS, emitEvent } from "@/modules/analytics";

export const IMAGE_DATA_MAX_LENGTH = 2_000_000;

export const imageDataSchema = z
  .string()
  .min(24, "imageData is missing")
  .max(IMAGE_DATA_MAX_LENGTH, "imageData exceeds 2MB — resize the image and try again")
  .refine((value) => value.startsWith("data:image/"), {
    message: "imageData must be a data:image URL",
  });

export const addToWardrobeInputSchema = z.object({
  imageData: imageDataSchema,
  notes: z.string().max(500).nullable().optional(),
});

export type AddToWardrobeInput = z.infer<typeof addToWardrobeInputSchema>;

export interface AddClothingItemResult {
  item: WardrobeItemWithPhotos;
  analysis: AnalysisOutcome;
}

function buildAnalysisService() {
  const provider = new OpenAIProvider(undefined, getAIProviderConfig());
  return new ClothingAnalysisService(provider, new ClosetRepository(db), new EmbeddingsRepository(db));
}

/**
 * Full add-to-wardrobe pipeline (application layer):
 *
 * insert item (pending) -> store photo -> vision analysis -> persist AI metadata
 * -> embedding -> final wardrobe row.
 *
 * The UI observes the steps through the returned outcome; failed analysis keeps
 * the item in the wardrobe in `failed` state so it can be retried.
 */
export async function addClothingItemWithAnalysis(
  userId: string,
  input: AddToWardrobeInput
): Promise<AddClothingItemResult> {
  const parsed = addToWardrobeInputSchema.parse(input);

  const closetRepository = new ClosetRepository(db);
  const closetService = new ClosetService(closetRepository);

  const item = await closetService.addToWardrobe(userId, {
    type: "unknown",
    subType: null,
    notes: parsed.notes ?? null,
    condition: "good",
  });

  const stored = await new ImageStorageService().store(parsed.imageData, item.id);
  const photo = await closetRepository.insertPhoto(item.id, {
    url: stored.url,
    storagePath: stored.storagePath,
    isPrimary: true,
    sortOrder: 0,
  });

  const analysis = await buildAnalysisService().analyzeClothingItem(
    userId,
    item.id,
    resolvePhotoUrl(photo)
  );

  emitEvent(userId, ANALYTICS_EVENTS.ITEM_ADDED, { itemId: item.id });
  emitEvent(
    userId,
    analysis.status === "completed"
      ? ANALYTICS_EVENTS.AI_ANALYSIS_COMPLETED
      : ANALYTICS_EVENTS.AI_ANALYSIS_FAILED,
    { itemId: item.id }
  );

  const freshItem = await closetRepository.findItemById(item.id);
  const photos = await closetRepository.findPhotosByItemIds(userId, [item.id]);
  return {
    item: { ...(freshItem ?? item), photos },
    analysis,
  };
}

/**
 * Re-runs AI analysis on an existing item (failed / needs_review states).
 */
export async function reprocessClothingAnalysis(
  userId: string,
  itemId: string
): Promise<AnalysisOutcome> {
  const closetRepository = new ClosetRepository(db);

  await new ClosetService(closetRepository).getItem(userId, itemId);
  const photos = await closetRepository.findPhotosByItemIds(userId, [itemId]);
  const primaryPhoto = photos.find((p) => p.isPrimary) ?? photos[0];
  if (!primaryPhoto) {
    throw new Error("This item has no photo to analyze");
  }

  return buildAnalysisService().analyzeClothingItem(
    userId,
    itemId,
    resolvePhotoUrl(primaryPhoto)
  );
}

/**
 * Wardrobe listing for pages: active items with photos, optional type filter.
 */
export async function getWardrobeForPage(
  userId: string,
  query: { type?: string; status?: string } = {}
): Promise<WardrobeItemWithPhotos[]> {
  return new ClosetService(new ClosetRepository(db)).getWardrobe(userId, {
    status: query.status === "all" ? undefined : ((query.status ?? "active") as "active"),
    type: query.type || undefined,
    limit: 100,
  });
}
