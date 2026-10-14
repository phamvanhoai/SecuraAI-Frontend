import { useQuery } from "@tanstack/react-query";
import { getSecurityDashboard } from "../api/security-dashboard";

export const securityDashboardQueryKey = ["security-dashboard"] as const;

export function useSecurityDashboard() {
  return useQuery({
    queryKey: securityDashboardQueryKey,
    queryFn: getSecurityDashboard,
    staleTime: 60 * 1000,
  });
}
