import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function POST(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
): Promise<Response> {
  const { courseId } = await context.params;
  return proxyAuthenticatedRequest(
    `/training/courses/${encodeURIComponent(courseId)}/assignments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    },
  );
}
