/** Check the browser authority, not a standalone container's internal hostname.
 * Deliberately ignore forwarded headers: they require a trusted proxy policy.
 */
export function isSameOriginRequest(request: Request): boolean {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const url = new URL(request.url);
  const host = request.headers.get("host") ?? url.host;
  return request.headers.get("origin") === `${url.protocol}//${host}`;
}
