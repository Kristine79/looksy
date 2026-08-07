// Outfits module — public API
export {
  outfitFeedback,
  outfitItems,
  outfits,
  wearLog,
  wearLogItems,
} from "./schema";
export type {
  EvidenceItem,
  FeedbackAction,
  FeedbackContext,
  GenerationContext,
  OutfitScores,
  OutfitSource,
  OutfitStatus,
  WeatherSnapshot,
} from "./schema";
export { OutfitsRepository } from "./repository";
export { OutfitService } from "./service";
export { FeedbackService } from "./feedbackService";
export type {
  CreateOutfitInput,
  OutfitFeedbackRow,
  OutfitGenerationContext,
  OutfitGenerationContextInput,
  OutfitItemInput,
  OutfitItemRow,
  OutfitQuery,
  OutfitRow,
  OutfitWithItems,
  RecordFeedbackInput,
  RecordSwapInput,
  RecordWearInput,
  WearLogItemRow,
  WearLogRow,
} from "./types";
