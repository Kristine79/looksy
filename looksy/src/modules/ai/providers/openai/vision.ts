import type OpenAI from "openai";
import { InvalidAIResponseError } from "@/modules/ai/errors";
import { VISION_MODEL } from "@/modules/ai/types";
import type {
  ClothingAnalysisRequest,
  ClothingAnalysisResult,
  ClothingAnalysisWithConfidence,
} from "@/modules/ai/types";

const VISION_SYSTEM_PROMPT = `You are a fashion analyst. Given a photo of a single clothing item,
return a strict JSON object with exactly these fields:
{
  "category": string (one of: shirt, tshirt, pants, jeans, shorts, dress, skirt, jacket, coat, sweater, hoodie, cardigan, blazer, suit, shoes, sneakers, boots, sandals, hat, cap, scarf, gloves, belt, bag, other),
  "subcategory": string | null (e.g. "button-down", "slim-fit", "crew-neck"),
  "colors": [{ "name": string (e.g. "navy"), "hex": string (e.g. "#000080"), "dominance": number 0-1 }],
  "material": string | null (e.g. "cotton", "denim", "wool"),
  "pattern": string | null (e.g. "solid", "striped", "plaid", "floral"),
  "style": string | null (e.g. "minimal", "streetwear", "classic"),
  "season": string[] (subset of: spring, summer, fall, winter),
  "formality": number 1-5 (1 = very casual, 5 = very formal),
  "attributes": object (optional details like fit, silhouette, length, neckline, sleeve_length)
}
Do not add any text outside the JSON object.`;

export async function analyzeClothingImage(
  client: OpenAI,
  request: ClothingAnalysisRequest
): Promise<ClothingAnalysisWithConfidence> {
  const model = request.model ?? VISION_MODEL;

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: VISION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: request.imageUrl },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new InvalidAIResponseError("Vision model returned empty content");
    }

    const parsed = parseVisionJson(content);
    return {
      ...parsed,
      confidence: 0.95,
      model,
    };
  } catch (error) {
    if (error instanceof InvalidAIResponseError) {
      throw error;
    }
    throw new InvalidAIResponseError(
      `Vision analysis failed: ${error instanceof Error ? error.message : "unknown error"}`
    );
  }
}

export function parseVisionJson(content: string): ClothingAnalysisResult {
  try {
    return JSON.parse(content) as ClothingAnalysisResult;
  } catch {
    throw new InvalidAIResponseError("Vision model returned invalid JSON");
  }
}
