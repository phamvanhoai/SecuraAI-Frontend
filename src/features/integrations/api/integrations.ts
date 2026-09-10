import { ApiError, normalizeApiError } from "@/lib/api/api-error";
import {
  integrationListSchema,
  integrationLogListSchema,
  integrationSchema,
  syncJobListSchema,
  syncScheduleListSchema,
  syncScheduleSchema,
  testConnectionResultSchema,
  type CreateIntegrationInput,
  type CreateSyncScheduleInput,
  type Integration,
  type IntegrationList,
  type IntegrationLogList,
  type IntegrationStatus,
  type IntegrationType,
  type SyncJob,
  type SyncJobList,
  type SyncSchedule,
  type SyncScheduleList,
  type TestConnectionResult,
  type UpdateIntegrationInput,
  type UpdateSyncScheduleInput,
} from "../schemas/integration-schema";

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

async function integrationRequest<T>(
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

export type ListIntegrationsInput = {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  type?: IntegrationType | undefined;
  status?: IntegrationStatus | undefined;
  sortBy?: "name" | "createdAt" | "lastConnectedAt" | "status" | undefined;
  sortOrder?: "asc" | "desc" | undefined;
  signal?: AbortSignal | undefined;
};

export function listIntegrations(
  input: ListIntegrationsInput = {},
): Promise<IntegrationList> {
  const query = new URLSearchParams({
    page: String(input.page ?? 1),
    limit: String(input.limit ?? 20),
    sortBy: input.sortBy ?? "createdAt",
    sortOrder: input.sortOrder ?? "desc",
  });
  if (input.search) query.set("search", input.search);
  if (input.type) query.set("type", input.type);
  if (input.status) query.set("status", input.status);

  return integrationRequest(
    `/api/integrations?${query.toString()}`,
    integrationListSchema,
    input.signal ? { signal: input.signal } : undefined,
  );
}

export function getIntegrationById(
  id: string,
  signal?: AbortSignal,
): Promise<Integration> {
  return integrationRequest(
    `/api/integrations/${encodeURIComponent(id)}`,
    integrationSchema,
    signal ? { signal } : undefined,
  );
}

export function createIntegration(
  input: CreateIntegrationInput,
): Promise<Integration> {
  return integrationRequest("/api/integrations", integrationSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function updateIntegration(
  id: string,
  input: UpdateIntegrationInput,
): Promise<Integration> {
  return integrationRequest(
    `/api/integrations/${encodeURIComponent(id)}`,
    integrationSchema,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function testIntegrationConnection(
  id: string,
  options?: { timeoutMs?: number | undefined },
): Promise<TestConnectionResult> {
  const body =
    options?.timeoutMs !== undefined ? { timeoutMs: options.timeoutMs } : {};
  return integrationRequest(
    `/api/integrations/${encodeURIComponent(id)}/test-connection`,
    testConnectionResultSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export function triggerIntegrationSync(
  id: string,
  options?: { syncScheduleId?: string | undefined },
): Promise<SyncJob> {
  const body = options?.syncScheduleId
    ? { syncScheduleId: options.syncScheduleId }
    : {};
  return integrationRequest(
    `/api/integrations/${encodeURIComponent(id)}/sync`,
    syncJobListSchema.shape.items.element,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export function listSyncSchedules(
  integrationId: string,
  signal?: AbortSignal,
): Promise<SyncScheduleList> {
  return integrationRequest(
    `/api/integrations/${encodeURIComponent(integrationId)}/schedules`,
    syncScheduleListSchema,
    signal ? { signal } : undefined,
  );
}

export function createSyncSchedule(
  integrationId: string,
  input: CreateSyncScheduleInput,
): Promise<SyncSchedule> {
  return integrationRequest(
    `/api/integrations/${encodeURIComponent(integrationId)}/schedules`,
    syncScheduleSchema,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function updateSyncSchedule(
  integrationId: string,
  scheduleId: string,
  input: UpdateSyncScheduleInput,
): Promise<SyncSchedule> {
  return integrationRequest(
    `/api/integrations/${encodeURIComponent(integrationId)}/schedules/${encodeURIComponent(scheduleId)}`,
    syncScheduleSchema,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export async function deleteSyncSchedule(
  integrationId: string,
  scheduleId: string,
): Promise<void> {
  const path = `/api/integrations/${encodeURIComponent(integrationId)}/schedules/${encodeURIComponent(scheduleId)}`;
  const response = await fetchWithSessionRefresh(path, { method: "DELETE" });
  if (response.ok) return;
  throw normalizeApiError(response.status, await safeJson(response));
}

export type ListSyncJobsInput = {
  integrationId: string;
  page?: number | undefined;
  limit?: number | undefined;
  status?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: "asc" | "desc" | undefined;
  signal?: AbortSignal | undefined;
};

export function listSyncJobs(
  input: ListSyncJobsInput,
): Promise<SyncJobList> {
  const query = new URLSearchParams({
    page: String(input.page ?? 1),
    limit: String(input.limit ?? 20),
    sortBy: input.sortBy ?? "createdAt",
    sortOrder: input.sortOrder ?? "desc",
  });
  if (input.status) query.set("status", input.status);

  return integrationRequest(
    `/api/integrations/${encodeURIComponent(input.integrationId)}/sync-jobs?${query.toString()}`,
    syncJobListSchema,
    input.signal ? { signal: input.signal } : undefined,
  );
}

export type ListIntegrationLogsInput = {
  integrationId: string;
  page?: number | undefined;
  limit?: number | undefined;
  level?: string | undefined;
  syncJobId?: string | undefined;
  signal?: AbortSignal | undefined;
};

export function listIntegrationLogs(
  input: ListIntegrationLogsInput,
): Promise<IntegrationLogList> {
  const query = new URLSearchParams({
    page: String(input.page ?? 1),
    limit: String(input.limit ?? 50),
  });
  if (input.level) query.set("level", input.level);
  if (input.syncJobId) query.set("syncJobId", input.syncJobId);

  return integrationRequest(
    `/api/integrations/${encodeURIComponent(input.integrationId)}/logs?${query.toString()}`,
    integrationLogListSchema,
    input.signal ? { signal: input.signal } : undefined,
  );
}
