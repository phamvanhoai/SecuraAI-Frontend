import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

function schedulePath(id: string, scheduleId: string): string {
  return `/integrations/${encodeURIComponent(id)}/schedules/${encodeURIComponent(scheduleId)}`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; scheduleId: string }> },
): Promise<Response> {
  const { id, scheduleId } = await context.params;
  return proxyAuthenticatedRequest(schedulePath(id, scheduleId));
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; scheduleId: string }> },
): Promise<Response> {
  const { id, scheduleId } = await context.params;
  return proxyAuthenticatedRequest(schedulePath(id, scheduleId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; scheduleId: string }> },
): Promise<Response> {
  const { id, scheduleId } = await context.params;
  return proxyAuthenticatedRequest(schedulePath(id, scheduleId), {
    method: "DELETE",
  });
}
