import type {
  outfitFeedback,
  outfitItems,
  outfits,
  wearLog,
  wearLogItems,
} from "./schema";
import type {
  EvidenceItem,
  FeedbackContext,
  GenerationContext,
  OutfitScores,
  OutfitSource,
  OutfitStatus,
  WeatherSnapshot,
} from "./schema";
import type { ClothingItemRow } from "@/modules/closet/types";

export type { OutfitScores, WeatherSnapshot, EvidenceItem } from "./schema";

export type OutfitRow = typeof outfits.$inferSelect;
export type OutfitItemRow = typeof outfitItems.$inferSelect;
export type WearLogRow = typeof wearLog.$inferSelect;
export type WearLogItemRow = typeof wearLogItems.$inferSelect;
export type OutfitFeedbackRow = typeof outfitFeedback.$inferSelect;

export interface CreateOutfitInput {
  name?: string | null;
  source?: OutfitSource;
  occasion?: string | null;
  mood?: string | null;
  weather?: WeatherSnapshot;
  explanation?: string | null;
  scores?: OutfitScores;
  evidence?: EvidenceItem[];
  generationContext?: GenerationContext;
}

export interface OutfitItemInput {
  itemId: string;
  position: number;
}

export interface OutfitQuery {
  status?: OutfitStatus;
  limit?: number;
  offset?: number;
}

export interface OutfitWithItems extends OutfitRow {
  items: Array<OutfitItemRow & { item: ClothingItemRow | null }>;
}

export interface OutfitGenerationContextInput {
  occasion?: string | null;
  mood?: string | null;
  weather?: WeatherSnapshot;
  candidatesLimit?: number;
}

export interface OutfitGenerationContext {
  request: OutfitGenerationContextInput;
  candidates: ClothingItemRow[];
  recentOutfits: OutfitRow[];
  wearHistory: WearLogRow[];
}

export interface RecordWearInput {
  outfitId?: string | null;
  itemIds: string[];
  wornAt?: Date;
  occasion?: string | null;
  weather?: WeatherSnapshot;
  source?: string;
}

export interface RecordFeedbackInput {
  outfitId?: string | null;
  itemId?: string | null;
  rating?: number | null;
  feedbackTags?: string[] | null;
  notes?: string | null;
  context?: FeedbackContext;
}

export interface RecordSwapInput extends RecordFeedbackInput {
  swapOutItemId?: string | null;
  swapInItemId?: string | null;
}
