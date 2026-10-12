import {
  type AdminPermission,
  bibleKnowledgeListQuerySchema,
  bibleKnowledgeUpdateRequestSchema,
  bibleKnowledgeUpsertRequestSchema
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import { bibleKnowledgeNotFound } from "../../bible-knowledge/bible-knowledge-errors.js";
import type { BibleKnowledgeService } from "../../bible-knowledge/bible-knowledge.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminBibleKnowledgeRoutes(
  app: FastifyInstance,
  service: BibleKnowledgeService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/bible-knowledge",
    { preHandler: permissionPreHandler("bible_knowledge:read") },
    async (request) => {
      const query = bibleKnowledgeListQuerySchema.parse(request.query);
      return ok({ items: await service.list(query) });
    }
  );

  app.post(
    "/v1/admin/bible-knowledge",
    { preHandler: permissionPreHandler("bible_knowledge:update") },
    async (request) => {
      const body = bibleKnowledgeUpsertRequestSchema.parse(request.body);
      const entity = await service.create(body);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "bible_knowledge.create",
        resourceType: "bible_knowledge",
        resourceId: entity.id,
        afterJson: entity
      });
      return ok(entity);
    }
  );

  app.patch(
    "/v1/admin/bible-knowledge/:entityId",
    { preHandler: permissionPreHandler("bible_knowledge:update") },
    async (request, reply) => {
      const params = entityParamsSchema.parse(request.params);
      const query = entityKeyQuerySchema.parse(request.query);
      const body = bibleKnowledgeUpdateRequestSchema.parse(request.body);
      const key = {
        id: params.entityId,
        locale: query.locale,
        translationId: query.translationId
      };
      const before = await service.getByKey(key);
      if (!before) {
        throw bibleKnowledgeNotFound({
          entityId: key.id,
          locale: key.locale,
          translationId: key.translationId
        });
      }
      const entity = await service.update(key, body);
      if (!entity) {
        throw bibleKnowledgeNotFound({
          entityId: key.id,
          locale: key.locale,
          translationId: key.translationId
        });
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "bible_knowledge.update",
        resourceType: "bible_knowledge",
        resourceId: entity.id,
        beforeJson: before,
        afterJson: entity
      });
      return ok(entity);
    }
  );

  app.delete(
    "/v1/admin/bible-knowledge/:entityId",
    { preHandler: permissionPreHandler("bible_knowledge:update") },
    async (request, reply) => {
      const params = entityParamsSchema.parse(request.params);
      const query = entityKeyQuerySchema.parse(request.query);
      const key = {
        id: params.entityId,
        locale: query.locale,
        translationId: query.translationId
      };
      const before = await service.getByKey(key);
      if (!before) {
        throw bibleKnowledgeNotFound({
          entityId: key.id,
          locale: key.locale,
          translationId: key.translationId
        });
      }
      const deleted = await service.delete(key);
      if (!deleted) {
        throw bibleKnowledgeNotFound({
          entityId: key.id,
          locale: key.locale,
          translationId: key.translationId
        });
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "bible_knowledge.delete",
        resourceType: "bible_knowledge",
        resourceId: params.entityId,
        beforeJson: before
      });
      return ok({ deleted: true });
    }
  );
}

const entityParamsSchema = z.object({
  entityId: z.string()
});

const entityKeyQuerySchema = z.object({
  locale: z.string().default("en"),
  translationId: z.enum(["web", "cuvs", "cuvt"]).default("web")
});
