import {
  appSettingListQuerySchema,
  appSettingUpdateRequestSchema,
  type AdminPermission
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import { settingNotFound } from "../../settings/settings-errors.js";
import type { SettingsService } from "../../settings/settings.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminSettingsRoutes(
  app: FastifyInstance,
  service: SettingsService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/settings",
    { preHandler: permissionPreHandler("settings:read") },
    async (request) => {
      const query = appSettingListQuerySchema.parse(request.query);
      return ok({ items: await service.list(query) });
    }
  );

  app.patch(
    "/v1/admin/settings/:settingKey",
    { preHandler: permissionPreHandler("settings:update") },
    async (request, reply) => {
      const params = settingParamsSchema.parse(request.params);
      const body = appSettingUpdateRequestSchema.parse(request.body);
      const before = await service.getByKey(params.settingKey);
      if (!before) {
        throw settingNotFound(params.settingKey);
      }
      const setting = await service.update(params.settingKey, body);
      if (!setting) {
        throw settingNotFound(params.settingKey);
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "setting.update",
        resourceType: "setting",
        resourceId: setting.key,
        beforeJson: before,
        afterJson: setting
      });
      return ok(setting);
    }
  );
}

const settingParamsSchema = z.object({
  settingKey: z.string()
});
