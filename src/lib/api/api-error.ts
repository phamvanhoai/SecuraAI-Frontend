export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

const statusCodes: Readonly<Record<number, ApiErrorCode>> = {
  400: "BAD_REQUEST",
  401: "UNAUTHENTICATED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  422: "VALIDATION_FAILED",
  429: "RATE_LIMITED",
  500: "SERVER_ERROR",
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: ApiErrorCode,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ErrorEnvelope = { error?: { code?: unknown; message?: unknown } };

function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  return typeof value === "object" && value !== null && "error" in value;
}

export function normalizeApiError(status: number, body: unknown): ApiError {
  const envelope = isErrorEnvelope(body) ? body : undefined;
  const message =
    typeof envelope?.error?.message === "string" ? envelope.error.message : "Đã xảy ra lỗi. Vui lòng thử lại.";
  return new ApiError(message, status, statusCodes[status] ?? "UNKNOWN_ERROR", body);
}
