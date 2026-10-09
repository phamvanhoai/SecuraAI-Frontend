import { apiRequest } from "@/lib/api/api-client";
import {
  paginatedAuditLogsSchema,
  type ListAuditLogsQuery,
  type PaginatedAuditLogs,
} from "../schemas/audit-log-schema";

export async function listAuditLogs(
  params?: Partial<ListAuditLogsQuery>,
): Promise<PaginatedAuditLogs> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/api/audit-logs?${queryString}` : "/api/audit-logs";

  const data = await apiRequest<unknown>(endpoint, {
    target: "same-origin",
  });

  return paginatedAuditLogsSchema.parse(data);
}
