"use client";
import { useQuery } from "@tanstack/react-query";
import { listLoginHistory } from "../api/list-login-history";
import type { LoginHistoryQuery } from "../schemas/login-history-schema";

export function useLoginHistory(query: LoginHistoryQuery, enabled: boolean) {
  return useQuery({
    queryKey: ["login-history", query],
    queryFn: ({ signal }) => listLoginHistory(query, signal),
    enabled,
    retry: false,
  });
}
