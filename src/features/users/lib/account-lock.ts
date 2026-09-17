import type { AuthSessionUser } from "@/features/auth";
import { ApiError } from "@/lib/api/api-error";
import type { AccountLockAction } from "../schemas/account-lock-schema";
import type { UserListResponse } from "../schemas/user-schema";

export type ManagedUser = UserListResponse["items"][number];

export function accountLockAction(
  actor: AuthSessionUser,
  user: ManagedUser,
): AccountLockAction | null {
  if (
    actor.status !== "active" ||
    actor.id === user.id ||
    !actor.roles.some((role) => role.code === "ADMIN")
  )
    return null;
  const action =
    user.status === "active"
      ? "lock"
      : user.status === "locked"
        ? "unlock"
        : null;
  return action && actor.permissions.includes(`users.${action}`)
    ? action
    : null;
}

export function accountLockError(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Unable to change the account status. Please try again.";
  }
  const details = error.details;
  const backendError =
    typeof details === "object" && details !== null && "error" in details
      ? details.error
      : undefined;
  const code =
    typeof backendError === "object" &&
    backendError !== null &&
    "code" in backendError
      ? backendError.code
      : undefined;
  if (code === "LAST_ACCOUNT_MANAGER") {
    return "The last active administrator with account-management permissions cannot be locked. Keep another authorized administrator active.";
  }
  if (code === "SELF_ACCOUNT_LOCK_FORBIDDEN") {
    return "You cannot lock or unlock your own account.";
  }
  if (code === "ACCOUNT_STATUS_CONFLICT") {
    return "This account is no longer eligible. Only active accounts can be locked and locked accounts unlocked. Reload the user list.";
  }
  if (code === "ACCOUNT_STATE_CHANGED" || error.status === 409) {
    return "The account changed while you were working. Reload the user list and try again.";
  }
  if (error.status === 401)
    return "Your session has expired. Sign in again to continue.";
  if (error.status === 403)
    return "You no longer have permission to perform this action. Reload the page or contact an administrator.";
  if (error.status === 404)
    return "This user no longer exists. Reload the user list.";
  if (error.status === 422)
    return "The reason or account details are invalid. Check the reason and reload the list if needed.";
  if (error.status === 429)
    return "Too many requests. Wait a moment before trying again.";
  if (error.status === 502)
    return "Unable to verify the account status. Reload the user list before trying again.";
  return "Unable to change the account status. Check your connection and try again.";
}
