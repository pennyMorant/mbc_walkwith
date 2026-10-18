import {
  type AdminPermission,
  mediaAssetListQuerySchema,
  mediaAssetUpdateRequestSchema,
  mediaAssetUploadMetadataSchema
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import {
  mediaUploadBodyInvalid
} from "../../media/media.errors.js";
import type { MediaService } from "../../media/media.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminMediaRoutes(
  app: FastifyInstance,
  service: MediaService,
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
