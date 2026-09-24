import { apiRequest } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import {
  accountLockBodySchema,
  accountLockParamsSchema,
  accountLockResultSchema,
  type AccountLockAction,
  type AccountLockInput,
  type AccountLockResult,
} from "../schemas/account-lock-schema";

export async function changeAccountLock({
  userId,
  action,
  input,
}: {
  userId: string;
  action: AccountLockAction;
  input: AccountLockInput;
}): Promise<AccountLockResult> {
  const params = accountLockParamsSchema.parse({ userId, action });
  const data = await apiRequest<unknown>(
    `/api/users/${encodeURIComponent(params.userId)}/${params.action}`,
    {
      method: "POST",
      target: "same-origin",
      body: accountLockBodySchema.parse(input),
    },
  );
  const result = accountLockResultSchema.safeParse(data);
  if (
    !result.success ||
    result.data.id !== params.userId ||
    result.data.status !== (action === "lock" ? "locked" : "active")
  ) {
    throw new ApiError(
      "Unable to verify the account status. Reload the user list before trying again.",
      502,
      "UNKNOWN_ERROR",
    );
  }
  return result.data;
}
