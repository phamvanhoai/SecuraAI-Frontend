import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function POST(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await context.params;
  return proxyAuthenticatedRequest(
    `/training/courses/${encodeURIComponent(courseId)}/duplicate`,
    {
      method: "POST",
      body: await request.text(),
      headers: { "Content-Type": "application/json" },
    },
  );
}
