import { z } from "zod";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
const querySchema = z.object({ q: z.string().trim().max(100).default("") }).strict();
export async function GET(request: Request): Promise<Response> {
  const query = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return Response.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid owner search." } }, { status: 422 });
  const search = new URLSearchParams({ q: query.data.q });
  const response = await proxyAuthenticatedRequest(`/assets/owner-options?${search}`, { signal: request.signal });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
