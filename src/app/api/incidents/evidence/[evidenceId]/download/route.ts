import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
type Context = { params: Promise<{ evidenceId: string }> };
export async function GET(request: Request, { params }: Context) {
  const { evidenceId } = await params;
  return proxyAuthenticatedRequest(
    `/incidents/evidence/${encodeURIComponent(evidenceId)}/download`,
    {
      signal: request.signal,
    },
  );
}
