import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

import { isAppError, nextActionForStatus } from "./app-error.js";

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler(handleError);
}

function handleError(
  error: FastifyError | ZodError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const requestId = request.id;

  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: {
        code: "validation_failed",
        category: "validation_error",
        sourceLayer: "surface",
        message: "Request validation failed.",
        recoverable: true,
        retryable: false,
        evidence: { requestId },
        nextAction: "review_request",
        details: error.flatten()
      },
      requestId
    });
  }

  const statusCode = error.statusCode ?? 500;
  const code = isAppError(error) ? error.code : errorCodeForStatus(statusCode);
  const category = isAppError(error)
    ? error.category
    : errorCategoryForStatus(statusCode);
  const sourceLayer = isAppError(error) ? error.sourceLayer : "unknown";

  if (statusCode >= 500) {
    request.log.error({ err: error }, "request failed");
  }

  return reply.status(statusCode).send({
    error: {
      code,
      category,
      sourceLayer,
      message:
        statusCode >= 500 ? "Internal server error." : error.message,
      recoverable: isAppError(error) ? error.recoverable : statusCode < 500,
      retryable: isAppError(error) ? error.retryable : statusCode >= 500,
      evidence: isAppError(error)
        ? { requestId, ...error.evidence }
        : { requestId },
      nextAction: isAppError(error)
        ? error.nextAction
        : nextActionForStatus(statusCode),
      details: isAppError(error) ? error.details : {}
    },
    requestId
  });
}

function errorCodeForStatus(statusCode: number) {
  if (statusCode === 400) {
    return "bad_request";
  }
  if (statusCode === 401) {
    return "auth_required";
  }
  if (statusCode === 403) {
    return "forbidden";
  }
  if (statusCode === 404) {
    return "not_found";
  }
  return statusCode >= 500 ? "internal_error" : "request_failed";
}

function errorCategoryForStatus(statusCode: number) {
  if (statusCode === 400) {
    return "validation_error";
  }
  if (statusCode === 401) {
    return "authentication_required";
  }
  if (statusCode === 403) {
    return "permission_denied";
  }
  if (statusCode === 404) {
    return "not_found";
  }
  if (statusCode === 409) {
    return "state_conflict";
  }
  return statusCode >= 500 ? "internal_error" : "request_failed";
}
