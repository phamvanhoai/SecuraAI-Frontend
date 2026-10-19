import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_API_BASE_URL: "http://backend.test/api/v1" },
}));

import { publicAuthError } from "./backend-auth";

describe("publicAuthError", () => {
  it("returns generic English login errors", () => {
    expect(publicAuthError(401)).toEqual({
      code: "INVALID_CREDENTIALS",
      message: "Email or password is incorrect.",
    });
    expect(publicAuthError(403).message).toBe("This account cannot sign in.");
    expect(publicAuthError(429).message).toBe(
      "Too many attempts. Please try again later.",
    );
  });
});
