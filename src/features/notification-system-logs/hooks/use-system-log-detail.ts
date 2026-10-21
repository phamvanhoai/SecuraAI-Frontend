import { useQuery } from "@tanstack/react-query";
import { getSystemLogDetail } from "../api/get-system-log-detail";

export function useSystemLogDetail(logId: string | null) {
  return useQuery({
    queryKey: ["system-logs", "detail", logId],
    queryFn: ({ signal }) => getSystemLogDetail(logId ?? "", signal),
    enabled: Boolean(logId),
  });
}
