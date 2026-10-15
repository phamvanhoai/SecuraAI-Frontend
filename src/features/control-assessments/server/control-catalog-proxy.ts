import "server-only";
import { z } from "zod";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
import {
  createControlSchema,
  editControlSchema,
} from "../schemas/control-catalog-schema";
const fail = (status: number, message: string) =>
  Response.json(
    {
      success: false,
      error: { code: status === 403 ? "FORBIDDEN" : "BAD_REQUEST", message },
    },
    { status },
  );
export async function proxyControlWrite(request: Request, id?: string) {
  const origin = request.headers.get("origin");
  if (
    origin !== new URL(request.url).origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return fail(403, "Same-origin request required");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return fail(415, "JSON body required");
  if (id && !z.uuid().safeParse(id).success)
    return fail(400, "Invalid control ID");
  try {
    const raw: unknown = await request.json();
    const result = (id ? editControlSchema : createControlSchema).safeParse(
      raw,
    );
    if (!result.success) return fail(400, "Invalid control fields");
    return proxyAuthenticatedRequest(
      id
        ? `/compliance/controls/${encodeURIComponent(id)}`
        : "/compliance/controls",
      {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(result.data),
        headers: { "content-type": "application/json" },
        signal: request.signal,
      },
    );
  } catch {
    return fail(400, "Invalid JSON body");
  }
}
export function proxyControlRead(request: Request, id: string) {
  if (!z.uuid().safeParse(id).success)
    return Promise.resolve(fail(400, "Invalid control ID"));
  return proxyAuthenticatedRequest(
    `/compliance/controls/${encodeURIComponent(id)}`,
    { signal: request.signal },
  );
}
export function proxyControlOwners(request: Request) {
  const query = new URL(request.url).searchParams;
  const result = z
    .object({ q: z.string().trim().max(100).default("") })
    .strict()
    .safeParse(Object.fromEntries(query));
  if (!result.success)
    return Promise.resolve(fail(400, "Invalid owner search"));
  return proxyAuthenticatedRequest(
    `/compliance/controls/owner-options?${new URLSearchParams(result.data)}`,
    { signal: request.signal },
  );
}
