import { appError } from "../../shared/http/app-error.js";

export function bibleKnowledgeNotFound(input: {
  entityId: string;
  locale: string;
  translationId: string;
}) {
  return appError({
    code: "bible_knowledge_not_found",
    category: "not_found",
    sourceLayer: "feature",
    statusCode: 404,
    message: "Bible knowledge entity not found.",
    recoverable: true,
    retryable: false,
    evidence: input,
    nextAction: "refresh"
  });
}
