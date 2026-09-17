import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export function GET(request: Request) {
  return proxyAuthenticatedRequest(
    `/notifications/compliance-reminders${new URL(request.url).search}`,
  );
}
