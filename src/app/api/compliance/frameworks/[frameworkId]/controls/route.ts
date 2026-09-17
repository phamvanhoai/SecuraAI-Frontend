import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

type Context = { params: Promise<{ frameworkId: string }> };

export async function GET(request: Request, context: Context) {
  const { frameworkId } = await context.params;
  return proxyAuthenticatedRequest(
    `/compliance/frameworks/${encodeURIComponent(frameworkId)}/controls${new URL(request.url).search}`,
  );
}
