import { proxyEvidence } from "@/features/control-assessments/server/control-evidence-proxy";

type Context = { params: Promise<{ controlId: string; evidenceId: string }> };

export async function DELETE(request: Request, { params }: Context) {
  const { controlId, evidenceId } = await params;
  const url = new URL(request.url);
  url.searchParams.set("evidenceId", evidenceId);
  return proxyEvidence(new Request(url, request), controlId, "unlink");
}
