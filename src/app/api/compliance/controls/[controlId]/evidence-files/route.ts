import { z } from "zod";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

type Context = { params: Promise<{ controlId: string }> };
const fail = (status: number, message: string) =>
  Response.json(
    { success: false, error: { code: "BAD_REQUEST", message } },
    { status },
  );

export async function POST(request: Request, { params }: Context) {
  const { controlId } = await params;
  if (!z.uuid().safeParse(controlId).success)
    return fail(400, "Invalid Control ID");
  if (
    request.headers.get("origin") !== new URL(request.url).origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return fail(403, "Same-origin request required");
  const contentType = request.headers.get("content-type");
  if (!contentType?.startsWith("multipart/form-data"))
    return fail(415, "Multipart form data required");
  return proxyAuthenticatedRequest(
    `/compliance/controls/${encodeURIComponent(controlId)}/evidence-files`,
    {
      method: "POST",
      headers: { "content-type": contentType },
      body: await request.arrayBuffer(),
      signal: request.signal,
    },
  );
}
