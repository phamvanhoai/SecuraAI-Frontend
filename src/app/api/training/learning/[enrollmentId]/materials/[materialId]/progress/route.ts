import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ enrollmentId: string; materialId: string }> },
): Promise<Response> {
  const { enrollmentId, materialId } = await context.params;
  return proxyAuthenticatedRequest(
    `/training/learning/${encodeURIComponent(enrollmentId)}/materials/${encodeURIComponent(materialId)}/progress`,
    { method: "PATCH", body: await request.text(), signal: request.signal },
  );
}
