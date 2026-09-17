import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function POST(
  request: Request,
  context: { params: Promise<{ enrollmentId: string }> },
): Promise<Response> {
  const { enrollmentId } = await context.params;
  return proxyAuthenticatedRequest(
    `/training/assessments/${encodeURIComponent(enrollmentId)}/attempts`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
    },
  );
}
