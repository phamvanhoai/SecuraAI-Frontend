import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requestTokenPair: vi.fn(), setAuthCookies: vi.fn() }));

vi.mock("@/lib/auth/backend-auth", () => ({
  requestTokenPair: mocks.requestTokenPair,
  publicAuthError: () => ({ code: "INVALID_CREDENTIALS", message: "Unable to sign in." }),
}));
vi.mock("@/lib/auth/auth-cookies", () => ({ setAuthCookies: mocks.setAuthCookies }));

import { POST } from "./route";

describe("POST /api/auth/google", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores SecuraAI tokens after the backend verifies Google", async () => {
    const tokens = {
      accessToken: "access-token",
      refreshToken: "r".repeat(64),
      expiresIn: "900s",
    };
    mocks.requestTokenPair.mockResolvedValue({
      response: new Response(null, { status: 200 }),
      tokens,
    });
    const request = new Request("http://frontend.test/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential: "google-id-token" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mocks.requestTokenPair).toHaveBeenCalledWith(
      "/auth/google",
      { credential: "google-id-token" },
      request,
    );
    expect(mocks.setAuthCookies).toHaveBeenCalledWith(response, tokens);
  });
});
