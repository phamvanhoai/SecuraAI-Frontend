import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

type Context = { params: Promise<{ evidenceId: string }> };

export async function DELETE(request: Request, { params }: Context) {
  const { evidenceId } = await params;
  return proxyAuthenticatedRequest(
    `/incidents/evidence/${encodeURIComponent(evidenceId)}`,
    {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: await request.text(),
      signal: request.signal,
    },
  );
}
