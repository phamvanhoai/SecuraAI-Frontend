import { proxyEvidence } from "@/features/control-assessments/server/control-evidence-proxy";
type Context = { params: Promise<{ controlId: string }> };
export async function POST(request: Request, { params }: Context) {
  return proxyEvidence(request, (await params).controlId, "link");
}
