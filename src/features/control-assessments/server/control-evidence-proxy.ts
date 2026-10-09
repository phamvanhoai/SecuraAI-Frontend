import "server-only";
import { z } from "zod";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
import {
  addControlEvidenceSchema,
  linkControlEvidenceSchema,
  listControlEvidenceQuerySchema,
} from "../schemas/control-evidence-schema";
const fail = (status: number, message: string) =>
  Response.json(
    {
      success: false,
      error: { code: status === 403 ? "FORBIDDEN" : "BAD_REQUEST", message },
    },
    { status },
  );
export async function proxyEvidence(
  request: Request,
  id: string,
  operation: "list" | "add" | "link",
) {
  if (!z.uuid().safeParse(id).success) return fail(400, "Invalid Control ID");
  const path = `/compliance/controls/${encodeURIComponent(id)}`;
  if (operation === "list") {
    const parsed = listControlEvidenceQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) return fail(400, "Invalid evidence search");
    const q = parsed.data;
    return proxyAuthenticatedRequest(
      `${path}/evidence?${new URLSearchParams({ q: q.q, view: q.view, page: String(q.page), limit: String(q.limit) })}`,
      { signal: request.signal },
    );
  }
  if (
    request.headers.get("origin") !== new URL(request.url).origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return fail(403, "Same-origin request required");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return fail(415, "JSON body required");
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "Invalid JSON body");
  }
  const parsed = (
    operation === "add" ? addControlEvidenceSchema : linkControlEvidenceSchema
  ).safeParse(body);
  if (!parsed.success) return fail(400, "Invalid evidence fields");
  return proxyAuthenticatedRequest(
    `${path}/${operation === "add" ? "evidence" : "evidence-links"}`,
    {
      method: "POST",
      body: JSON.stringify(parsed.data),
      headers: { "content-type": "application/json" },
      signal: request.signal,
    },
  );
}
