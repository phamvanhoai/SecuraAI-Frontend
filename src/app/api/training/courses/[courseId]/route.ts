import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

type Context = { params: Promise<{ courseId: string }> };

function coursePath(courseId: string): string {
  return `/training/courses/${encodeURIComponent(courseId)}`;
}

export async function GET(_request: Request, context: Context): Promise<Response> {
  const { courseId } = await context.params;
  return proxyAuthenticatedRequest(coursePath(courseId));
}

export async function PATCH(request: Request, context: Context): Promise<Response> {
  const { courseId } = await context.params;
  return proxyAuthenticatedRequest(coursePath(courseId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
