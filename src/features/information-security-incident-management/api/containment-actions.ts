import { apiRequest } from "@/lib/api/api-client";
import {
  containmentActionSchema,
  containmentHistorySchema,
  type ContainmentForm,
} from "../schemas/containment-action-schema";
export async function listContainmentActions(
  id: string,
  page: number,
  signal?: AbortSignal,
) {
  return containmentHistorySchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(id)}/containment-actions`,
      {
        target: "same-origin",
        cache: "no-store",
        query: { page, limit: 10 },
        ...(signal ? { signal } : {}),
      },
    ),
  );
}
export async function recordContainmentAction(input: {
  id: string;
  values: ContainmentForm;
}) {
  return containmentActionSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(input.id)}/containment-actions`,
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
