import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function GET(
  _request: Request,
  context: { params: Promise<{ enrollmentId: string }> },
): Promise<Response> {
  const { enrollmentId } = await context.params;
  return proxyAuthenticatedRequest(
    `/training/assessments/${encodeURIComponent(enrollmentId)}`,
  );
}
