import { useQuery } from "@tanstack/react-query";
import {
  getUserActivityAudit,
  type UserActivityAuditQuery,
} from "../api/user-activity-audit";
export function useUserActivityAudit(query: UserActivityAuditQuery) {
  return useQuery({
    queryKey: ["audit", "user-activities", query],
    queryFn: ({ signal }) => getUserActivityAudit(query, signal),
  });
}
