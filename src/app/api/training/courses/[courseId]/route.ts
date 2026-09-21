import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

const path = (courseId: string) =>
  `/training/courses/${encodeURIComponent(courseId)}`;

export async function GET(
  _request: Request,
  context: { params: Promise<{ courseId: string }> },
): Promise<Response> {
  const { courseId } = await context.params;
  return proxyAuthenticatedRequest(path(courseId));
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
): Promise<Response> {
  const { courseId } = await context.params;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.startsWith("multipart/form-data"))
    return proxyAuthenticatedRequest(path(courseId), {
      method: "PATCH",
      body: await request.formData(),
    });
  return proxyAuthenticatedRequest(path(courseId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
