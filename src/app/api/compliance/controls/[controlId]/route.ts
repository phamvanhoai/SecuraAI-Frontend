import {
  proxyControlRead,
  proxyControlWrite,
} from "@/features/control-assessments/server/control-catalog-proxy";
type Context = { params: Promise<{ controlId: string }> };
export async function GET(request: Request, { params }: Context) {
  return proxyControlRead(request, (await params).controlId);
}
export async function PATCH(request: Request, { params }: Context) {
  return proxyControlWrite(request, (await params).controlId);
}
