import {
  type AdminPermission,
  type SermonProductionPipelineCheck,
  type SermonProductionPipelineStatusResponse,
  jobListQuerySchema,
  updateJobStatusRequestSchema
} from "@mbc/api-contracts";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import type { AppConfig } from "../../../config/env.js";
import { listMeta, ok } from "../../../shared/http/api-response.js";
import { jobNotFound } from "../../jobs/job-error-result.js";
import type { JobService } from "../../jobs/job.service.js";

type AdminPreHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => Promise<void>;

type PermissionPreHandler = (permission: AdminPermission) => AdminPreHandler;

export async function registerAdminJobRoutes(
  app: FastifyInstance,
  service: JobService,
  config: AppConfig,
  permissionPreHandler: PermissionPreHandler
) {
  app.get(
    "/v1/admin/jobs",
    { preHandler: permissionPreHandler("jobs:read") },
    async (request) => {
      const query = jobListQuerySchema.parse(request.query);
      const result = await service.list(query);
      return ok(
        { items: result.jobs, nextCursor: result.nextCursor },
        listMeta(query.limit, result.nextCursor)
      );
    }
  );

  app.get(
    "/v1/admin/jobs/stats",
    { preHandler: permissionPreHandler("jobs:read") },
    async () => ok(await service.stats())
  );

  app.get(
    "/v1/admin/jobs/sermon-pipeline-status",
    { preHandler: permissionPreHandler("jobs:read") },
    async () => {
      return ok(sermonProductionPipelineStatus(config));
    }
  );

  app.get(
    "/v1/admin/jobs/:jobId",
    { preHandler: permissionPreHandler("jobs:read") },
    async (request, reply) => {
      const params = jobParamsSchema.parse(request.params);
      const job = await service.getById(params.jobId);
      if (!job) {
        throw jobNotFound(params.jobId);
      }
      return ok(job);
    }
  );

  app.patch(
    "/v1/admin/jobs/:jobId/status",
    { preHandler: permissionPreHandler("jobs:manage") },
    async (request, reply) => {
      const params = jobParamsSchema.parse(request.params);
      const body = updateJobStatusRequestSchema.parse(request.body);
      const job = await service.updateStatus(params.jobId, body);
      if (!job) {
        throw jobNotFound(params.jobId);
      }
      return ok(job);
    }
  );

  app.post(
    "/v1/admin/jobs/:jobId/cancel",
    { preHandler: permissionPreHandler("jobs:manage") },
    async (request, reply) => {
      const params = jobParamsSchema.parse(request.params);
      const job = await service.cancel(params.jobId);
      if (!job) {
        throw jobNotFound(params.jobId);
      }
      return ok(job);
    }
  );
}

const jobParamsSchema = z.object({
  jobId: z.string()
});

function sermonProductionPipelineStatus(
  config: AppConfig
): SermonProductionPipelineStatusResponse {
  const checks: SermonProductionPipelineCheck[] = [
    dataStoreCheck(config),
    audioStorageCheck(config),
    localProcessingCheck()
  ];

  return {
    ready: checks.every((check) => check.status !== "blocked"),
    updatedAt: new Date().toISOString(),
    checks
  };
}

function dataStoreCheck(config: AppConfig): SermonProductionPipelineCheck {
  if (!config.useMockData && config.databaseUrl) {
    return {
      id: "data_store",
      label: "Postgres data store",
      status: "ready",
      detail: "Backend is configured to use Postgres repositories."
    };
  }
  return {
    id: "data_store",
    label: "Postgres data store",
    status: "blocked",
    detail: "Set DATABASE_URL and run with USE_MOCK_DATA=false for real sermons."
  };
}

function audioStorageCheck(config: AppConfig): SermonProductionPipelineCheck {
  if (config.mediaStorageDriver === "s3") {
    const hasCredentials = Boolean(
      config.s3Bucket && config.s3AccessKeyId && config.s3SecretAccessKey
    );
    return {
      id: "audio_storage",
      label: config.s3Endpoint ? "R2/S3 audio storage" : "S3 audio storage",
      status: hasCredentials ? "ready" : "blocked",
      detail: hasCredentials
        ? `${config.s3Bucket} is configured for sermon audio objects.`
        : "Set S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY."
    };
  }
  return {
    id: "audio_storage",
    label: "Local audio storage",
    status: "warning",
    detail:
      "Local uploads work for demos. Use MEDIA_STORAGE_DRIVER=s3 with R2/S3 for production."
  };
}

function localProcessingCheck(): SermonProductionPipelineCheck {
  return {
    id: "local_processing",
    label: "Local sermon package workflow",
    status: "ready",
    detail:
      "Transcription, outline, and Scripture extraction are prepared on the local workstation and uploaded through the local-package API."
  };
}
