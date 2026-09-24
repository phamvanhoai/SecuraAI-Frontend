import { apiRequest } from "@/lib/api/api-client";
import {
  logSourceListSchema,
  logSourceSchema,
  type LogSource,
  type LogSourceForm,
  type LogSourceList,
} from "../schemas/log-source-schema";

export type LogSourceQuery = {
  page: number;
  limit: number;
  q?: string;
  sourceType?: string;
  status?: string;
};

export type LogSourceMetrics = {
  total: number;
  active: number;
  receiving: number;
  errors: number;
};

export async function listLogSources(
  query: LogSourceQuery,
  signal?: AbortSignal,
): Promise<LogSourceList> {
  const data = await apiRequest<unknown>(
    "/api/security-monitoring/log-sources",
    { target: "same-origin", query, ...(signal ? { signal } : {}) },
  );
  return logSourceListSchema.parse(data);
}

export async function getLogSourceMetrics(
  signal?: AbortSignal,
): Promise<LogSourceMetrics> {
  const firstPage = await listLogSources({ page: 1, limit: 100 }, signal);
  const remainingPages = await Promise.all(
    Array.from(
      { length: Math.max(firstPage.pagination.totalPages - 1, 0) },
      (_, index) => listLogSources({ page: index + 2, limit: 100 }, signal),
    ),
  );
  const items = [firstPage, ...remainingPages].flatMap(
    (result) => result.items,
  );
  return {
    total: firstPage.pagination.total,
    active: items.filter((item) => item.status === "active").length,
    receiving: items.filter((item) => item.lastReceivedAt !== null).length,
    errors: items.filter((item) => item.status === "error").length,
  };
}

function payload(values: LogSourceForm) {
  return {
    name: values.name,
    sourceType: values.sourceType,
    status: values.status,
    configuration: {
      format: values.format,
      timezone: values.timezone,
      collectRawPayload: values.collectRawPayload,
      ...(values.pollingIntervalSeconds
        ? { pollingIntervalSeconds: values.pollingIntervalSeconds }
        : {}),
    },
  };
}

export async function createLogSource(
  values: LogSourceForm,
): Promise<LogSource> {
  return logSourceSchema.parse(
    await apiRequest<unknown>("/api/security-monitoring/log-sources", {
      target: "same-origin",
      method: "POST",
      body: payload(values),
    }),
  );
}

export async function updateLogSource(
  id: string,
  values: LogSourceForm,
): Promise<LogSource> {
  const body = {
    name: values.name,
    status: values.status,
    configuration: payload(values).configuration,
  };
  return logSourceSchema.parse(
    await apiRequest<unknown>(
      `/api/security-monitoring/log-sources/${encodeURIComponent(id)}`,
      { target: "same-origin", method: "PATCH", body },
    ),
  );
}

export async function deleteLogSource(id: string): Promise<void> {
  await apiRequest<void>(
    `/api/security-monitoring/log-sources/${encodeURIComponent(id)}`,
    { target: "same-origin", method: "DELETE" },
  );
}
