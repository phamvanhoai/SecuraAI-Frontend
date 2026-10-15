import { apiRequest } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import { systemLogSearchResponseSchema, type SystemLogStatus } from "../schemas/system-log-schema";
export type SystemLogSearchQuery = { page: number; limit: number; q?: string; eventType?: string; source?: string; actor?: string; status?: SystemLogStatus; from?: string; to?: string };
export async function searchSystemLogs(query: SystemLogSearchQuery, signal?: AbortSignal) {
  const data = await apiRequest<unknown>("/api/system-logs", { target: "same-origin", query, ...(signal ? { signal } : {}) });
  const parsed = systemLogSearchResponseSchema.safeParse(data);
  if (!parsed.success) throw new ApiError("The system-log response could not be verified.", 502, "UNKNOWN_ERROR");
  return parsed.data;
}
