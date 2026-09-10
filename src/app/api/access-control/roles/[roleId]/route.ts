import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

function rolePath(roleId: string): string {
  return `/access-control/roles/${encodeURIComponent(roleId)}`;
}

export async function GET(
  _request: Request,
  context: RouteContext<"/api/access-control/roles/[roleId]">,
): Promise<Response> {
  const { roleId } = await context.params;
  return proxyAuthenticatedRequest(rolePath(roleId));
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/access-control/roles/[roleId]">,
): Promise<Response> {
  const { roleId } = await context.params;
  return proxyAuthenticatedRequest(rolePath(roleId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/access-control/roles/[roleId]">,
): Promise<Response> {
  const { roleId } = await context.params;
  return proxyAuthenticatedRequest(rolePath(roleId), { method: "DELETE" });
}
