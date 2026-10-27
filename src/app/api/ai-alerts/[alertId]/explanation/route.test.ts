import { beforeEach, expect, it, vi } from "vitest";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
import { POST } from "./route";

vi.mock("@/lib/api/backend-proxy", () => ({
  proxyAuthenticatedRequest: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

it("forwards the regeneration JSON body and content type", async () => {
  const alertId = "11111111-1111-4111-8111-111111111111";
  const body = { reason: "Review explanation accuracy" };
  vi.mocked(proxyAuthenticatedRequest).mockResolvedValue(
    Response.json({ success: true }),
  );

  const response = await POST(
    new Request(`http://localhost/api/ai-alerts/${alertId}/explanation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ alertId }) },
  );

  expect(response.status).toBe(200);
  expect(proxyAuthenticatedRequest).toHaveBeenCalledWith(
    `/ai-alerts/${alertId}/explanation/regenerate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
});
