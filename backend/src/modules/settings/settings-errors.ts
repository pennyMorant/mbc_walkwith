import { appError } from "../../shared/http/app-error.js";

export function settingNotFound(settingKey: string) {
  return appError({
    code: "setting_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Setting not found.",
    recoverable: true,
    retryable: false,
    evidence: { settingKey },
    nextAction: "refresh"
  });
}

export function settingValueInvalid(
  settingKey: string,
  details: Record<string, unknown>
) {
  return appError({
    code: "setting_value_invalid",
    category: "validation_error",
    sourceLayer: "feature",
    statusCode: 400,
    message: "Setting value is invalid.",
    recoverable: true,
    retryable: false,
    evidence: { settingKey },
    details,
    nextAction: "review_request"
  });
}
