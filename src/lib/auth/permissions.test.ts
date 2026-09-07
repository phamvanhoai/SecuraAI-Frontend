import { describe, expect, it } from "vitest";
import { hasPermission, safeReturnUrl } from "./permissions";

describe("permissions", () => {
  it("requires every requested permission", () => {
    expect(
      hasPermission(
        ["users.read", "users.write"],
        ["users.read", "users.write"],
      ),
    ).toBe(true);
    expect(hasPermission(["users.read"], "users.write")).toBe(false);
  });

  it("rejects external return URLs", () => {
    expect(safeReturnUrl("//evil.example")).toBe("/admin");
    expect(safeReturnUrl("/users?page=2")).toBe("/users?page=2");
  });
});
