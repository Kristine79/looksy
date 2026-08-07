// Closet module — public API
export { clothingItems, itemPhotos } from "./schema";
export type {
  ClothingItemStatus,
  Color,
  ItemMetadata,
  AiStatus,
} from "./schema";
export { ClosetRepository } from "./repository";
export { ClosetService } from "./service";
export type {
  AddToWardrobeInput,
  ClothingItemRow,
  ItemPhotoRow,
  UpdateClothingMetadataInput,
  WardrobeItemWithPhotos,
  WardrobeQuery,
} from "./types";
