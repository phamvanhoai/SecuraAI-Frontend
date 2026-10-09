import { useQuery } from "@tanstack/react-query";
import { getAuditLogDetail, getAuditLogDiff, listAuditLogs } from "../api/audit-logs";
import type {
  AuditLogDiff,
  AuditLogItem,
  ListAuditLogsQuery,
  PaginatedAuditLogs,
} from "../schemas/audit-log-schema";

export function useAuditLogs(params?: Partial<ListAuditLogsQuery>) {
  return useQuery<PaginatedAuditLogs, Error>({
    queryKey: ["audit-logs", params],
    queryFn: () => listAuditLogs(params),
  });
}

export function useAuditLogDetail(id: string | null) {
  return useQuery<AuditLogItem, Error>({
    queryKey: ["audit-log-detail", id],
    queryFn: () => {
      if (!id) throw new Error("Audit log ID is required");
      return getAuditLogDetail(id);
    },
    enabled: Boolean(id),
  });
}

export function useAuditLogDiff(id: string | null) {
  return useQuery<AuditLogDiff, Error>({
    queryKey: ["audit-log-diff", id],
    queryFn: () => {
      if (!id) throw new Error("Audit log ID is required");
      return getAuditLogDiff(id);
    },
    enabled: Boolean(id),
  });
}

