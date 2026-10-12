import {
  adminAiDraftRequestSchema,
  aiBudgetPolicySchema,
  aiModelPolicyUpdateSchema,
  aiProviderTestResultSchema,
  aiProviderConfigUpdateSchema,
  type AiDraftResponse,
  type AiResourceReference,
  type AiTaskInput,
  type AdminPermission,
  memberAiStudyRequestSchema
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { ok } from "../../shared/http/api-response.js";
import { isAppError } from "../../shared/http/app-error.js";
import type { AuditService } from "../audit/audit.service.js";
import { requireMember } from "../members/auth/member-auth.middleware.js";
import type { MemberAuthService } from "../members/auth/member-auth.service.js";
import { enforceAiRateLimit, type AiRateLimiter } from "./ai-rate-limiter.js";
import type { AiService } from "./ai.service.js";
import type { AiManagementService } from "./ai-management.service.js";
import { summarizeAiTaskInput } from "./ai.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAiRoutes(
  app: FastifyInstance,
  service: AiService,
  memberAuthService: MemberAuthService,
  auditService: AuditService,
  rateLimiter: AiRateLimiter,
  managementService: AiManagementService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/ai/management",
    { preHandler: permissionPreHandler("ai:read") },
    async () => ok(await managementService.overview())
  );

  app.put(
    "/v1/admin/ai/providers/:providerId",
    { preHandler: permissionPreHandler("ai:manage") },
    async (request) => {
      const body = aiProviderConfigUpdateSchema.parse({
        ...(request.body as object),
        id: (request.params as { providerId: string }).providerId
      });
      const provider = await managementService.saveProvider(body);
      await auditService.record({
        actorUserId: request.adminUser!.id,
        action: "ai.provider.update",
        resourceType: "ai_provider",
        resourceId: provider.id,
        afterJson: {
          provider: provider.id,
          type: provider.type,
          enabled: provider.enabled,
          model: provider.defaultModel,
          apiKeyConfigured: provider.apiKeyConfigured
        }
      });
      return ok(provider);
    }
  );

  app.put(
    "/v1/admin/ai/policies/:capability",
    { preHandler: permissionPreHandler("ai:manage") },
    async (request) => {
      const policy = aiModelPolicyUpdateSchema.parse({
        ...(request.body as object),
        capability: (request.params as { capability: string }).capability
      });
      const saved = await managementService.savePolicy(policy);
      await auditService.record({ actorUserId: request.adminUser!.id, action: "ai.policy.update", resourceType: "ai_policy", resourceId: saved.capability, afterJson: { capability: saved.capability, providerId: saved.providerId, model: saved.model, fallbackProviderId: saved.fallbackProviderId, fallbackModel: saved.fallbackModel, maxOutputTokens: saved.maxOutputTokens, timeoutMs: saved.timeoutMs } });
      return ok(saved);
    }
  );

  app.put(
    "/v1/admin/ai/budget",
    { preHandler: permissionPreHandler("ai:manage") },
    async (request) => {
      const budget = await managementService.saveBudget(aiBudgetPolicySchema.parse(request.body));
      await auditService.record({ actorUserId: request.adminUser!.id, action: "ai.budget.update", resourceType: "ai_budget", resourceId: "runtime", afterJson: budget });
      return ok(budget);
    }
  );

  app.post(
    "/v1/admin/ai/providers/:providerId/test",
    { preHandler: permissionPreHandler("ai:manage") },
    async (request) => {
      const providerId = (request.params as { providerId: string }).providerId;
      const result = aiProviderTestResultSchema.parse(await managementService.testProvider(providerId));
      await auditService.record({ actorUserId: request.adminUser!.id, action: "ai.provider.test", resourceType: "ai_provider", resourceId: providerId, afterJson: { ok: result.ok, provider: result.provider, model: result.model, latencyMs: result.latencyMs, errorCode: result.errorCode } });
      return ok(result);
    }
  );
  app.get(
    "/v1/admin/ai/status",
    { preHandler: permissionPreHandler("ai:use") },
    async () => ok(service.status())
  );

  app.post(
    "/v1/admin/ai/drafts",
    { preHandler: permissionPreHandler("ai:use") },
    async (request, reply) => {
      const body = adminAiDraftRequestSchema.parse(request.body);
      await managementService.assertBudgetForTask(body.task, {
        inputCharacters: aiTaskInputCharacters(body.input)
      });
      enforceAiRateLimit(
        reply,
        rateLimiter.check("admin", request.adminUser!.id),
        "admin"
      );
      const draft = await generateWithAudit({
        actorUserId: request.adminUser?.id ?? null,
        action: "ai.admin_draft",
        body,
        service,
        auditService,
        run: () => service.createAdminDraft(body)
      });
      return ok(draft);
    }
  );

  app.post(
    "/v1/member/ai/study",
    { preHandler: requireMember(memberAuthService) },
    async (request, reply) => {
      const body = memberAiStudyRequestSchema.parse(request.body);
      await managementService.assertBudgetForTask(body.task, {
        inputCharacters: aiTaskInputCharacters(body.input)
      });
      enforceAiRateLimit(
        reply,
        rateLimiter.check("member", request.member!.id),
        "member"
      );
      const draft = await generateWithAudit({
        actorUserId: request.member?.id ?? null,
        action: "ai.member_study",
        body,
        service,
        auditService,
        run: () => service.createMemberStudy(body)
      });
      return ok(draft);
    }
  );
}

type AiAuditRequest = {
  task: string;
  input: AiTaskInput;
  resource?: AiResourceReference | undefined;
};

async function generateWithAudit(input: {
  actorUserId: string | null;
  action: "ai.admin_draft" | "ai.member_study";
  body: AiAuditRequest;
  service: AiService;
  auditService: AuditService;
  run: () => Promise<AiDraftResponse>;
}) {
  const { actorUserId, action, body, service, auditService, run } = input;
  const resourceType = body.resource?.resourceType ?? "ai_task";
  const resourceId = body.resource?.resourceId ?? body.task;

  try {
    const draft = await run();
    if (service.auditEnabled) {
      await auditService.record({
        actorUserId,
        action: `${action}.generate`,
        resourceType,
        resourceId,
        afterJson: {
          outcome: "generated",
          task: body.task,
          resource: body.resource ?? null,
          provider: draft.provider,
          model: draft.model,
          input: summarizeAiTaskInput(body.input),
          outputLength: draft.markdown.length,
          usage: draft.usage,
          latencyMs: draft.latencyMs
        }
      });
    }
    return draft;
  } catch (error) {
    if (service.auditEnabled) {
      await auditService.record({
        actorUserId,
        action: `${action}.failed`,
        resourceType,
        resourceId,
        afterJson: {
          outcome: "failed",
          task: body.task,
          resource: body.resource ?? null,
          provider: service.status().provider,
          model: service.status().model,
          input: summarizeAiTaskInput(body.input),
          error: auditErrorSummary(error)
        }
      });
    }
    throw error;
  }
}

function auditErrorSummary(error: unknown) {
  if (isAppError(error)) {
    return {
      code: error.code,
      category: error.category,
      sourceLayer: error.sourceLayer,
      retryable: error.retryable
    };
  }
  return {
    code: "internal_error",
    category: "internal_error",
    sourceLayer: "unknown",
    retryable: true
  };
}

function aiTaskInputCharacters(input: AiTaskInput) {
  return [
    input.title,
    input.body,
    input.reference,
    input.question,
    input.audience,
    ...input.context.flatMap((item) => [item.label, item.value])
  ].reduce((total, value) => total + (value?.length ?? 0), 0);
}
