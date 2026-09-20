import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export function GET(request: Request): Promise<Response> {
  return proxyAuthenticatedRequest(
    `/training/courses${new URL(request.url).search}`,
  );
}

export async function POST(request: Request): Promise<Response> {
  const multipart = request.headers
    .get("content-type")
    ?.startsWith("multipart/form-data");
  if (multipart) {
    return proxyAuthenticatedRequest("/training/courses", {
      method: "POST",
      headers: {
        "Content-Type":
          request.headers.get("content-type") ?? "multipart/form-data",
      },
      body: request.body,
      signal: request.signal,
      // Node fetch requires duplex when forwarding a request stream.
      ...({ duplex: "half" } as { duplex: "half" }),
    });
  }
  return proxyAuthenticatedRequest("/training/courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: await request.text(),
  });
}
