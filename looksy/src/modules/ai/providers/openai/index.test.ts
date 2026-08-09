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

  it("passes the vision timeout as a per-request option", async () => {
    const client = createMockClient();
    const provider = new OpenAIProvider(client as never, getAIProviderConfig({
      AI_VISION_MODEL: "qwen3.7-plus",
      AI_VISION_TIMEOUT_MS: "90000",
    }));

    await provider.analyzeClothingImage({ imageUrl: "data:image/jpeg;base64,AAAA" });

    expect(client.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: "qwen3.7-plus" }),
      { timeout: 90000 }
    );
  });

  it("uses the default vision timeout when the env var is missing", async () => {
    const client = createMockClient();
    const provider = new OpenAIProvider(client as never, getAIProviderConfig({}));

    await provider.analyzeClothingImage({ imageUrl: "data:image/jpeg;base64,AAAA" });

    expect(client.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-4o-mini" }),
      { timeout: 60_000 }
    );
  });

  it("does not attach the vision timeout to recommendation requests", async () => {
    const client = createMockClient();
    client.chat.completions.create = vi.fn(async () => ({
      choices: [{ message: { content: VALID_JSON } }],
    }));
    const provider = new OpenAIProvider(client as never, getAIProviderConfig({
      AI_VISION_TIMEOUT_MS: "90000",
    }));

    await provider.generateRecommendation({ systemPrompt: "s", userPrompt: "u" });

    expect(client.chat.completions.create).toHaveBeenCalledTimes(1);
    const args = client.chat.completions.create.mock.calls[0] as unknown[];
    expect(args[1]).toBeUndefined();
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
    // recommendation model falls back to the general generation model
    expect(config.recommendationModel).toBe("gpt-4o");
    expect(config.visionModel).toBe("gpt-4o-mini");
    expect(config.visionTimeoutMs).toBe(60_000);
    expect(config.embeddingModel).toBe("text-embedding-3-small");
  });

  it("resolves vision timeout overrides, rejecting invalid values", () => {
    expect(getAIProviderConfig({ AI_VISION_TIMEOUT_MS: "45000" }).visionTimeoutMs).toBe(45_000);
    expect(getAIProviderConfig({ AI_VISION_TIMEOUT_MS: "bogus" }).visionTimeoutMs).toBe(60_000);
    expect(getAIProviderConfig({ AI_VISION_TIMEOUT_MS: "0" }).visionTimeoutMs).toBe(60_000);
  });

  it("resolves all overrides from environment variables", () => {
    const config = getAIProviderConfig({
      AI_API_KEY: "key-1",
      AI_BASE_URL: "https://custom.example/v1",
      AI_MODEL: "my-model-1",
      AI_RECOMMENDATION_MODEL: "my-rec-model",
      AI_VISION_MODEL: "my-vision-1",
      AI_EMBEDDING_MODEL: "my-embedding-1",
    });
    expect(config.apiKey).toBe("key-1");
    expect(config.baseURL).toBe("https://custom.example/v1");
    expect(config.generationModel).toBe("my-model-1");
    expect(config.recommendationModel).toBe("my-rec-model");
    expect(config.visionModel).toBe("my-vision-1");
    expect(config.embeddingModel).toBe("my-embedding-1");
  });

  it("falls back to AI_MODEL for the recommendation model when unset", () => {
    const config = getAIProviderConfig({ AI_MODEL: "deepseek-v4-flash" });
    expect(config.generationModel).toBe("deepseek-v4-flash");
    expect(config.recommendationModel).toBe("deepseek-v4-flash");
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
      AI_RECOMMENDATION_MODEL: "custom-rec",
      AI_VISION_MODEL: "custom-vision",
      AI_EMBEDDING_MODEL: "custom-embed",
    }));
    expect(provider.model).toBe("custom-gen");
    expect(provider.recommendationModel).toBe("custom-rec");
    expect(provider.visionModel).toBe("custom-vision");
    expect(provider.embeddingModel).toBe("custom-embed");
  });

  it("generateRecommendation uses the recommendation model, not the general one", async () => {
    const client = createMockClient();
    client.chat.completions.create = vi.fn(async () => ({
      choices: [{ message: { content: VALID_JSON } }],
    }));
    const provider = new OpenAIProvider(client as never, getAIProviderConfig({
      AI_MODEL: "deepseek-v4-flash",
      AI_RECOMMENDATION_MODEL: "gpt-5.6-luna",
    }));

    const result = await provider.generateRecommendation({
      systemPrompt: "system",
      userPrompt: "user",
    });

    expect(result.model).toBe("gpt-5.6-luna");
    expect(client.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt-5.6-luna" })
    );
  });

  it("uses Jina embeddings when configured — no deterministic fallback on success", async () => {
    const jinaVector = new Array(1536).fill(0.02);
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({ model: "jina-embeddings-v4", data: [{ embedding: jinaVector }] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const provider = new OpenAIProvider(null, getAIProviderConfig({
      JINA_API_KEY: "jina-key",
    }));

    const result = await provider.embed({ text: "navy shirt" });
    expect(result.model).toBe("jina-embeddings-v4");
    expect(result.dimensions).toBe(1536);
    expect(result.vector).toEqual(jinaVector);
    expect(fetchMock).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it("falls back to the deterministic embedding when Jina fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("upstream down", { status: 503 }))
    );

    const provider = new OpenAIProvider(null, getAIProviderConfig({
      JINA_API_KEY: "jina-key",
    }));

    const result = await provider.embed({ text: "navy shirt" });
    expect(result.model).toBe("deterministic-fallback-v1");
    expect(result.vector).toHaveLength(1536);
    expect(result.vector.every((v) => Number.isFinite(v))).toBe(true);
    vi.unstubAllGlobals();
  });

  it("keeps the legacy embeddings path when Jina is not configured", async () => {
    const client = createMockClient();
    const provider = new OpenAIProvider(client as never, getAIProviderConfig({}));

    const result = await provider.embed({ text: "navy shirt" });
    expect(result.model).toBe("text-embedding-3-small");
    expect(client.embeddings.create).toHaveBeenCalledOnce();
  });
});

describe("getAIProviderConfig — Jina embedding provider", () => {
  it("resolves Jina config from JINA_API_KEY", () => {
    const config = getAIProviderConfig({ JINA_API_KEY: "key-jina" });
    expect(config.jinaEmbedding).toEqual({
      apiKey: "key-jina",
      baseURL: "https://api.jina.ai/v1",
      model: "jina-embeddings-v4",
    });
  });

  it("accepts JINA_AI_KEY as an alias for the Jina API key", () => {
    const config = getAIProviderConfig({ JINA_AI_KEY: "key-alias" });
    expect(config.jinaEmbedding?.apiKey).toBe("key-alias");
  });

  it("prefers JINA_API_KEY over JINA_AI_KEY", () => {
    const config = getAIProviderConfig({ JINA_API_KEY: "key-primary", JINA_AI_KEY: "key-alias" });
    expect(config.jinaEmbedding?.apiKey).toBe("key-primary");
  });

  it("honours JINA_BASE_URL and JINA_EMBEDDING_MODEL overrides", () => {
    const config = getAIProviderConfig({
      JINA_API_KEY: "key",
      JINA_BASE_URL: "https://custom.example/v1/",
      JINA_EMBEDDING_MODEL: "jina-embeddings-v3",
    });
    expect(config.jinaEmbedding).toEqual({
      apiKey: "key",
      baseURL: "https://custom.example/v1/",
      model: "jina-embeddings-v3",
    });
  });

  it("sets jinaEmbedding to null when no Jina key is present", () => {
    const config = getAIProviderConfig({});
    expect(config.jinaEmbedding).toBeNull();
  });
});
