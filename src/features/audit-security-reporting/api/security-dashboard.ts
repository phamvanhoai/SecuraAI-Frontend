import { apiRequest } from "@/lib/api/api-client";
import {
  securityDashboardResponseSchema,
  type SecurityDashboardResponse,
} from "../schemas/security-dashboard-schema";

export async function getSecurityDashboard(): Promise<SecurityDashboardResponse> {
  const data = await apiRequest<unknown>("/api/dashboard/security-posture", {
    target: "same-origin",
  });
  return securityDashboardResponseSchema.parse(data);
}
