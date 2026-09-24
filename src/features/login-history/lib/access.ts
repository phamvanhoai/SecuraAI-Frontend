import type { AuthSessionUser } from "@/features/authentication-account";

export function canViewLoginHistory(
  user: AuthSessionUser | null | undefined,
): boolean {
  return Boolean(
    user?.status === "active" &&
    user.roles.some(
      (role) => role.code === "ADMIN" || role.code === "SECURITY_OFFICER",
    ) &&
    user.permissions.includes("login-history.read"),
  );
}
