import type {
  fashionMemories,
  memoryEvidence,
  userStyleProfiles,
} from "./schema";
import type {
  EvidenceSourceType,
  EvidenceType,
  MemorySource,
  MemoryStatus,
  MemoryType,
} from "./schema";
import type { ClothingItemRow } from "@/modules/closet/types";
import type { OutfitRow, WearLogRow } from "@/modules/outfits/types";

export type FashionMemoryRow = typeof fashionMemories.$inferSelect;
export type MemoryEvidenceRow = typeof memoryEvidence.$inferSelect;
export type UserStyleProfileRow = typeof userStyleProfiles.$inferSelect;

export interface CreateMemoryInput {
  type: MemoryType;
  category: string;
  description: string;
  confidence?: number;
  source?: MemorySource;
  dataPoints?: number;
}

export interface EvidenceInput {
  type: EvidenceType;
  text: string;
  sourceType: EvidenceSourceType;
  sourceId?: string | null;
  data?: Record<string, unknown>;
  confidence?: number | null;
}

export interface MemoryQuery {
  status?: MemoryStatus;
  type?: MemoryType;
  limit?: number;
  offset?: number;
}

export interface MemoryWithEvidence extends FashionMemoryRow {
  evidence: MemoryEvidenceRow[];
}

export interface UserStyleContext {
  userId: string;
  wardrobe: ClothingItemRow[];
  recentOutfits: OutfitRow[];
  wearHistory: WearLogRow[];
  feedback: Array<{ action: string; rating: number | null; createdAt: Date }>;
  memories: FashionMemoryRow[];
  styleProfile: UserStyleProfileRow | null;
}
