import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function GET(
  request: Request,
  context: { params: Promise<{ enrollmentId: string; lessonId: string }> },
): Promise<Response> {
  const p = await context.params;
  return proxyAuthenticatedRequest(
    `/training/learning/${encodeURIComponent(p.enrollmentId)}/lessons/${encodeURIComponent(p.lessonId)}/assessment`,
    { signal: request.signal },
  );
}
