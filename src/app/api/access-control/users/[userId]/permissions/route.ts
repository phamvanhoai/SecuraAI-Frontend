import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

function userPermissionPath(userId: string): string {
  return `/access-control/users/${encodeURIComponent(userId)}/permissions`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
): Promise<Response> {
  const { userId } = await context.params;
  return proxyAuthenticatedRequest(userPermissionPath(userId));
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ userId: string }> },
): Promise<Response> {
  const { userId } = await context.params;
  return proxyAuthenticatedRequest(userPermissionPath(userId), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
