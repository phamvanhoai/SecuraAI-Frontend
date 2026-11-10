import { ApiError } from "@/lib/api/api-error";

export const PENDING_ACCEPTANCE_MESSAGE =
  "This Risk has a pending acceptance request. Changes are unavailable until the request is resolved.";

export function hasPendingAcceptance(
  risk: { acceptances: ReadonlyArray<{ decision: string }> } | undefined,
): boolean {
  return risk?.acceptances.some((item) => item.decision === "pending") ?? false;
}

export function isPendingAcceptanceError(error: unknown): boolean {
  if (!(error instanceof ApiError) || error.status !== 409) return false;
  const details = error.details;
  return typeof details === "object" && details !== null && "error" in details &&
    typeof details.error === "object" && details.error !== null &&
    "code" in details.error && details.error.code === "ACCEPTANCE_PENDING";
}
