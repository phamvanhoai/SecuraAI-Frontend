import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_BASE_URL: "http://backend.test/api/v1" },
}));

import { POST } from "./route";

afterEach(() => vi.restoreAllMocks());

function request(): Request {
  return new Request("http://frontend.test/api/auth/password-reset/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user@example.com" }),
  });
}

describe("POST /api/auth/password-reset/request", () => {
  it("forwards the public V2 request and its accepted response", async () => {
    const payload = {
      success: true,
      data: { message: "If the account exists, instructions will be sent." },
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json(payload, { status: 202 }));

    const response = await POST(request());

    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/api/v1/auth/password-reset/request",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "user@example.com" }),
        cache: "no-store",
      }),
    );
  });

  it("returns a safe service-unavailable response", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("private host"));

    const response = await POST(request());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Unable to connect to the password reset service.",
      },
    });
  });
});
