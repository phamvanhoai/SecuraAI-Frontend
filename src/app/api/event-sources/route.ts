/**
 * Layer: Next.js BFF API Route (/api/event-sources)
 * Purpose: Same-origin server proxy that attaches HttpOnly session auth before forwarding requests to the backend API.
 * Flow: Feature API -> Next.js BFF Route -> Backend /api/v1/event-sources
 */
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

/**
 * Next.js BFF proxy for GET /api/event-sources.
 * Forwards query parameters (page, limit, q, status, sortBy, sortOrder) and the
 * HttpOnly session credentials to the backend GET /api/v1/event-sources endpoint.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  return proxyAuthenticatedRequest(`/event-sources${url.search}`, {
    method: "GET",
  });
}

/** Next.js BFF proxy for POST /api/event-sources: forwards source registration payload to the backend. */
export async function POST(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest("/event-sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
