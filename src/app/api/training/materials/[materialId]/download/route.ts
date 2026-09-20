import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function GET(
  request: Request,
  context: { params: Promise<{ materialId: string }> },
): Promise<Response> {
  const { materialId } = await context.params;
  return proxyAuthenticatedRequest(
    `/training/materials/${encodeURIComponent(materialId)}/download`,
    { signal: request.signal },
  );
}
