import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

type Context = { params: Promise<{ enrollmentId: string }> };
export async function GET(
  _request: Request,
  context: Context,
): Promise<Response> {
  const { enrollmentId } = await context.params;
  return proxyAuthenticatedRequest(
    `/training/enrollments/${encodeURIComponent(enrollmentId)}/certificate`,
    { method: "GET" },
  );
}
export async function POST(
  _request: Request,
  context: Context,
): Promise<Response> {
  const { enrollmentId } = await context.params;
  return proxyAuthenticatedRequest(
    `/training/enrollments/${encodeURIComponent(enrollmentId)}/certificate`,
    { method: "POST" },
  );
}
