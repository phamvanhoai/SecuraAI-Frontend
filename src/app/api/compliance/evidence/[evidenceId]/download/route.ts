import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
import { z } from "zod";

type Context = { params: Promise<{ evidenceId: string }> };
export async function GET(request: Request, { params }: Context) {
  const { evidenceId } = await params;
  if (!z.uuid().safeParse(evidenceId).success)
    return Response.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Invalid Evidence ID" } },
      { status: 400 },
    );
  return proxyAuthenticatedRequest(
    `/compliance/evidence/${encodeURIComponent(evidenceId)}/download`,
    { signal: request.signal },
  );
}
