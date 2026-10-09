import { useQuery } from "@tanstack/react-query";
import {
  searchSystemLogs,
  type SystemLogSearchQuery,
} from "../api/search-system-logs";
export function useSystemLogSearch(
  query: SystemLogSearchQuery,
  searchRequest: number,
) {
  return useQuery({
    queryKey: ["system-logs", "search", query, searchRequest],
    queryFn: ({ signal }) => searchSystemLogs(query, signal),
  });
}
