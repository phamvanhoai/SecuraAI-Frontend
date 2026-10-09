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
  if (params?.search) searchParams.set("search", params.search);
  if (params?.actor) searchParams.set("actor", params.actor);
  if (params?.actorType) searchParams.set("actorType", params.actorType);
  if (params?.action) searchParams.set("action", params.action);
  if (params?.resourceType) searchParams.set("resourceType", params.resourceType);
  if (params?.correlationId) searchParams.set("correlationId", params.correlationId);
  if (params?.startDate) searchParams.set("startDate", params.startDate);
  if (params?.endDate) searchParams.set("endDate", params.endDate);
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const queryString = searchParams.toString();
  const endpoint = queryString ? `/api/audit-logs?${queryString}` : "/api/audit-logs";

  const data = await apiRequest<unknown>(endpoint, {
    target: "same-origin",
  });

  return paginatedAuditLogsSchema.parse(data);
}
