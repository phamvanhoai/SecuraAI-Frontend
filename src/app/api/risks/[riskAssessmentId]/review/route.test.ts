import { expect, it, vi } from "vitest";
import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
import { POST } from "./route";
vi.mock("@/lib/api/backend-proxy", () => ({
  proxyAuthenticatedRequest: vi.fn(),
}));
it("rejects malformed review before proxying", async () => {
  const result = await POST(
    new Request("http://localhost/api/risks/test/review", {
      method: "POST",
      body: JSON.stringify({ reason: "short" }),
    }),
    { params: Promise.resolve({ riskAssessmentId: "bad" }) },
  );
  expect(result.status).toBe(422);
  expect(proxyAuthenticatedRequest).not.toHaveBeenCalled();
});
it("forwards a valid review to the authenticated backend", async () => {
  const id = "11111111-1111-4111-8111-111111111111";
  const body = {
    reason: "Review expired acceptance and current exposure.",
    expectedUpdatedAt: "2026-10-14T00:00:00Z",
  };
  vi.mocked(proxyAuthenticatedRequest).mockResolvedValue(
    Response.json({ success: true }),
  );
  const response = await POST(
    new Request(`http://localhost/api/risks/${id}/review`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ riskAssessmentId: id }) },
  );
  expect(response.status).toBe(200);
  expect(proxyAuthenticatedRequest).toHaveBeenCalledWith(
    `/risks/${id}/review`,
    expect.objectContaining({ method: "POST", body: JSON.stringify(body) }),
  );
});
