import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function GET(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
): Promise<Response> {
  const { courseId } = await context.params;
  return proxyAuthenticatedRequest(
    `/training/courses/${encodeURIComponent(courseId)}/content`,
    { signal: request.signal },
  );
}
