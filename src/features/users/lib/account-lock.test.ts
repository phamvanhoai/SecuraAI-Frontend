import { describe, expect, it } from "vitest";
import type { AuthSessionUser } from "@/features/auth";
import { ApiError } from "@/lib/api/api-error";
import {
  accountLockAction,
  accountLockError,
  type ManagedUser,
} from "./account-lock";

const actor: AuthSessionUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "admin@example.test",
  fullName: "Admin",
  status: "active",
  mustChangePassword: false,
  mfaEnabled: false,
  roles: [{ code: "ADMIN", name: "Administrator" }],
  permissions: ["users.lock", "users.unlock"],
};
const user: ManagedUser = {
  id: "00000000-0000-4000-8000-000000000002",
  email: "employee@example.test",
  fullName: "Employee",
  employeeCode: "EMP-001",
  status: "active",
  roles: [],
};

describe("account-management UI authorization", () => {
  it("requires ADMIN plus the permission for the current state", () => {
    expect(accountLockAction(actor, user)).toBe("lock");
    expect(accountLockAction(actor, { ...user, status: "locked" })).toBe(
      "unlock",
    );
    expect(
      accountLockAction(
        { ...actor, roles: [{ code: "EMPLOYEE", name: "Employee" }] },
        user,
      ),
    ).toBeNull();
    expect(
      accountLockAction({ ...actor, permissions: ["users.unlock"] }, user),
    ).toBeNull();
    expect(
      accountLockAction(
        { ...actor, permissions: ["users.lock"] },
        { ...user, status: "locked" },
      ),
    ).toBeNull();
  });

  it("disallows self-management and inactive/disabled accounts", () => {
    expect(accountLockAction({ ...actor, status: "locked" }, user)).toBeNull();
    expect(accountLockAction(actor, { ...user, id: actor.id })).toBeNull();
    for (const status of ["inactive", "disabled"] as const) {
      expect(accountLockAction(actor, { ...user, status })).toBeNull();
    }
  });

  it("explains backend conflicts without exposing internal response details", () => {
    expect(
      accountLockError(
        new ApiError("internal detail", 409, "CONFLICT", {
          error: { code: "LAST_ACCOUNT_MANAGER" },
        }),
      ),
    ).toContain("last active administrator");
    expect(
      accountLockError(new ApiError("secret response", 500, "SERVER_ERROR")),
    ).not.toContain("secret");
    expect(
      accountLockError(
        new ApiError("invalid", 409, "CONFLICT", {
          error: { code: "ACCOUNT_STATE_CHANGED" },
        }),
      ),
    ).toContain("Reload");
  });
});
