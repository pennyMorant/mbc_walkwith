import { appError } from "../../shared/http/app-error.js";

export function prayerRequestNotFound(requestId: string) {
  return appError({
    code: "prayer_request_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Prayer request not found.",
    recoverable: true,
    retryable: false,
    evidence: { requestId },
    nextAction: "refresh"
  });
}
