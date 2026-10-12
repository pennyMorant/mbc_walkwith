import { appError } from "../../shared/http/app-error.js";

export function statementNoConfirmedGiftsError(
  year: number,
  evidence: {
    userId: string | null;
    donorEmail: string | null;
    donorName: string;
  }
) {
  return appError({
    code: "statement_no_confirmed_gifts",
    category: "state_conflict",
    sourceLayer: "feature",
    statusCode: 409,
    message: "No confirmed giving transactions exist for this statement.",
    recoverable: true,
    retryable: false,
    evidence: {
      year,
      ...evidence
    },
    nextAction: "select_year_with_confirmed_gifts"
  });
}
