import type OpenAI from "openai";
import { InvalidAIResponseError } from "@/modules/ai/errors";
import { mapProviderError } from "./embeddings";

export interface CompleteChatRequest {
  systemPrompt: string;
  userPrompt: string;
  model: string;
}

/**
 * Single chat-completion call. Deliberately does NOT rely on response_format
 * json_object because not every OpenAI-compatible endpoint supports it —
 * JSON shape is enforced by the prompt and validated in the service layer.
 */
export async function completeChat(
  client: OpenAI,
  request: CompleteChatRequest
): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model: request.model,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content || content.trim().length === 0) {
      throw new InvalidAIResponseError("Chat completion returned empty content");
    }
    return content;
  } catch (error) {
    throw mapProviderError(error, "chat completion");
  }
}
