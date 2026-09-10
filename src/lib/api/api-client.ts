import { env } from "@/lib/env";
import { ApiError, normalizeApiError } from "./api-error";

export type QueryValue = string | number | boolean | null | undefined;
export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  query?: Readonly<Record<string, QueryValue>>;
  target?: "backend" | "same-origin";
};

type SuccessEnvelope<T> = { success: true; data: T };

function buildUrl(
  path: string,
  query: Readonly<Record<string, QueryValue>> | undefined,
  target: "backend" | "same-origin",
): string {
  if (target === "same-origin") {
    const parameters = new URLSearchParams();
    Object.entries(query ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null)
        parameters.set(key, String(value));
    });
    const suffix = parameters.size > 0 ? `?${parameters.toString()}` : "";
    return `${path}${suffix}`;
  }
  const base = env.NEXT_PUBLIC_API_BASE_URL.endsWith("/")
    ? env.NEXT_PUBLIC_API_BASE_URL
    : `${env.NEXT_PUBLIC_API_BASE_URL}/`;
  const url = new URL(path.replace(/^\//, ""), base);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null)
      url.searchParams.set(key, String(value));
  });
  return url.toString();
}

async function safeJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(
      "Phản hồi máy chủ không hợp lệ.",
      response.status,
      "UNKNOWN_ERROR",
    );
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { body, headers, query, target = "backend", ...init } = options;
  let response: Response;
  try {
    response = await fetch(buildUrl(path, query, target), {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (cause: unknown) {
    throw new ApiError("Không thể kết nối máy chủ.", 0, "NETWORK_ERROR", cause);
  }
  const payload = await safeJson(response);
  if (!response.ok) throw normalizeApiError(response.status, payload);
  if (response.status === 204) return undefined as T;
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("success" in payload) ||
    !("data" in payload)
  ) {
    throw new ApiError(
      "Phản hồi máy chủ không đúng contract.",
      response.status,
      "UNKNOWN_ERROR",
      payload,
    );
  }
  return (payload as SuccessEnvelope<T>).data;
}
