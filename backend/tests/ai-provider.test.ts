import { afterEach, describe, expect, it, vi } from "vitest";

import { GeminiAiProvider } from "../src/modules/ai/gemini-ai.provider.js";
import { OpenAiCompatibleAiProvider } from "../src/modules/ai/openai-compatible-ai.provider.js";

const input = {
  systemPrompt: "system",
  userPrompt: "user"
};

describe("AI provider adapters", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not expose upstream provider error bodies to API errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("secret upstream body", { status: 500 }))
    );
    const provider = openAiProvider();

    const error = await captureError(() => provider.generateText(input));

    expect(error).toMatchObject({
      code: "ai_provider_request_failed",
      statusCode: 502,
      evidence: {
        provider: "openai",
        providerStatusCode: 500
      }
    });
    expect(error.evidence.details).toBeUndefined();
  });

  it("maps aborted provider calls to a timeout error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        })
      )
    );
    const provider = openAiProvider({ timeoutMs: 1 });

    const error = await captureError(() => provider.generateText(input));

    expect(error).toMatchObject({
      code: "ai_provider_timeout",
      statusCode: 504,
      evidence: {
        provider: "openai",
        timeoutMs: 1
      }
    });
  });

  it("maps network failures to retryable provider errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("connect ECONNREFUSED secret-host");
      })
    );
    const provider = openAiProvider();

    const error = await captureError(() => provider.generateText(input));

    expect(error).toMatchObject({
      code: "ai_provider_network_failed",
      statusCode: 502,
      retryable: true,
      evidence: {
        provider: "openai"
      }
    });
  });

  it("maps invalid OpenAI-compatible JSON responses to provider response errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not-json", { status: 200 }))
    );
    const provider = openAiProvider();

    const error = await captureError(() => provider.generateText(input));

    expect(error).toMatchObject({
      code: "ai_provider_response_invalid",
      statusCode: 502,
      retryable: true,
      evidence: {
        provider: "openai"
      }
    });
  });

  it("maps invalid Gemini JSON responses to provider response errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("not-json", { status: 200 }))
    );
    const provider = new GeminiAiProvider({
      apiKey: "test-key",
      baseUrl: "https://generativelanguage.example.com/v1beta",
      model: "test-gemini",
      timeoutMs: 30000,
      maxOutputTokens: 1200
    });

    const error = await captureError(() => provider.generateText(input));

    expect(error).toMatchObject({
      code: "ai_provider_response_invalid",
      statusCode: 502,
      retryable: true,
      evidence: {
        provider: "gemini"
      }
    });
  });

  it("rejects malformed OpenAI-compatible usage instead of trusting JSON types", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              choices: [{ message: { content: "Valid text" } }],
              usage: { prompt_tokens: "secret-not-a-number" }
            }),
            { status: 200 }
          )
      )
    );

    const error = await captureError(() => openAiProvider().generateText(input));

    expect(error).toMatchObject({
      code: "ai_provider_response_invalid",
      statusCode: 502,
      evidence: { provider: "openai" }
    });
  });

  it("rejects negative Gemini usage counts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              candidates: [{ content: { parts: [{ text: "Valid text" }] } }],
              usageMetadata: { promptTokenCount: -1 }
            }),
            { status: 200 }
          )
      )
    );
    const provider = new GeminiAiProvider({
      apiKey: "test-key",
      baseUrl: "https://generativelanguage.example.com/v1beta",
      model: "test-gemini",
      timeoutMs: 30000,
      maxOutputTokens: 1200
    });

    const error = await captureError(() => provider.generateText(input));

    expect(error).toMatchObject({
      code: "ai_provider_response_invalid",
      statusCode: 502,
      evidence: { provider: "gemini" }
    });
  });
});

function openAiProvider(options: { timeoutMs?: number } = {}) {
  return new OpenAiCompatibleAiProvider({
    id: "openai",
    apiKey: "test-key",
    baseUrl: "https://ai.example.com/v1",
    model: "test-model",
    timeoutMs: options.timeoutMs ?? 30000,
    maxOutputTokens: 1200
  });
}

async function captureError(run: () => Promise<unknown>) {
  try {
    await run();
  } catch (error) {
    return error as {
      code: string;
      statusCode: number;
      retryable: boolean;
      evidence: Record<string, unknown>;
    };
  }
  throw new Error("Expected call to throw.");
}
