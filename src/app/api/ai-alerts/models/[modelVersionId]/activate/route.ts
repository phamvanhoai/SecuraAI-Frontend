import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
export async function POST(
  _request: Request,
  context: { params: Promise<{ modelVersionId: string }> },
): Promise<Response> {
  const { modelVersionId } = await context.params;
  return proxyAuthenticatedRequest(
    `/ai-alerts/models/${encodeURIComponent(modelVersionId)}/activate`,
    { method: "POST" },
  );
}
