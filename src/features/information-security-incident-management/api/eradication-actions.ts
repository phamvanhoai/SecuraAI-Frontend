import { apiRequest } from "@/lib/api/api-client";
import {
  eradicationActionSchema,
  eradicationHistorySchema,
  type EradicationForm,
} from "../schemas/eradication-action-schema";
export async function listEradicationActions(
  id: string,
  page: number,
  signal?: AbortSignal,
) {
  return eradicationHistorySchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(id)}/eradication-actions`,
      {
        target: "same-origin",
        cache: "no-store",
        query: { page, limit: 10 },
        ...(signal ? { signal } : {}),
      },
    ),
  );
}
export async function recordEradicationAction(input: {
  id: string;
  values: EradicationForm;
}) {
  return eradicationActionSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(input.id)}/eradication-actions`,
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
