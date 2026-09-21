import { ApiError, normalizeApiError } from "@/lib/api/api-error";
import {
  workflowListResponseSchema,
  type QueryWorkflowDefinitionsInput,
  type WorkflowListResponse,
} from "../schemas/workflow-schema";

async function safeJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(
      "The server returned an invalid response.",
      response.status,
      "UNKNOWN_ERROR",
    );
  }
}

async function fetchWithSessionRefresh(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let response = await fetch(input, init);
  if (response.status !== 401) return response;
  const refreshed = await fetch("/api/auth/refresh", { method: "POST" });
  if (!refreshed.ok) return response;
  response = await fetch(input, init);
  return response;
}

async function workflowRequest<T>(
  path: string,
  schema: { parse(value: unknown): T },
  init?: RequestInit,
): Promise<T> {
  const response = await fetchWithSessionRefresh(path, init);
  const payload = await safeJson(response);
  if (!response.ok) throw normalizeApiError(response.status, payload);
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("success" in payload) ||
    !("data" in payload)
  ) {
    throw new ApiError(
      "The server response does not match the expected contract.",
      response.status,
      "UNKNOWN_ERROR",
      payload,
    );
  }
  return schema.parse((payload as { data: unknown }).data);
}

export async function getWorkflowDefinitions(
  query?: QueryWorkflowDefinitionsInput,
  signal?: AbortSignal,
): Promise<WorkflowListResponse> {
  const searchParams = new URLSearchParams();

  if (query?.page) searchParams.set("page", String(query.page));
  if (query?.limit) searchParams.set("limit", String(query.limit));
  if (query?.search) searchParams.set("search", query.search);
  if (query?.entityType) searchParams.set("entityType", query.entityType);
  if (query?.isActive !== undefined) searchParams.set("isActive", String(query.isActive));
  if (query?.sortBy) searchParams.set("sortBy", query.sortBy);
  if (query?.sortOrder) searchParams.set("sortOrder", query.sortOrder);

  const queryString = searchParams.toString();
  const url = `/api/v1/workflow-definitions${queryString ? `?${queryString}` : ""}`;

  return workflowRequest(url, workflowListResponseSchema, {
    method: "GET",
    ...(signal ? { signal } : {}),
  });
}
