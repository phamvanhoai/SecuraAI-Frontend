import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  return proxyAuthenticatedRequest("/users/import", {
    method: "POST",
    body: form,
  });
}
