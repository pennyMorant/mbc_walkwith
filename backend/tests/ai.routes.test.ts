import {
  aiDraftResponseSchema,
  aiManagementOverviewSchema,
  aiStatusResponseSchema,
  auditLogListResponseSchema
} from "@mbc/api-contracts";
import { afterEach, describe, expect, it, vi } from "vitest";

import { expectResponseData } from "./contract_assertions.js";
import { buildTestApp, login, loginMember } from "./route_test_harness.js";

describe("AI routes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns admin AI provider status", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const response = await app.inject({
      method: "GET",
      url: "/v1/admin/ai/status",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });

    expect(response.statusCode).toBe(200);
    const status = expectResponseData(
      response,
      aiStatusResponseSchema,
      "admin AI status"
    );
    expect(status).toMatchObject({
      enabled: false,
      provider: "disabled",
      model: null,
      auditEnabled: true
    });
    expect(status.supportedAdminTasks).toContain("sermon_summary");
    await harness.close();
  });

  it("returns a structured provider-disabled error for admin drafts", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);

    const response = await app.inject({
      method: "POST",
      url: "/v1/admin/ai/drafts",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        task: "life_post_draft",
        locale: "zh-Hans",
        input: {
          title: "主日聚餐",
          body: "请帮我写一段活动公告。"
        },
        resource: {
          resourceType: "life_post",
          resourceId: "life-1"
        }
      }
    });

    expect(response.statusCode).toBe(503);
    expect(response.json().error).toMatchObject({
      code: "ai_provider_disabled",
      category: "provider_disabled",
      sourceLayer: "capability",
      nextAction: "configure_provider"
    });

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?action=ai.admin_draft.failed&resourceType=life_post&resourceId=life-1&limit=20",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(auditResponse.statusCode).toBe(200);
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "failed admin AI draft audit"
    );
    expect(audit.items[0]).toMatchObject({
      action: "ai.admin_draft.failed",
      resourceType: "life_post",
      resourceId: "life-1",
      afterJson: {
        outcome: "failed",
        task: "life_post_draft",
        provider: "disabled",
        error: {
          code: "ai_provider_disabled",
          sourceLayer: "capability",
          retryable: false
        },
        input: {
          hasTitle: true,
          bodyLength: 11
        }
      }
    });
    expect(JSON.stringify(audit.items[0]?.afterJson)).not.toContain(
      "请帮我写一段活动公告。"
    );
    await harness.close();
  });

  it("audits failed Life notification translation requests", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken } = await login(app);
    const postResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/life-posts",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        type: "announcement",
        title: "Translation audit post",
        body: "",
        visibility: "private"
      }
    });
    expect(postResponse.statusCode).toBe(200);
    const postId = postResponse.json().data.id as string;

    const response = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${postId}/notification-translation`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        targetLocale: "es",
        title: "Sunday gathering",
        body: "Join us this week."
      }
    });
    expect(response.statusCode).toBe(503);

    const auditResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/audit-logs?action=ai.content_translation.failed&resourceType=life_post_notification&resourceId=${postId}&limit=20`,
      headers: { authorization: `Bearer ${accessToken}` }
    });
    expect(auditResponse.statusCode).toBe(200);
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "failed Life notification translation audit"
    );
    expect(audit.items[0]?.afterJson).toMatchObject({
      outcome: "failed",
      task: "content_translation",
      locale: "es",
      error: { code: "ai_provider_disabled" }
    });
    await harness.close();
  });

  it("records successful and rate-limited notification translations against the Life post", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ title: "Reunión dominical", body: "Acompáñenos esta semana." }) } }],
          usage: { prompt_tokens: 4, completion_tokens: 5, total_tokens: 9 }
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    const harness = await buildTestApp({
      aiProvider: "openai_compatible",
      aiApiKey: "test-key",
      aiBaseUrl: "https://relay.example.com/v1",
      aiModel: "test-model",
      aiAdminRateLimitPerWindow: 1
    });
    const { app } = harness;
    const { accessToken } = await login(app);
    const postResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/life-posts",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { type: "announcement", title: "Sunday", body: "Join us this week.", visibility: "private" }
    });
    const postId = postResponse.json().data.id as string;
    const payload = {
      targetLocale: "es",
      title: "Sunday gathering",
      body: "Join us this week."
    };

    const firstResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${postId}/notification-translation`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload
    });
    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.json().data).toEqual({
      title: "Reunión dominical",
      body: "Acompáñenos esta semana."
    });

    const secondResponse = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${postId}/notification-translation`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload
    });
    expect(secondResponse.statusCode).toBe(429);

    const auditsResponse = await app.inject({
      method: "GET",
      url: `/v1/admin/audit-logs?resourceType=life_post_notification&resourceId=${postId}&limit=20`,
      headers: { authorization: `Bearer ${accessToken}` }
    });
    const audits = expectResponseData(
      auditsResponse,
      auditLogListResponseSchema,
      "Life notification translation audits"
    );
    expect(audits.items.map((item) => item.action)).toEqual(
      expect.arrayContaining([
        "ai.content_translation.generate"
      ])
    );
    expect(audits.items.map((item) => item.action)).not.toContain(
      "ai.content_translation.failed"
    );
    expect(JSON.stringify(audits.items)).not.toContain("Join us this week.");

    const managementResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/ai/management",
      headers: { authorization: `Bearer ${accessToken}` }
    });
    expect(managementResponse.statusCode).toBe(200);
    const management = expectResponseData(
      managementResponse,
      aiManagementOverviewSchema,
      "AI management usage"
    );
    expect(management.usage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          task: "content_translation",
          resourceType: "life_post_notification",
          resourceId: postId,
          status: "succeeded",
          inputTokens: 4,
          outputTokens: 5,
          totalTokens: 9,
          latencyMs: expect.any(Number)
        })
      ])
    );
    expect(management.monthTokens).toBe(9);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await harness.close();
  });

  it("uses the content translation policy for a shared provider", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ title: "Reunión dominical" }) } }],
          usage: { prompt_tokens: 4, completion_tokens: 5, total_tokens: 9 }
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    const harness = await buildTestApp({
      aiProvider: "openai_compatible",
      aiApiKey: "test-key",
      aiBaseUrl: "https://relay.example.com/v1",
      aiModel: "default-model"
    });
    const { app } = harness;
    const { accessToken } = await login(app);
    const managementResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/ai/management",
      headers: { authorization: `Bearer ${accessToken}` }
    });
    const management = expectResponseData(
      managementResponse,
      aiManagementOverviewSchema,
      "AI management policy"
    );
    const translationPolicy = management.policies.find(
      (policy) => policy.capability === "content_translation"
    );
    expect(translationPolicy).toBeDefined();

    const updatedPolicy = await app.inject({
      method: "PUT",
      url: "/v1/admin/ai/policies/content_translation",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        ...translationPolicy,
        model: "translation-model",
        maxOutputTokens: 77,
        timeoutMs: 30_000
      }
    });
    expect(updatedPolicy.statusCode).toBe(200);

    const created = await app.inject({
      method: "POST",
      url: "/v1/admin/life-posts",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { type: "announcement", title: "Sunday", body: "", visibility: "private" }
    });
    const postId = created.json().data.id as string;
    const response = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${postId}/notification-translation`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { targetLocale: "es", title: "Sunday gathering" }
    });
    expect(response.statusCode).toBe(200);
    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(requestBody).toMatchObject({
      model: "translation-model",
      max_tokens: 77
    });
    await harness.close();
  });

  it("reserves token quota for the actual admin draft input length", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Generated draft." } }],
          usage: { prompt_tokens: 4, completion_tokens: 5, total_tokens: 9 }
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    const harness = await buildTestApp({
      aiProvider: "openai_compatible",
      aiApiKey: "test-key",
      aiBaseUrl: "https://relay.example.com/v1",
      aiModel: "test-model",
      aiAdminRateLimitPerWindow: 1
    });
    const { app } = harness;
    const { accessToken } = await login(app);
    const managementResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/ai/management",
      headers: { authorization: `Bearer ${accessToken}` }
    });
    const management = expectResponseData(
      managementResponse,
      aiManagementOverviewSchema,
      "AI management token quota"
    );
    const draftPolicy = management.policies.find(
      (policy) => policy.capability === "admin_drafts"
    );
    expect(draftPolicy).toBeDefined();
    const policyResponse = await app.inject({
      method: "PUT",
      url: "/v1/admin/ai/policies/admin_drafts",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { ...draftPolicy, maxOutputTokens: 100 }
    });
    expect(policyResponse.statusCode).toBe(200);
    const budgetResponse = await app.inject({
      method: "PUT",
      url: "/v1/admin/ai/budget",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { dailyTokenLimit: 2_000, monthlyTokenLimit: null }
    });
    expect(budgetResponse.statusCode).toBe(200);

    const response = await app.inject({
      method: "POST",
      url: "/v1/admin/ai/drafts",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        task: "life_post_draft",
        locale: "en",
        input: { body: "a".repeat(12_000), context: [] }
      }
    });
    expect(response.statusCode).toBe(429);
    expect(response.json().error.code).toBe("ai_token_quota_exceeded");
    expect(fetchMock).not.toHaveBeenCalled();

    const disabledQuota = await app.inject({
      method: "PUT",
      url: "/v1/admin/ai/budget",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { dailyTokenLimit: null, monthlyTokenLimit: null }
    });
    expect(disabledQuota.statusCode).toBe(200);
    const retry = await app.inject({
      method: "POST",
      url: "/v1/admin/ai/drafts",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        task: "life_post_draft",
        locale: "en",
        input: { body: "Short draft.", context: [] }
      }
    });
    expect(retry.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await harness.close();
  });

  it("does not generate notification translations after a Life post is published", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
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
      payload: { type: "announcement", title: "Sunday", body: "Join us this week.", visibility: "private" }
    });
    const post = created.json().data as { id: string; revision: number };
    const published = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${post.id}/publish`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "x-life-post-revision": String(post.revision)
      },
      payload: { visibility: "public" }
    });
    expect(published.statusCode).toBe(200);

    const response = await app.inject({
      method: "POST",
      url: `/v1/admin/life-posts/${post.id}/notification-translation`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { targetLocale: "es", title: "Sunday gathering" }
    });
    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe(
      "life_post_notification_translation_not_allowed"
    );
    expect(fetchMock).not.toHaveBeenCalled();
    await harness.close();
  });

  it("requires member auth for study assistance", async () => {
    const harness = await buildTestApp();
    const { app } = harness;

    const response = await app.inject({
      method: "POST",
      url: "/v1/member/ai/study",
      payload: {
        task: "bible_study_help",
        locale: "en",
        input: {
          reference: "Romans 8:28",
          question: "What does this mean?"
        },
        resource: {
          resourceType: "bible_passage",
          resourceId: "rom.8.28"
        }
      }
    });

    expect(response.statusCode).toBe(401);
    expect(response.json().error).toMatchObject({
      code: "member_auth_required",
      sourceLayer: "surface",
      nextAction: "sign_in"
    });
    await harness.close();
  });

  it("uses the same provider-disabled contract for authenticated members", async () => {
    const harness = await buildTestApp();
    const { app } = harness;
    const { accessToken: adminAccessToken } = await login(app);
    const member = await loginMember(app, {
      email: "ai-member@example.com",
      displayName: "AI Member"
    });

    const response = await app.inject({
      method: "POST",
      url: "/v1/member/ai/study",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        task: "bible_study_help",
        locale: "en",
        input: {
          reference: "Romans 8:28",
          question: "What does this mean?"
        },
        resource: {
          resourceType: "bible_passage",
          resourceId: "rom.8.28"
        }
      }
    });

    expect(response.statusCode).toBe(503);
    expect(response.json().error.code).toBe("ai_provider_disabled");

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?action=ai.member_study.failed&resourceType=bible_passage&resourceId=rom.8.28&limit=20",
      headers: {
        authorization: `Bearer ${adminAccessToken}`
      }
    });
    expect(auditResponse.statusCode).toBe(200);
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "failed member AI study audit"
    );
    expect(audit.items[0]).toMatchObject({
      actorUserId: member.memberId,
      action: "ai.member_study.failed",
      resourceType: "bible_passage",
      resourceId: "rom.8.28",
      afterJson: {
        outcome: "failed",
        task: "bible_study_help",
        error: {
          code: "ai_provider_disabled"
        },
        input: {
          hasReference: true,
          hasQuestion: true,
          questionLength: 20
        }
      }
    });
    expect(JSON.stringify(audit.items[0]?.afterJson)).not.toContain(
      "What does this mean?"
    );
    await harness.close();
  });

  it("rejects member AI tasks attributed to the wrong resource type", async () => {
    const fetchMock = mockSuccessfulAiFetch();
    const harness = await buildTestApp({
      aiProvider: "openai_compatible",
      aiApiKey: "test-key",
      aiBaseUrl: "https://relay.example.com/v1",
      aiModel: "test-model"
    });
    const { app } = harness;
    const member = await loginMember(app, {
      email: "invalid-ai-resource@example.com",
      displayName: "Invalid AI Resource"
    });

    const response = await app.inject({
      method: "POST",
      url: "/v1/member/ai/study",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload: {
        task: "bible_study_help",
        locale: "en",
        input: {
          reference: "Romans 8:28",
          question: "What does this mean?"
        },
        resource: {
          resourceType: "sermon",
          resourceId: "sermon-1"
        }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toMatchObject({
      code: "validation_failed",
      category: "validation_error",
      sourceLayer: "surface"
    });
    expect(fetchMock).not.toHaveBeenCalled();
    await harness.close();
  });

  it("requires task-specific member questions and Bible references", async () => {
    const fetchMock = mockSuccessfulAiFetch();
    const harness = await buildTestApp({
      aiProvider: "openai_compatible",
      aiApiKey: "test-key",
      aiBaseUrl: "https://relay.example.com/v1",
      aiModel: "test-model"
    });
    const { app } = harness;
    const member = await loginMember(app, {
      email: "invalid-ai-input@example.com",
      displayName: "Invalid AI Input"
    });

    const invalidPayloads = [
      {
        task: "bible_study_help",
        locale: "en",
        input: {
          reference: "Romans 8:28",
          question: " "
        },
        resource: {
          resourceType: "bible_passage",
          resourceId: "rom.8.28"
        }
      },
      {
        task: "bible_study_help",
        locale: "en",
        input: {
          question: "What does this mean?"
        },
        resource: {
          resourceType: "bible_passage",
          resourceId: "rom.8.28"
        }
      },
      {
        task: "sermon_qa",
        locale: "en",
        input: {
          title: "Sunday sermon",
          question: " "
        },
        resource: {
          resourceType: "sermon",
          resourceId: "sermon-1"
        }
      }
    ];

    for (const payload of invalidPayloads) {
      const response = await app.inject({
        method: "POST",
        url: "/v1/member/ai/study",
        headers: {
          authorization: `Bearer ${member.accessToken}`
        },
        payload
      });
      expect(response.statusCode).toBe(400);
      expect(response.json().error).toMatchObject({
        code: "validation_failed",
        category: "validation_error",
        sourceLayer: "surface"
      });
    }

    expect(fetchMock).not.toHaveBeenCalled();
    await harness.close();
  });

  it("rejects admin AI tasks attributed to unrelated resources", async () => {
    const fetchMock = mockSuccessfulAiFetch();
    const harness = await buildTestApp({
      aiProvider: "openai_compatible",
      aiApiKey: "test-key",
      aiBaseUrl: "https://relay.example.com/v1",
      aiModel: "test-model"
    });
    const { app } = harness;
    const { accessToken } = await login(app);

    const response = await app.inject({
      method: "POST",
      url: "/v1/admin/ai/drafts",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        task: "sermon_summary",
        locale: "en",
        input: {
          title: "Sunday sermon",
          body: "Reviewed sermon manuscript."
        },
        resource: {
          resourceType: "life_post",
          resourceId: "life-1"
        }
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toMatchObject({
      code: "validation_failed",
      category: "validation_error",
      sourceLayer: "surface"
    });
    expect(fetchMock).not.toHaveBeenCalled();
    await harness.close();
  });

  it("reports invalid provider generation limits as misconfigured", async () => {
    const harness = await buildTestApp({
      aiProvider: "openai",
      aiApiKey: "test-key",
      aiModel: "test-model",
      aiMaxOutputTokens: 0
    });
    const { app } = harness;
    const { accessToken } = await login(app);

    const response = await app.inject({
      method: "GET",
      url: "/v1/admin/ai/status",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });

    expect(response.statusCode).toBe(200);
    const status = expectResponseData(
      response,
      aiStatusResponseSchema,
      "misconfigured admin AI status"
    );
    expect(status).toMatchObject({
      enabled: false,
      provider: "openai",
      model: "test-model"
    });
    await harness.close();
  });

  it("rate limits admin AI draft generation before repeated provider calls", async () => {
    const fetchMock = mockSuccessfulAiFetch();
    const harness = await buildTestApp({
      aiProvider: "openai_compatible",
      aiApiKey: "test-key",
      aiBaseUrl: "https://relay.example.com/v1",
      aiModel: "test-model",
      aiAdminRateLimitPerWindow: 1
    });
    const { app } = harness;
    const { accessToken } = await login(app);

    const firstResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/ai/drafts",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        task: "notification_draft",
        locale: "en",
        input: {
          title: "Sunday service",
          body: "Service starts at 10 AM."
        },
        resource: {
          resourceType: "life_post",
          resourceId: "life-1"
        }
      }
    });
    expect(firstResponse.statusCode).toBe(200);
    expectResponseData(
      firstResponse,
      aiDraftResponseSchema,
      "admin AI draft"
    );
    expect(firstResponse.headers["x-ratelimit-limit"]).toBe("1");
    expect(firstResponse.headers["x-ratelimit-remaining"]).toBe("0");

    const auditResponse = await app.inject({
      method: "GET",
      url: "/v1/admin/audit-logs?action=ai.admin_draft.generate&resourceType=life_post&resourceId=life-1&limit=20",
      headers: {
        authorization: `Bearer ${accessToken}`
      }
    });
    expect(auditResponse.statusCode).toBe(200);
    const audit = expectResponseData(
      auditResponse,
      auditLogListResponseSchema,
      "successful admin AI draft audit"
    );
    expect(audit.items[0]?.afterJson).toMatchObject({
      outcome: "generated",
      task: "notification_draft",
      input: {
        hasTitle: true,
        bodyLength: 24
      },
      outputLength: 28
    });
    expect(JSON.stringify(audit.items[0]?.afterJson)).not.toContain(
      "Service starts at 10 AM."
    );

    const secondResponse = await app.inject({
      method: "POST",
      url: "/v1/admin/ai/drafts",
      headers: {
        authorization: `Bearer ${accessToken}`
      },
      payload: {
        task: "notification_draft",
        locale: "en",
        input: {
          title: "Sunday service",
          body: "Service starts at 10 AM."
        },
        resource: {
          resourceType: "life_post",
          resourceId: "life-1"
        }
      }
    });

    expect(secondResponse.statusCode).toBe(429);
    expect(secondResponse.json().error).toMatchObject({
      code: "ai_rate_limited",
      category: "rate_limited",
      sourceLayer: "surface",
      nextAction: "wait_and_retry",
      evidence: {
        scope: "admin",
        limit: 1
      }
    });
    expect(secondResponse.headers["retry-after"]).toEqual(expect.any(String));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await harness.close();
  });

  it("rate limits member AI study generation", async () => {
    const fetchMock = mockSuccessfulAiFetch();
    const harness = await buildTestApp({
      aiProvider: "openai_compatible",
      aiApiKey: "test-key",
      aiBaseUrl: "https://relay.example.com/v1",
      aiModel: "test-model",
      aiMemberRateLimitPerWindow: 1
    });
    const { app } = harness;
    const member = await loginMember(app, {
      email: "rate-limited-ai-member@example.com",
      displayName: "Rate Limited AI Member"
    });

    const payload = {
      task: "bible_study_help",
      locale: "en",
      input: {
        reference: "Romans 8:28",
        question: "What does this mean?"
      },
      resource: {
        resourceType: "bible_passage",
        resourceId: "rom.8.28"
      }
    };
    const firstResponse = await app.inject({
      method: "POST",
      url: "/v1/member/ai/study",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload
    });
    expect(firstResponse.statusCode).toBe(200);
    expectResponseData(
      firstResponse,
      aiDraftResponseSchema,
      "member AI study"
    );

    const secondResponse = await app.inject({
      method: "POST",
      url: "/v1/member/ai/study",
      headers: {
        authorization: `Bearer ${member.accessToken}`
      },
      payload
    });

    expect(secondResponse.statusCode).toBe(429);
    expect(secondResponse.json().error).toMatchObject({
      code: "ai_rate_limited",
      evidence: {
        scope: "member",
        limit: 1
      }
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await harness.close();
  });
});

function mockSuccessfulAiFetch() {
  const fetchMock = vi.fn(
    async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: "## Draft\n\nGenerated content."
              }
            }
          ],
          usage: {
            prompt_tokens: 4,
            completion_tokens: 5,
            total_tokens: 9
          }
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json"
          }
        }
      )
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
