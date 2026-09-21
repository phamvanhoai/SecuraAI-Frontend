import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function GET(
  request: Request,
  context: { params: Promise<{ enrollmentId: string; materialId: string }> },
): Promise<Response> {
  const p = await context.params;
  return proxyAuthenticatedRequest(
    `/training/learning/${encodeURIComponent(p.enrollmentId)}/materials/${encodeURIComponent(p.materialId)}/download`,
    { signal: request.signal },
  );
}
