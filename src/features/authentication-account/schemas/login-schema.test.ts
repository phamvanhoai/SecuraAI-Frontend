import { describe, expect, it } from "vitest";
import { loginSchema } from "./login-schema";

describe("loginSchema", () => {
  it("normalizes email like the backend DTO", () => {
    expect(loginSchema.parse({ email: "USER@Example.com", password: "password123" }).email).toBe("user@example.com");
  });

  it("rejects short passwords", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "short" }).success).toBe(false);
  });
});
