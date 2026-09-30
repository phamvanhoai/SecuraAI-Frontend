import { describe, expect, it } from "vitest";
import { sessionUserSchema } from "./session-user";

describe("sessionUserSchema", () => {
  it("accepts effective backend permissions", () => {
    const result = sessionUserSchema.parse({
      id: "user-1",
      email: "officer@securaai.local",
      fullName: "Security Officer",
      status: "active",
      mustChangePassword: false,
      roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }],
      permissions: ["assets.read", "assets.create"],
    });
    expect(result.permissions).toEqual(["assets.read", "assets.create"]);
  });

  it("rejects a session response without permissions", () => {
    expect(
      sessionUserSchema.safeParse({
        id: "user-1",
        email: "employee@securaai.local",
        fullName: "Employee",
        status: "active",
        mustChangePassword: false,
        roles: [],
      }).success,
    ).toBe(false);
  });
});
