import { contentLocalizationAutoTranslateRequestSchema, contentLocalizationUpsertSchema, contentLocalizationResourceIdSchema, contentLocaleSchema, localizedResourceTypeSchema, type AdminPermission } from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ok } from "../../shared/http/api-response.js";
import { appError } from "../../shared/http/app-error.js";
import type { ContentLocalizationResourceDirectory, ContentLocalizationService } from "./content-localization.service.js";
import type { AiManagementService } from "../ai/ai-management.service.js";
import type { AuditService } from "../audit/audit.service.js";
import { AiRateLimiter, enforceAiRateLimit } from "../ai/ai-rate-limiter.js";
import {
  contentTranslationChunkCount,
  type ContentTranslationProviderCall,
  type ContentTranslationService
} from "./content_translation.service.js";

type AdminPreHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerContentLocalizationRoutes(app: FastifyInstance, service: ContentLocalizationService, directory: ContentLocalizationResourceDirectory, translationService: ContentTranslationService, aiManagementService: AiManagementService, auditService: AuditService, rateLimiter: AiRateLimiter, permission: PermissionPreHandler) {
  app.get("/v1/admin/content-localizations/:resourceType/:resourceId", async (request, reply) => {
    const params = parseParams(request.params);
    await permission(permissionFor(params.resourceType))(request, reply);
    await service.assertResource(params.resourceType, params.resourceId, directory);
    return ok({ items: await service.list(params.resourceType, params.resourceId) });
  });
  app.put("/v1/admin/content-localizations/:resourceType/:resourceId/:locale", async (request, reply) => {
    const params = parseParams(request.params);
    await permission(permissionFor(params.resourceType))(request, reply);
    const input = contentLocalizationUpsertSchema.parse({ ...(request.body as object), locale: params.locale, source: "admin", provider: null, model: null });
    await service.assertWritable(params.resourceType, params.resourceId, input.sourceVersion, directory);
    const source = await directory.get(params.resourceType, params.resourceId);
    const unsupported = Object.keys(input.fields).filter((field) => !source!.allowedFields.includes(field));
    if (unsupported.length > 0) {
      throw appError({ code: "content_localization_fields_invalid", message: "Translation contains unsupported fields.", statusCode: 400, category: "validation_error", sourceLayer: "feature", retryable: false, nextAction: "review_request" });
    }
    const localized = await service.upsert(params.resourceType, params.resourceId, input);
    await auditService.record({ actorUserId: request.adminUser!.id, action: "content_localization.update", resourceType: params.resourceType, resourceId: params.resourceId, afterJson: { locale: params.locale, sourceVersion: input.sourceVersion, source: "admin", fields: Object.keys(input.fields) } });
    return ok(localized);
  });
  app.post("/v1/admin/content-localizations/:resourceType/:resourceId/:locale/auto-translate", async (request, reply) => {
    const params = parseParams(request.params);
    await permission(permissionFor(params.resourceType))(request, reply);
    await permission("ai:use")(request, reply);
    const input = contentLocalizationAutoTranslateRequestSchema.parse(request.body);
    await service.assertWritable(params.resourceType, params.resourceId, input.sourceVersion, directory);
    const source = await directory.get(params.resourceType, params.resourceId);
    await aiManagementService.assertBudgetForTask("content_translation", {
      inputCharacters: Object.values(source!.sourceFields).reduce(
        (total, field) => total + field.length,
        0
      ),
      providerCalls: contentTranslationChunkCount(source!.sourceFields)
    });
    enforceAiRateLimit(reply, rateLimiter.check("admin", request.adminUser!.id), "admin");
    const localized = await translationService.generate({
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      locale: params.locale,
      sourceVersion: input.sourceVersion,
      fields: source!.sourceFields,
      onProviderCall: (call) => recordProviderCall({
        auditService,
        actorUserId: request.adminUser!.id,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        locale: params.locale,
        sourceVersion: input.sourceVersion,
        call
      })
    });
    return ok(localized.localized);
  });
}

async function recordProviderCall(input: {
  auditService: AuditService;
  actorUserId: string;
  resourceType: "life_post" | "sermon" | "sermon_discussion_guide";
  resourceId: string;
  locale: string;
  sourceVersion: number;
  call: ContentTranslationProviderCall;
}) {
  const { call } = input;
  const usage = call.inputTokens === undefined || call.outputTokens === undefined
    ? undefined
    : {
        inputTokens: call.inputTokens,
        outputTokens: call.outputTokens,
        totalTokens: call.inputTokens === null || call.outputTokens === null
          ? null
          : call.inputTokens + call.outputTokens
      };
  await input.auditService.record({
    actorUserId: input.actorUserId,
    action: `ai.content_translation.${call.outcome}`,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    afterJson: {
      outcome: call.outcome,
      task: "content_translation",
      locale: input.locale,
      sourceVersion: input.sourceVersion,
      field: call.field,
      chunkIndex: call.chunkIndex,
      ...(call.provider ? { provider: call.provider } : {}),
      ...(call.model ? { model: call.model } : {}),
      ...(usage ? { usage } : {}),
      ...(call.latencyMs !== undefined ? { latencyMs: call.latencyMs } : {}),
      ...(call.errorCode ? { error: { code: call.errorCode } } : {})
    }
  });
}

function parseParams(value: unknown) {
  const params = value as { resourceType?: string; resourceId?: string; locale?: string };
  return { resourceType: localizedResourceTypeSchema.parse(params.resourceType), resourceId: contentLocalizationResourceIdSchema.parse(params.resourceId), locale: contentLocaleSchema.parse(params.locale ?? "en") };
}
function permissionFor(
  type: "life_post" | "sermon" | "sermon_discussion_guide"
): AdminPermission {
  if (type === "life_post") return "life_posts:update";
  if (type === "sermon") return "sermons:update";
  return "sermon_guides:manage";
}
