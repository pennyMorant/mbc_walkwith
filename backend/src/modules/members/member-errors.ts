import { appError } from "../../shared/http/app-error.js";

export function memberNotFound(memberId: string) {
  return appError({
    code: "member_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Member not found.",
    recoverable: true,
    retryable: false,
    evidence: { memberId },
    nextAction: "refresh"
  });
}
