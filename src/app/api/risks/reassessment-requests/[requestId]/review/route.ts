import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> },
): Promise<Response> {
  const { requestId } = await params;
  return proxyAuthenticatedRequest(
    `/risks/reassessment-requests/${encodeURIComponent(requestId)}/review`,
    { method: "POST" },
  );
}
