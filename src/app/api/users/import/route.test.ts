import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/backend-proxy", () => ({
  proxyAuthenticatedRequest: vi.fn(),
}));

import { proxyAuthenticatedRequest } from "@/lib/api/backend-proxy";
import { POST } from "./route";

describe("POST /api/users/import", () => {
  beforeEach(() => vi.clearAllMocks());

  it("forwards the uploaded workbook to the authenticated backend", async () => {
    const response = Response.json({ success: true });
    vi.mocked(proxyAuthenticatedRequest).mockResolvedValue(response);
    const form = new FormData();
    form.set("file", new File(["xlsx"], "users.xlsx"));
    const request = new Request("http://localhost/api/users/import", {
      method: "POST",
      body: form,
    });

    await expect(POST(request)).resolves.toBe(response);
    expect(proxyAuthenticatedRequest).toHaveBeenCalledWith(
      "/users/import",
      expect.objectContaining({ method: "POST" }),
    );
    const init = vi.mocked(proxyAuthenticatedRequest).mock.calls[0]?.[1];
    expect(typeof (init?.body as FormData).get).toBe("function");
  });
});
