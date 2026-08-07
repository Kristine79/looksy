import type { AIProvider, RetrievalResult, SimilarItem } from "@/modules/ai/types";
import type { EmbeddingsRepository } from "@/modules/ai/repository";
import type { RecommendationContextService } from "@/modules/recommendations/contextService";

export interface RetrievalOptions {
  similarItemsLimit?: number;
  contextOptions?: {
    wardrobeLimit?: number;
    outfitsLimit?: number;
    wearLimit?: number;
    feedbackLimit?: number;
    memoriesLimit?: number;
  };
}

export class RetrievalService {
  constructor(
    private readonly provider: AIProvider,
    private readonly embeddingsRepository: EmbeddingsRepository,
    private readonly contextService: RecommendationContextService
  ) {}

  /** Full retrieval flow: query -> embedding -> similar items + user style context. */
  async retrieve(userId: string, query: string, options: RetrievalOptions = {}): Promise<RetrievalResult> {
    const [embeddingResult, context] = await Promise.all([
      this.provider.embed({ text: query }),
      this.contextService.buildUserStyleContext(userId, options.contextOptions),
    ]);

    const similarItems: SimilarItem[] = await this.embeddingsRepository.findSimilarItems(
      userId,
      embeddingResult.vector,
      options.similarItemsLimit ?? 10
    );

    return {
      userId,
      query,
      queryEmbedding: embeddingResult.vector,
      similarItems,
      context,
    };
  }
}
