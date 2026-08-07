import type { clothingItems, itemPhotos } from "./schema";
import type {
  ClothingItemStatus,
  Color,
  ItemMetadata,
} from "./schema";

export type ClothingItemRow = typeof clothingItems.$inferSelect;
export type ItemPhotoRow = typeof itemPhotos.$inferSelect;

export type AddToWardrobeInput = {
  type: string;
  subType?: string | null;
  brand?: string | null;
  material?: string | null;
  pattern?: string | null;
  colors?: Color[];
  seasons?: string[];
  formality?: number;
  condition?: string;
  notes?: string | null;
  metadata?: ItemMetadata;
};

export type UpdateClothingMetadataInput = {
  brand?: string | null;
  material?: string | null;
  pattern?: string | null;
  colors?: Color[];
  seasons?: string[];
  formality?: number;
  condition?: string;
  notes?: string | null;
  metadata?: ItemMetadata;
};

export interface WardrobeQuery {
  status?: ClothingItemStatus;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface WardrobeItemWithPhotos extends ClothingItemRow {
  photos: ItemPhotoRow[];
}
