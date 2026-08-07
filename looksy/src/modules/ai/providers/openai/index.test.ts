import { describe, expect, it, vi } from "vitest";
import { OpenAIProvider } from "./index";
import { AIError, ProviderConfigurationError } from "@/modules/ai/errors";
import { getOpenAIClient, resetOpenAIClient } from "./client";
import { mapProviderError } from "./embeddings";
import { parseVisionJson } from "./vision";
import { getAIProviderConfig } from "@/modules/ai/config";

vi.mock("openai", () => ({
  default: class MockOpenAI {
    constructor(public readonly options: Record<string, unknown>) {}
  },
}));

const VECTOR = new Array(1536).fill(0.01);

const VALID_JSON = JSON.stringify({
  outfit: [{ itemId: "item-1", reason: "matches your palette" }],
  explanation: { whyChosen: "w", styleMatch: "s", contextMatch: "c" },
  confidence: 0.8,
});

function createMockClient() {
  return {
    embeddings: {
      create: vi.fn(async () => ({ data: [{ embedding: VECTOR }] })),
    },
    chat: {
      completions: {
        create: vi.fn(async () => ({
          choices: [{ message: { content: JSON.stringify({
            category: "shirt",
            subcategory: null,
            colors: [{ name: "navy", hex: "#000080", dominance: 1 }],
            material: "cotton",
            pattern: "solid",
            style: "minimal",
            season: ["spring"],
            formality: 3,
            attributes: {},
          }) } }],
        })),
      },
    },
  };
}

describe("OpenAIProvider", () => {
  it("implements the AIProvider contract (mock client, no real calls)", async () => {
    const client = createMockClient();
    const provider = new OpenAIProvider(client as never);

    const embedding = await provider.embed({ text: "navy shirt" });
    expect(embedding.vector).toHaveLength(1536);
    expect(embedding.model).toBe("text-embedding-3-small");

    const analysis = await provider.analyzeClothingImage({ imageUrl: "https://img.example/x.jpg" });
    expect(analysis.category).toBe("shirt");
    expect(analysis.confidence).toBeGreaterThan(0);
  });

  it("generateRecommendation returns raw content with the used model", async () => {
    const client = createMockClient();
    client.chat.completions.create = vi.fn(async () => ({
      choices: [{ message: { content: VALID_JSON } }],
    }));
    const provider = new OpenAIProvider(client as never);

    const result = await provider.generateRecommendation({
      systemPrompt: "system",
      userPrompt: "user",
    });
    expect(result.content).toBe(VALID_JSON);
    expect(result.model).toBe("gpt-4o");
    expect(client.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "system" },
          { role: "user", content: "user" },
        ],
      })
    );
  });

  it("generateExplanation returns raw content", async () => {
    const client = createMockClient();
    client.chat.completions.create = vi.fn(async () => ({
      choices: [{ message: { content: '{"explanation":{"whyChosen":"w","styleMatch":"s","contextMatch":"c"}}' } }],
    }));
    const provider = new OpenAIProvider(client as never);

    const result = await provider.generateExplanation({
      systemPrompt: "s",
      userPrompt: "u",
      model: "gpt-4o",
    });
    expect(result.content).toContain("explanation");
    expect(result.model).toBe("gpt-4o");
  });

  it("throws when generateOutfits is called (not implemented yet)", async () => {
    const provider = new OpenAIProvider(null);
    await expect(
      provider.generateOutfits({ userId: "u", context: {} as never })
    ).rejects.toThrow("not implemented");
  });

  it("maps provider errors to retryable AI errors", () => {
    const rateLimit = mapProviderError(
      Object.assign(new Error("rate limit"), { status: 429 }),
      "embedding"
    );
    expect(rateLimit).toBeInstanceOf(AIError);
    expect((rateLimit as unknown as { code: string }).code).toBe("PROVIDER_RATE_LIMIT");
    expect((rateLimit as unknown as { retryable: boolean }).retryable).toBe(true);
  });

  it("parses vision JSON content", () => {
    const parsed = parseVisionJson('{"category":"pants","colors":[],"season":[],"formality":2,"attributes":{}}');
    expect(parsed.category).toBe("pants");
  });
});

describe("OpenAI client configuration", () => {
  it("throws configuration error when API key is missing", () => {
    resetOpenAIClient();
    const previousKey = process.env.AI_API_KEY;
    const previousLegacyKey = process.env.OPENAI_API_KEY;
    delete process.env.AI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    expect(() => getOpenAIClient()).toThrow(ProviderConfigurationError);
    if (previousKey !== undefined) {
      process.env.AI_API_KEY = previousKey;
    }
    if (previousLegacyKey !== undefined) {
      process.env.OPENAI_API_KEY = previousLegacyKey;
    }
  });

  it("accepts AI_API_KEY with a custom base URL (OpenAI-compatible endpoint)", () => {
    resetOpenAIClient();
    const previousKey = process.env.AI_API_KEY;
    const previousBase = process.env.AI_BASE_URL;
    process.env.AI_API_KEY = "test-key";
    process.env.AI_BASE_URL = "https://opencode-go.example.com/v1";
    try {
      const client = getOpenAIClient() as unknown as {
        options: { apiKey: string; baseURL: string };
      };
      expect(client.options.apiKey).toBe("test-key");
      expect(client.options.baseURL).toBe("https://opencode-go.example.com/v1");
    } finally {
      resetOpenAIClient();
      if (previousKey !== undefined) {
        process.env.AI_API_KEY = previousKey;
      } else {
        delete process.env.AI_API_KEY;
      }
      if (previousBase !== undefined) {
        process.env.AI_BASE_URL = previousBase;
      } else {
        delete process.env.AI_BASE_URL;
      }
    }
  });
});

describe("getAIProviderConfig", () => {
  it("falls back to defaults when no env vars are set", () => {
    const config = getAIProviderConfig({});
    expect(config.apiKey).toBeUndefined();
    expect(config.baseURL).toBeUndefined();
    expect(config.generationModel).toBe("gpt-4o");
    expect(config.visionModel).toBe("gpt-4o-mini");
    expect(config.embeddingModel).toBe("text-embedding-3-small");
  });

  it("resolves all overrides from environment variables", () => {
    const config = getAIProviderConfig({
      AI_API_KEY: "key-1",
      AI_BASE_URL: "https://custom.example/v1",
      AI_MODEL: "my-model-1",
      AI_VISION_MODEL: "my-vision-1",
      AI_EMBEDDING_MODEL: "my-embedding-1",
    });
    expect(config.apiKey).toBe("key-1");
    expect(config.baseURL).toBe("https://custom.example/v1");
    expect(config.generationModel).toBe("my-model-1");
    expect(config.visionModel).toBe("my-vision-1");
    expect(config.embeddingModel).toBe("my-embedding-1");
  });

  it("prefers AI_API_KEY over the legacy OPENAI_API_KEY", () => {
    const config = getAIProviderConfig({
      AI_API_KEY: "key-ai",
      OPENAI_API_KEY: "key-legacy",
    });
    expect(config.apiKey).toBe("key-ai");
  });

  it("configures the provider instance models from env", () => {
    const provider = new OpenAIProvider(null, getAIProviderConfig({
      AI_MODEL: "custom-gen",
      AI_VISION_MODEL: "custom-vision",
      AI_EMBEDDING_MODEL: "custom-embed",
    }));
    expect(provider.model).toBe("custom-gen");
    expect(provider.visionModel).toBe("custom-vision");
    expect(provider.embeddingModel).toBe("custom-embed");
  });
});
