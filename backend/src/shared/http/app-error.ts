export type ErrorSourceLayer =
  | "surface"
  | "feature"
  | "domain"
  | "capability"
  | "repository"
  | "external"
  | "unknown";

export type AppErrorOptions = {
  code: string;
  message: string;
  statusCode?: number;
  category?: string;
  sourceLayer?: ErrorSourceLayer;
  recoverable?: boolean;
  retryable?: boolean;
  evidence?: Record<string, unknown>;
  nextAction?: string;
  details?: Record<string, unknown>;
};

export class AppError extends Error {
  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = "AppError";
    this.code = options.code;
    this.statusCode = options.statusCode ?? 500;
    this.category = options.category ?? options.code;
    this.sourceLayer = options.sourceLayer ?? "unknown";
    this.recoverable = options.recoverable ?? this.statusCode < 500;
    this.retryable = options.retryable ?? this.statusCode >= 500;
    this.evidence = options.evidence ?? {};
    this.nextAction = options.nextAction ?? nextActionForStatus(this.statusCode);
    this.details = options.details ?? {};
  }

  readonly code: string;
  readonly statusCode: number;
  readonly category: string;
  readonly sourceLayer: ErrorSourceLayer;
  readonly recoverable: boolean;
  readonly retryable: boolean;
  readonly evidence: Record<string, unknown>;
  readonly nextAction: string;
  readonly details: Record<string, unknown>;
}

export function appError(options: AppErrorOptions) {
  return new AppError(options);
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function nextActionForStatus(statusCode: number) {
  if (statusCode === 401) {
    return "sign_in";
  }
  if (statusCode === 403) {
    return "request_permission";
  }
  if (statusCode === 404) {
    return "refresh";
  }
  if (statusCode === 409) {
    return "refresh";
  }
  if (statusCode >= 500) {
    return "retry";
  }
  return "review_request";
}
