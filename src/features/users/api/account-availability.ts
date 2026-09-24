import { apiRequest } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-error";
import {
  accountAvailabilityBodySchema,
  accountAvailabilityResultSchema,
  type AccountAvailabilityAction,
  type AccountAvailabilityInput,
  type AccountAvailabilityResult,
} from "../schemas/account-availability-schema";

export async function changeAccountAvailability(input: {
  userId: string;
  action: AccountAvailabilityAction;
  body: AccountAvailabilityInput;
}): Promise<AccountAvailabilityResult> {
  const data = await apiRequest<unknown>(
    input.action === "deactivate"
      ? `/api/users/${encodeURIComponent(input.userId)}/deactivate`
      : `/api/users/${encodeURIComponent(input.userId)}`,
    { method: input.action === "deactivate" ? "POST" : "DELETE", target: "same-origin",
      body: accountAvailabilityBodySchema.parse(input.body) },
  );
  const parsed = accountAvailabilityResultSchema.safeParse(data);
  if (!parsed.success || parsed.data.id !== input.userId ||
    (input.action === "deactivate" && parsed.data.status !== "disabled") ||
    (input.action === "remove" && parsed.data.deletedAt === null)) {
    throw new ApiError("Unable to verify the account change. Reload and try again.", 502, "UNKNOWN_ERROR");
  }
  return parsed.data;
}
