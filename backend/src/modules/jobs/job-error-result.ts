import type { Job } from "@mbc/api-contracts";

import { appError } from "../../shared/http/app-error.js";

export function jobNotFound(jobId: string) {
  return appError({
    code: "job_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Job not found.",
    recoverable: true,
    retryable: false,
    evidence: { jobId },
    nextAction: "refresh"
  });
}

export function jobActionStateConflict(
  job: Job,
  code: "job_cancel_invalid_state",
  message: string
) {
  return appError({
    code,
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message,
    recoverable: true,
    retryable: false,
    evidence: jobEvidence(job),
    nextAction: "refresh"
  });
}

function jobEvidence(job: Job): Record<string, unknown> {
  return {
    jobId: job.id,
    jobType: job.type,
    resourceType: job.resourceType,
    resourceId: job.resourceId,
    attempt: job.attempts,
    maxAttempts: job.maxAttempts
  };
}
