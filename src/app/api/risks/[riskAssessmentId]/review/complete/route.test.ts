import { beforeEach, expect, it, vi } from "vitest";
const proxy = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/backend-proxy", () => ({ proxyAuthenticatedRequest: proxy }));
import { POST } from "./route";
const id = "11111111-1111-4111-8111-111111111111";
const body = { conclusion: "Reviewed current exposure.", nextReviewDate: "2027-01-27", expectedUpdatedAt: "2026-10-27T00:00:00Z", expectedOpenedAt: "2026-10-25T00:00:00Z", assessmentId: id };
const context = { params: Promise.resolve({ riskAssessmentId: id }) };
beforeEach(() => { vi.clearAllMocks(); proxy.mockResolvedValue(Response.json({ success: true })); });
it('forwards validated input through authenticated proxy', async () => {
  await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify(body) }), context);
  expect(proxy).toHaveBeenCalledWith(`/risks/${id}/review/complete`, expect.objectContaining({ method: 'POST', body: JSON.stringify(body) }));
});
it('rejects forged actor and malformed input', async () => {
  expect((await POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify({ ...body, actorId: id }) }), context)).status).toBe(422);
  expect((await POST(new Request('http://localhost', { method: 'POST', body: '{' }), context)).status).toBe(422);
  expect(proxy).not.toHaveBeenCalled();
});
