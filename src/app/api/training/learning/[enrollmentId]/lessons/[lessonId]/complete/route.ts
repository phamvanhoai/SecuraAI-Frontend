import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ enrollmentId: string; lessonId: string }> },
): Promise<Response> {
  const { enrollmentId, lessonId } = await context.params;
  return proxyAuthenticatedRequest(
    `/training/learning/${encodeURIComponent(enrollmentId)}/lessons/${encodeURIComponent(lessonId)}/complete`,
    { method: "PATCH", signal: request.signal },
  );
}
