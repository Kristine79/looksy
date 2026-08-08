import { afterEach, describe, expect, it, vi } from "vitest";
import { createJinaEmbedding } from "./embeddings";
import {
  InvalidAIResponseError,
  ProviderRateLimitError,
  ProviderTimeoutError,
} from "@/modules/ai/errors";
import { EMBEDDING_DIMENSIONS } from "@/modules/ai/schema";
import type { JinaEmbeddingConfig } from "@/modules/ai/config";

const CONFIG: JinaEmbeddingConfig = {
  apiKey: "jina-test-key",
  baseURL: "https://api.jina.ai/v1",
  model: "jina-embeddings-v4",
};

const VECTOR = new Array(EMBEDDING_DIMENSIONS).fill(0.01);

function mockFetchOk() {
  return vi.fn(
    async (_url: string, _init?: RequestInit) =>
      new Response(
        JSON.stringify({ model: "jina-embeddings-v4", data: [{ embedding: VECTOR }] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createJinaEmbedding", () => {
  it("returns a validated 1536-dim finite vector for the configured model", async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    const result = await createJinaEmbedding({ text: "navy cotton shirt" }, CONFIG);

    expect(result.model).toBe("jina-embeddings-v4");
    expect(result.dimensions).toBe(EMBEDDING_DIMENSIONS);
    expect(result.vector).toHaveLength(EMBEDDING_DIMENSIONS);
    expect(result.vector.every((v) => Number.isFinite(v))).toBe(true);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.jina.ai/v1/embeddings");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer jina-test-key");
    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("jina-embeddings-v4");
    expect(body.input).toBe("navy cotton shirt");
    expect(body.dimensions).toBe(EMBEDDING_DIMENSIONS);
  });

  it("honours a per-request model override", async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    await createJinaEmbedding({ text: "t", model: "custom-model" }, CONFIG);

    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.model).toBe("custom-model");
  });

  it("rejects a vector with the wrong dimension", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ data: [{ embedding: new Array(1024).fill(0) }] }), { status: 200 })
      )
    );

    await expect(createJinaEmbedding({ text: "t" }, CONFIG)).rejects.toThrow(
      InvalidAIResponseError
    );
  });

  it("rejects a vector containing non-finite values", async () => {
    const bad = new Array(EMBEDDING_DIMENSIONS).fill(0.01);
    bad[5] = Number.NaN;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ data: [{ embedding: bad }] }), { status: 200 })
      )
    );

    await expect(createJinaEmbedding({ text: "t" }, CONFIG)).rejects.toThrow(
      InvalidAIResponseError
    );
  });

  it("rejects a response without vector data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ data: [] }), { status: 200 }))
    );

    await expect(createJinaEmbedding({ text: "t" }, CONFIG)).rejects.toThrow(
      InvalidAIResponseError
    );
  });

  it("maps 429 to ProviderRateLimitError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("rate limited", { status: 429 }))
    );

    await expect(createJinaEmbedding({ text: "t" }, CONFIG)).rejects.toThrow(
      ProviderRateLimitError
    );
  });

  it("throws InvalidAIResponseError on 5xx", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 502 }))
    );

    await expect(createJinaEmbedding({ text: "t" }, CONFIG)).rejects.toThrow(
      InvalidAIResponseError
    );
  });

  it("maps network/timeout failures to ProviderTimeoutError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("fetch failed");
      })
    );

    await expect(createJinaEmbedding({ text: "t" }, CONFIG)).rejects.toThrow(
      ProviderTimeoutError
    );
  });

  it("strips trailing slashes from the base URL", async () => {
    const fetchMock = mockFetchOk();
    vi.stubGlobal("fetch", fetchMock);

    await createJinaEmbedding({ text: "t" }, { ...CONFIG, baseURL: "https://api.jina.ai/v1/" });

    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://api.jina.ai/v1/embeddings");
  });
});
