import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function POST(
  request: Request,
  context: { params: Promise<{ enrollmentId: string; lessonId: string }> },
): Promise<Response> {
  const p = await context.params;
  return proxyAuthenticatedRequest(
    `/training/learning/${encodeURIComponent(p.enrollmentId)}/lessons/${encodeURIComponent(p.lessonId)}/assessment/attempts`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
      signal: request.signal,
    },
  );
}
