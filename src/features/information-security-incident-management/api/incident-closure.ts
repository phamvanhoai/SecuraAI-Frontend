import { apiRequest } from "@/lib/api/api-client";
import {
  closedIncidentSchema,
  incidentClosureSchema,
  type ClosureForm,
} from "../schemas/incident-closure-schema";
export async function getIncidentClosure(id: string, signal?: AbortSignal) {
  return incidentClosureSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(id)}/close`,
      {
        target: "same-origin",
        cache: "no-store",
        ...(signal ? { signal } : {}),
      },
    ),
  );
}
export async function closeIncident(input: {
  id: string;
  values: ClosureForm;
  expectedUpdatedAt: string;
}) {
  return closedIncidentSchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(input.id)}/close`,
      {
        target: "same-origin",
        method: "POST",
        body: { ...input.values, expectedUpdatedAt: input.expectedUpdatedAt },
      },
    ),
  );
}
