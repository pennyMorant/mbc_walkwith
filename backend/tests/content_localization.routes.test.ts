import { auditLogListResponseSchema, publicLifePostSchema } from "@mbc/api-contracts";
import { afterEach, describe, expect, it, vi } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login } from "./route_test_harness.js";

describe("content localization routes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("validates the source revision and projects a current Life translation", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const created = await app.inject({ method: "POST", url: "/v1/admin/life-posts", headers: { authorization: `Bearer ${accessToken}` }, payload: { type: "announcement", title: "Prayer Night", body: "Join us for prayer.", meta: "Wednesday", visibility: "private" } });
    expect(created.statusCode).toBe(200);
    const post = created.json().data as { id: string; revision: number };
    const stale = await app.inject({ method: "PUT", url: `/v1/admin/content-localizations/life_post/${post.id}/es`, headers: { authorization: `Bearer ${accessToken}` }, payload: { sourceVersion: post.revision + 1, fields: { title: "Noche de oración" } } });
    expect(stale.statusCode).toBe(409);
    const published = await app.inject({ method: "POST", url: `/v1/admin/life-posts/${post.id}/publish`, headers: { authorization: `Bearer ${accessToken}`, "x-life-post-revision": String(post.revision) }, payload: { visibility: "public" } });
    expect(published.statusCode).toBe(200);
    const publishedPost = published.json().data as { revision: number };
    const translated = await app.inject({ method: "PUT", url: `/v1/admin/content-localizations/life_post/${post.id}/es`, headers: { authorization: `Bearer ${accessToken}` }, payload: { sourceVersion: publishedPost.revision, fields: { title: "Noche de oración", body: "Únase a nosotros para orar.", meta: "Miércoles" } } });
    expect(translated.statusCode).toBe(200);
    const publicResponse = await app.inject({ method: "GET", url: "/v1/life/posts", headers: { "accept-language": "es-MX" } });
    expect(publicResponse.statusCode).toBe(200);
    const localized = expectResponseData(publicResponse, publicLifePostSchema.array(), "localized public life posts");
    expect(localized.find((item) => item.id === post.id)).toMatchObject({ title: "Noche de oración", body: "Únase a nosotros para orar.", meta: "Miércoles" });
    await harness.close();
  });

  it("audits failed automatic translations with the shared content translation task", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const created = await app.inject({
      method: "POST",
      url: "/v1/admin/life-posts",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { type: "announcement", title: "Prayer Night", body: "Join us for prayer.", visibility: "private" }
    });
    const post = created.json().data as { id: string; revision: number };

    const response = await app.inject({
      method: "POST",
      url: `/v1/admin/content-localizations/life_post/${post.id}/es/auto-translate`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { sourceVersion: post.revision }
    });
    expect(response.statusCode).toBe(503);

    const auditResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/audit-logs?action=ai.content_translation.failed&resourceType=life_post&resourceId=${post.id}&limit=20`,
      headers: { authorization: `Bearer ${accessToken}` }
    });
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "failed automatic translation audit"
    );
    expect(audit.items[0]?.afterJson).toMatchObject({
      outcome: "failed",
      task: "content_translation",
      locale: "es",
      error: { code: "ai_provider_disabled" }
    });
    await harness.close();
  });

  it("does not consume the AI rate limit before source validation succeeds", async () => {
    const harness = await buildTestApp({ aiAdminRateLimitPerWindow: 1 });
    const { app } = harness;
    const { accessToken } = await login(app);
    const created = await app.inject({
      method: "POST",
      url: "/v1/admin/life-posts",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { type: "announcement", title: "Prayer Night", body: "Join us for prayer.", visibility: "private" }
    });
    const post = created.json().data as { id: string; revision: number };

    const stale = await app.inject({
      method: "POST",
      url: `/v1/admin/content-localizations/life_post/${post.id}/es/auto-translate`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { sourceVersion: post.revision + 1 }
    });
    expect(stale.statusCode).toBe(409);

    const providerRequest = await app.inject({
      method: "POST",
      url: `/v1/admin/content-localizations/life_post/${post.id}/es/auto-translate`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { sourceVersion: post.revision }
    });
    expect(providerRequest.statusCode).toBe(503);
    await harness.close();
  });

  it("audits every provider call made for a chunked automatic translation", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
      const request = JSON.parse(String(init.body)) as {
        messages: Array<{ content: string }>;
      };
      const fields = JSON.parse(request.messages[1]!.content) as Record<string, string>;
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(fields) } }],
          usage: { prompt_tokens: 4, completion_tokens: 5, total_tokens: 9 }
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }));
    const harness = await buildTestApp({
      aiProvider: "openai_compatible",
      aiApiKey: "test-key",
      aiBaseUrl: "https://relay.example.com/v1",
      aiModel: "test-model"
    });
    const { app } = harness;
    const { accessToken } = await login(app);
    const created = await app.inject({
      method: "POST",
      url: "/v1/admin/life-posts",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        type: "announcement",
        title: "Prayer Night",
        body: "a".repeat(6_100),
        visibility: "private"
      }
    });
    const post = created.json().data as { id: string; revision: number };

    const response = await app.inject({
      method: "POST",
      url: `/v1/admin/content-localizations/life_post/${post.id}/es/auto-translate`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { sourceVersion: post.revision }
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().data.latencyMs).toBeUndefined();

    const auditResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/audit-logs?action=ai.content_translation.generate&resourceType=life_post&resourceId=${post.id}&limit=20`,
      headers: { authorization: `Bearer ${accessToken}` }
    });
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "chunked automatic translation audits"
    );
    expect(audit.items.length).toBeGreaterThan(1);
    expect(audit.items.map((item) => item.afterJson)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          task: "content_translation",
          latencyMs: expect.any(Number),
          usage: { inputTokens: 4, outputTokens: 5, totalTokens: 9 }
        })
      ])
    );
    await harness.close();
  });
});
