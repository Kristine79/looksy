import type OpenAI from "openai";
import { getOpenAIClient } from "./client";
import { createEmbedding } from "./embeddings";
import { analyzeClothingImage } from "./vision";
import { completeChat } from "./chat";
import { getAIProviderConfig } from "@/modules/ai/config";
import type { JinaEmbeddingConfig } from "@/modules/ai/config";
import type {
  AIProvider,
  ClothingAnalysisRequest,
  ClothingAnalysisWithConfidence,
  EmbedRequest,
  EmbeddingResult,
  GenerateExplanationRequest,
  GenerateOutfitsRequest,
  GenerateRecommendationRequest,
  GeneratedOutfit,
  GeneratedText,
} from "@/modules/ai/types";

export class OpenAIProvider implements AIProvider {
  readonly model: string;
  readonly embeddingModel: string;
  readonly visionModel: string;
  private readonly jinaEmbedding: JinaEmbeddingConfig | null;

  constructor(
    private readonly client: OpenAI | null = null,
    config: ReturnType<typeof getAIProviderConfig> = getAIProviderConfig()
  ) {
    this.model = config.generationModel;
    this.embeddingModel = config.embeddingModel;
    this.visionModel = config.visionModel;
    this.jinaEmbedding = config.jinaEmbedding;
  }

  private getClient(): OpenAI {
    return this.client ?? getOpenAIClient();
  }

  async embed(request: EmbedRequest): Promise<EmbeddingResult> {
    if (this.jinaEmbedding) {
      return createEmbedding(null, request, this.jinaEmbedding);
    }
    return createEmbedding(this.getClient(), request, null);
  }

  async analyzeClothingImage(
    request: ClothingAnalysisRequest
  ): Promise<ClothingAnalysisWithConfidence> {
    return analyzeClothingImage(this.getClient(), {
      ...request,
      model: request.model ?? this.visionModel,
    });
  }

  async generateRecommendation(request: GenerateRecommendationRequest): Promise<GeneratedText> {
    return this.generateText(request);
  }

  async generateExplanation(request: GenerateExplanationRequest): Promise<GeneratedText> {
    return this.generateText(request);
  }

  private async generateText(request: GenerateRecommendationRequest): Promise<GeneratedText> {
    const model = request.model ?? this.model;
    const content = await completeChat(this.getClient(), {
      systemPrompt: request.systemPrompt,
      userPrompt: request.userPrompt,
      model,
    });
    return { content, model };
  }

  async generateOutfits(_request: GenerateOutfitsRequest): Promise<GeneratedOutfit[]> {
    throw new Error("generateOutfits is not implemented yet (Phase 6)");
  }
}
