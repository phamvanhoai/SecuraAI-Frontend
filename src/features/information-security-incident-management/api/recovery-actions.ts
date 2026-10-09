import { apiRequest } from "@/lib/api/api-client";
import {
  recoveryActionSchema,
  recoveryHistorySchema,
  type RecoveryForm,
} from "../schemas/recovery-action-schema";
export async function listRecoveryActions(
  id: string,
  page: number,
  signal?: AbortSignal,
) {
  return recoveryHistorySchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(id)}/recovery-actions`,
      {
        target: "same-origin",
        cache: "no-store",
        query: { page, limit: 10 },
        ...(signal ? { signal } : {}),
      },
    ),
  );
}
export async function recordRecoveryAction(input: {
  id: string;
  values: RecoveryForm;
}) {
  return recoveryActionSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(input.id)}/recovery-actions`,
      {
        target: "same-origin",
        method: "POST",
        body: {
          description: input.values.description.trim(),
          performedAt: new Date(input.values.performedAt).toISOString(),
        },
      },
    ),
  );
}
