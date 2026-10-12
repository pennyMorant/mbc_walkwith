export type StructuredApiErrorBody = {
  code?: string;
  category?: string;
  sourceLayer?: string;
  message?: string;
  recoverable?: boolean;
  retryable?: boolean;
  evidence?: Record<string, unknown>;
  nextAction?: string;
  details?: Record<string, unknown>;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly requestId?: string,
    readonly apiError: StructuredApiErrorBody = {}
  ) {
    super(message);
    this.name = "ApiRequestError";
  }

  get code() {
    return this.apiError.code;
  }

  get category() {
    return this.apiError.category;
  }

  get nextAction() {
    return this.apiError.nextAction;
  }

  get isNotFound() {
    return this.category === "not_found" || this.statusCode === 404;
  }

  get isAuthenticationRequired() {
    return (
      this.category === "authentication_required" || this.statusCode === 401
    );
  }

  get isPermissionDenied() {
    return this.category === "permission_denied" || this.statusCode === 403;
  }

  get isValidationFailure() {
    return this.category === "validation_error" || this.statusCode === 400;
  }

  get isStateConflict() {
    return this.category === "state_conflict" || this.statusCode === 409;
  }

  get isConfigurationMissing() {
    return this.category === "configuration_missing";
  }

  get isCapabilityFailure() {
    return (
      this.apiError.sourceLayer === "capability" ||
      this.category === "external_dependency_failed"
    );
  }

  hasCode(codes: string | readonly string[] | ReadonlySet<string>) {
    if (!this.code) {
      return false;
    }
    if (typeof codes === "string") {
      return this.code === codes;
    }
    return Array.from(codes).includes(this.code);
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

export function formatApiErrorMessage(
  error: unknown,
  fallback = "Request failed."
) {
  if (error == null) {
    return "";
  }
  if (isApiRequestError(error)) {
    return error.message || error.nextAction || fallback;
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallback;
}
