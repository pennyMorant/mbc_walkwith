import { appError } from "../../shared/http/app-error.js";

export function aiProviderDisabled() {
  return appError({
    code: "ai_provider_disabled",
    message: "AI provider is not configured.",
    statusCode: 503,
    category: "provider_disabled",
    sourceLayer: "capability",
    recoverable: true,
    retryable: false,
    nextAction: "configure_provider"
  });
}

export function aiProviderMisconfigured(reason: string) {
  return appError({
    code: "ai_provider_misconfigured",
    message: "AI provider configuration is incomplete.",
    statusCode: 503,
    category: "provider_misconfigured",
    sourceLayer: "capability",
    recoverable: true,
    retryable: false,
    evidence: { reason },
    nextAction: "configure_provider"
  });
}

export function aiProviderRequestFailed(
  provider: string,
  statusCode: number
) {
  return appError({
    code: "ai_provider_request_failed",
    message: "AI provider request failed.",
    statusCode: 502,
    category: "provider_request_failed",
    sourceLayer: "external",
    recoverable: true,
    retryable: true,
    evidence: {
      provider,
      providerStatusCode: statusCode
    },
    nextAction: "retry"
  });
}

export function aiProviderTimeout(provider: string, timeoutMs: number) {
  return appError({
    code: "ai_provider_timeout",
    message: "AI provider request timed out.",
    statusCode: 504,
    category: "provider_timeout",
    sourceLayer: "external",
    recoverable: true,
    retryable: true,
    evidence: { provider, timeoutMs },
    nextAction: "retry"
  });
}

export function aiProviderNetworkFailed(provider: string) {
  return appError({
    code: "ai_provider_network_failed",
    message: "AI provider network request failed.",
    statusCode: 502,
    category: "provider_network_failed",
    sourceLayer: "external",
    recoverable: true,
    retryable: true,
    evidence: { provider },
    nextAction: "retry"
  });
}

export function aiRateLimitExceeded(input: {
  scope: "admin" | "member";
  limit: number;
  resetAt: string;
  retryAfterSeconds: number;
}) {
  return appError({
    code: "ai_rate_limited",
    message: "AI request rate limit exceeded.",
    statusCode: 429,
    category: "rate_limited",
    sourceLayer: "surface",
    recoverable: true,
    retryable: true,
    evidence: input,
    nextAction: "wait_and_retry"
  });
}

export function aiProviderResponseInvalid(provider: string) {
  return appError({
    code: "ai_provider_response_invalid",
    message: "AI provider returned an invalid response.",
    statusCode: 502,
    category: "provider_response_invalid",
    sourceLayer: "external",
    recoverable: true,
    retryable: true,
    evidence: { provider },
    nextAction: "retry"
  });
}

export function aiTaskInputRequired(task: string) {
  return appError({
    code: "ai_task_input_required",
    message: "AI task requires input text or context.",
    statusCode: 400,
    category: "validation_error",
    sourceLayer: "feature",
    recoverable: true,
    retryable: false,
    evidence: { task },
    nextAction: "review_request"
  });
}
