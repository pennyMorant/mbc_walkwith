import {
  type AdminPermission,
  eventCheckInCodeCreateRequestSchema,
  eventRegistrationAdminCreateRequestSchema,
  eventRegistrationListQuerySchema,
  eventRegistrationUpdateRequestSchema
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import { lifePostNotFound } from "../../life/life-post-errors.js";
import type { LifePostService } from "../../life/life-post.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminLifePostRegistrationRoutes(
  app: FastifyInstance,
  service: LifePostService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.post(
    "/v1/admin/life-posts/:postId/check-in-code",
    { preHandler: permissionPreHandler("life_posts:update") },
    async (request) => {
      const params = postParamsSchema.parse(request.params);
      const body = eventCheckInCodeCreateRequestSchema.parse(request.body ?? {});
      const code = await service.createOrRotateEventCheckInCode(
        params.postId,
        body,
        request.adminUser?.id ?? null
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "life_post.check_in_code.create_or_rotate",
        resourceType: "life_post",
        resourceId: params.postId,
        afterJson: {
          codeId: code.id,
          expiresAt: code.expiresAt,
          rotated: body.rotate
        }
      });
      return ok(code);
    }
  );

  app.get(
    "/v1/admin/life-posts/:postId/registrations",
    { preHandler: permissionPreHandler("life_posts:update") },
    async (request) => {
      const params = postParamsSchema.parse(request.params);
      const query = eventRegistrationListQuerySchema.parse(request.query);
      const post = await service.getById(params.postId);
      if (!post) {
        throw lifePostNotFound(params.postId);
      }
      const page = await service.listRegistrations(params.postId, query);
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "life_post.registrations.list",
        resourceType: "life_post",
        resourceId: params.postId,
        afterJson: {
          count: page.items.length,
          total: page.total,
          status: query.status ?? null,
          limit: query.limit,
          offset: query.offset,
          queryApplied: Boolean(query.query)
        }
      });
      return ok(page);
    }
  );

  app.post(
    "/v1/admin/life-posts/:postId/registrations",
    { preHandler: permissionPreHandler("life_posts:update") },
    async (request) => {
      const params = postParamsSchema.parse(request.params);
      const body = eventRegistrationAdminCreateRequestSchema.parse(
        request.body ?? {}
      );
      const registration = await service.createRegistrationForAdmin(
        params.postId,
        body
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "life_post.registration.create",
        resourceType: "event_registration",
        resourceId: registration.id,
        afterJson: {
          lifePostId: params.postId,
          attendeeName: registration.attendeeName,
          partySize: registration.partySize
        }
      });
      return ok(registration);
    }
  );

  app.patch(
    "/v1/admin/life-posts/:postId/registrations/:registrationId",
    { preHandler: permissionPreHandler("life_posts:update") },
    async (request) => {
      const params = registrationParamsSchema.parse(request.params);
      const body = eventRegistrationUpdateRequestSchema.parse(request.body ?? {});
      const registration = await service.updateRegistration(
        params.postId,
        params.registrationId,
        body,
        request.adminUser?.id ?? null
      );
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "life_post.registration.update",
        resourceType: "event_registration",
        resourceId: params.registrationId,
        afterJson: {
          lifePostId: params.postId,
          status: registration.status,
          partySize: registration.partySize,
          checkedInAt: registration.checkedInAt,
          checkInMethod: registration.checkInMethod
        }
      });
      return ok(registration);
    }
  );

  app.get(
    "/v1/admin/life-posts/:postId/registrations/export",
    { preHandler: permissionPreHandler("life_posts:update") },
    async (request) => {
      const params = postParamsSchema.parse(request.params);
      const result = await service.exportRegistrationsCsv(params.postId);
      if (!result) {
        throw lifePostNotFound(params.postId);
      }
      const filename = `event-registrations-${params.postId}.csv`;
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "life_post.registrations.export",
        resourceType: "life_post",
        resourceId: params.postId,
        afterJson: {
          filename,
          byteLength: Buffer.byteLength(result.csv, "utf8")
        }
      });
      return ok({
        filename,
        contentType: "text/csv",
        csv: result.csv
      });
    }
  );
}

const postParamsSchema = z.object({
  postId: z.string()
});

const registrationParamsSchema = z.object({
  postId: z.string(),
  registrationId: z.string()
});
