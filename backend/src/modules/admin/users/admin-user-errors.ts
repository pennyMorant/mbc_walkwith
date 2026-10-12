import { appError } from "../../../shared/http/app-error.js";

export function adminUserNotFound(adminUserId: string) {
  return appError({
    code: "admin_user_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Admin user not found.",
    recoverable: true,
    retryable: false,
    evidence: { adminUserId },
    nextAction: "refresh"
  });
}
