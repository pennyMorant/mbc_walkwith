import {
  sermonAudioCleanupListQuerySchema,
  type AdminPermission
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import { ok } from "../../../shared/http/api-response.js";
import type { AuditService } from "../../audit/audit.service.js";
import {
  mediaMissing,
  sermonAudioCleanupNotFound,
  sermonNotFound,
  uploadFailed
} from "../../sermons/sermon-errors.js";
import type { SermonService } from "../../sermons/sermon.service.js";
import type { SermonAudioCleanupService } from "../../sermons/sermon_audio_cleanup.service.js";
import {
  assertCanChangePublishedSermon,
  sermonMutationContext
} from "./admin_sermon_workflow.routes.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminSermonAudioRoutes(
  app: FastifyInstance,
  service: SermonService,
  audioCleanupService: SermonAudioCleanupService,
  auditService: AuditService,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/sermons/audio-cleanups",
    { preHandler: permissionPreHandler("sermons:read") },
    async (request) => {
      const query = sermonAudioCleanupListQuerySchema.parse(request.query);
      return ok({ items: await audioCleanupService.list(query) });
    }
  );

  app.post(
    "/v1/admin/sermons/audio-cleanups/:cleanupTaskId/retry",
    { preHandler: permissionPreHandler("sermons:update") },
    async (request) => {
      const params = cleanupParamsSchema.parse(request.params);
      const before = await audioCleanupService.getById(params.cleanupTaskId);
      if (!before) {
        throw sermonAudioCleanupNotFound(params.cleanupTaskId);
      }
      const task = await audioCleanupService.retry(params.cleanupTaskId);
      if (!task) {
        throw sermonAudioCleanupNotFound(params.cleanupTaskId);
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "sermon.audio_cleanup.retry",
        resourceType: "sermon_audio_cleanup_task",
        resourceId: task.id,
        beforeJson: publicCleanupTask(before),
        afterJson: task
      });
      return ok(task);
    }
  );

  app.addContentTypeParser(
    "application/octet-stream",
    { parseAs: "buffer" },
    (_request, body, done) => done(null, body)
  );
  app.addContentTypeParser(
    /^audio\/.*/,
    { parseAs: "buffer" },
    (_request, body, done) => done(null, body)
  );

  app.post(
    "/v1/admin/sermons/:sermonId/audio",
    {
      bodyLimit: 250 * 1024 * 1024,
      preHandler: permissionPreHandler("sermons:update")
    },
    async (request) => {
      const params = sermonParamsSchema.parse(request.params);
      const before = await service.getById(params.sermonId);
      if (!before) {
        throw sermonNotFound(params.sermonId);
      }
      assertCanChangePublishedSermon(request, before);
      if (!Buffer.isBuffer(request.body)) {
        throw uploadFailed(params.sermonId, "Audio upload body must be binary.");
      }

      const sermon = await service.attachAudio(
        params.sermonId,
        {
          buffer: request.body,
          fileName: decodeFileNameHeader(
            headerValue(request.headers["x-file-name"])
          ),
          mimeType:
            headerValue(request.headers["content-type"]) ??
            "application/octet-stream"
        },
        sermonMutationContext(request)
      );
      if (!sermon) {
        throw sermonNotFound(params.sermonId);
      }

      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "sermon.upload_audio",
        resourceType: "sermon",
        resourceId: sermon.id,
        beforeJson: before,
        afterJson: sermon
      });
      return ok(sermon);
    }
  );

  app.get(
    "/v1/admin/sermons/:sermonId/audio",
    { preHandler: permissionPreHandler("sermons:read") },
    async (request, reply) => {
      const params = sermonParamsSchema.parse(request.params);
      const audio = await service.readAudio(
        params.sermonId,
        headerValue(request.headers.range)
      );
      if (!audio) {
        throw mediaMissing(params.sermonId);
      }
      return sendAudio(reply, audio);
    }
  );

  app.delete(
    "/v1/admin/sermons/:sermonId/audio",
    { preHandler: permissionPreHandler("sermons:update") },
    async (request) => {
      const params = sermonParamsSchema.parse(request.params);
      const before = await service.getById(params.sermonId);
      if (!before) {
        throw sermonNotFound(params.sermonId);
      }
      assertCanChangePublishedSermon(request, before);
      const sermon = await service.removeAudio(
        params.sermonId,
        sermonMutationContext(request)
      );
      if (!sermon) {
        throw sermonNotFound(params.sermonId);
      }
      await auditService.record({
        actorUserId: request.adminUser?.id ?? null,
        action: "sermon.remove_audio",
        resourceType: "sermon",
        resourceId: sermon.id,
        beforeJson: before,
        afterJson: sermon
      });
      return ok(sermon);
    }
  );
}

const sermonParamsSchema = z.object({
  sermonId: z.string()
});

const cleanupParamsSchema = z.object({
  cleanupTaskId: z.string().uuid()
});

function publicCleanupTask(
  task: NonNullable<Awaited<ReturnType<SermonAudioCleanupService["getById"]>>>
) {
  const { storagePath: _storagePath, ...publicTask } = task;
  return publicTask;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function decodeFileNameHeader(value: string | undefined): string {
  if (!value) {
    return "sermon-audio";
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function sendAudio(
  reply: FastifyReply,
  audio: NonNullable<Awaited<ReturnType<SermonService["readAudio"]>>>
) {
  reply.header("accept-ranges", "bytes");
  reply.header("content-type", audio.mimeType);
  reply.header("content-length", String(audio.rangeEnd - audio.rangeStart + 1));
  if (audio.partial) {
    reply.code(206);
    reply.header(
      "content-range",
      `bytes ${audio.rangeStart}-${audio.rangeEnd}/${audio.sizeBytes}`
    );
  }
  return reply.send(audio.stream);
}
