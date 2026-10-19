import {
  type AdminPermission,
  mediaAssetListQuerySchema,
  mediaAssetUpdateRequestSchema,
  mediaAssetUploadMetadataSchema,
  mediaCleanupListQuerySchema
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import {
  mediaCleanupNotFound,
  mediaUploadBodyInvalid
} from "../../media/media.errors.js";
import type { MediaService } from "../../media/media.service.js";
import type { MediaCleanupService } from "../../media/media_cleanup.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminMediaRoutes(
  app: FastifyInstance,
  service: MediaService,
  cleanupService: MediaCleanupService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/media",
    { preHandler: permissionPreHandler("media:read") },
    async (request) => {
      const query = mediaAssetListQuerySchema.parse(request.query);
      return ok({ items: await service.list(query) });
    }
  );

  app.get(
    "/v1/admin/media/cleanup-tasks",
    { preHandler: permissionPreHandler("media:read") },
    async (request) => {
      const query = mediaCleanupListQuerySchema.parse(request.query);
      return ok({ items: await cleanupService.list(query) });
    }
  );

  app.post(
    "/v1/admin/media/cleanup-tasks/:cleanupTaskId/retry",
    { preHandler: permissionPreHandler("media:manage") },
    async (request) => {
      const { cleanupTaskId } = cleanupParamsSchema.parse(request.params);
      const before = await cleanupService.getById(cleanupTaskId);
      if (!before) throw mediaCleanupNotFound(cleanupTaskId);
      const task = await cleanupService.retry(cleanupTaskId);
      if (!task) throw mediaCleanupNotFound(cleanupTaskId);
      await auditService.record({
        actorUserId: request.adminUser!.id,
        action: "media.cleanup.retry",
        resourceType: "media_cleanup_task",
        resourceId: task.id,
        beforeJson: publicCleanupTask(before),
        afterJson: task
      });
      return ok(task);
    }
  );

  app.post(
    "/v1/admin/media/images",
    {
      bodyLimit: 12 * 1024 * 1024,
      preHandler: permissionPreHandler("media:manage")
    },
    async (request) => {
      if (!Buffer.isBuffer(request.body)) {
        throw mediaUploadBodyInvalid();
      }
      const metadata = mediaAssetUploadMetadataSchema.parse(request.query);
      const asset = await service.uploadImage({
        ...metadata,
        kind: "image",
        buffer: request.body,
        fileName: decodeFileNameHeader(
          headerValue(request.headers["x-file-name"])
        ),
        mimeType:
          headerValue(request.headers["content-type"]) ??
          "application/octet-stream"
      });
      await auditService.record({
        actorUserId: request.adminUser!.id,
        action: "media.upload",
        resourceType: "media_asset",
        resourceId: asset.id,
        afterJson: asset
      });
      return ok(asset);
    }
  );

  app.patch(
    "/v1/admin/media/:mediaId",
    { preHandler: permissionPreHandler("media:manage") },
    async (request) => {
      const { mediaId } = mediaParamsSchema.parse(request.params);
      const input = mediaAssetUpdateRequestSchema.parse(request.body);
      const before = await service.getById(mediaId);
      const asset = await service.update(mediaId, input);
      await auditService.record({
        actorUserId: request.adminUser!.id,
        action: "media.update",
        resourceType: "media_asset",
        resourceId: asset.id,
        beforeJson: before,
        afterJson: asset
      });
      return ok(asset);
    }
  );
}

const mediaParamsSchema = z.object({ mediaId: z.string().uuid() });
const cleanupParamsSchema = z.object({ cleanupTaskId: z.string().uuid() });

function publicCleanupTask<T extends { storageKey: string }>(task: T) {
  const { storageKey: _storageKey, ...publicTask } = task;
  return publicTask;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function decodeFileNameHeader(value: string | undefined): string {
  if (!value) {
    return "image";
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
