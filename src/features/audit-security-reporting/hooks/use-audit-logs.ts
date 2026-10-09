import { useQuery } from "@tanstack/react-query";
import { listAuditLogs } from "../api/audit-logs";
import type {
  ListAuditLogsQuery,
  PaginatedAuditLogs,
} from "../schemas/audit-log-schema";

export function useAuditLogs(params?: Partial<ListAuditLogsQuery>) {
  return useQuery<PaginatedAuditLogs, Error>({
    queryKey: ["audit-logs", params],
    queryFn: () => listAuditLogs(params),
  });
}
