import { describe, expect, it } from "vitest";
import type { AuthSessionUser } from "@/features/authentication-account";
import { canViewLoginHistory } from "./access";
const user: AuthSessionUser = {
  id: "user",
  email: "user@example.test",
  fullName: "Test User",
  status: "active",
  mustChangePassword: false,
  mfaEnabled: false,
  roles: [],
  permissions: ["login-history.read"],
};
describe("login history access", () => {
  it.each(["ADMIN", "SECURITY_OFFICER"])(
    "allows %s with the permission",
    (code) => {
      expect(
        canViewLoginHistory({ ...user, roles: [{ code, name: code }] }),
      ).toBe(true);
    },
  );
  it.each(["EMPLOYEE", "MANAGER", "EXECUTIVE", "SECURITY_OFFICER_CUSTOM"])(
    "denies %s even with the permission",
    (code) => {
      expect(
        canViewLoginHistory({ ...user, roles: [{ code, name: code }] }),
      ).toBe(false);
    },
  );
  it("denies missing sessions, inactive accounts and missing permissions", () => {
    expect(canViewLoginHistory(null)).toBe(false);
    expect(
      canViewLoginHistory({
        ...user,
        roles: [{ code: "ADMIN", name: "Admin" }],
        permissions: [],
      }),
    ).toBe(false);
    expect(
      canViewLoginHistory({
        ...user,
        roles: [{ code: "ADMIN", name: "Admin" }],
        status: "locked",
      }),
    ).toBe(false);
  });
});
