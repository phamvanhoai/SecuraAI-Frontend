import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(request: Request): Promise<Response> {
  const response = await proxyAuthenticatedRequest(
    `/training/deadline-reminders${new URL(request.url).search}`,
  );
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
