import { z } from "zod";
import { apiRequest } from "@/lib/api/api-client";

const phaseSchema = z.enum([
  "OPEN",
  "TRIAGE",
  "CONTAINMENT",
  "ERADICATION",
  "RECOVERY",
  "LESSONS_LEARNED",
  "CLOSED",
]);
export const phaseHistorySchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      occurredAt: z.iso.datetime(),
      actor: z.object({ id: z.uuid(), name: z.string() }).nullable(),
      before: z.object({ status: phaseSchema }),
      after: z.object({
        status: phaseSchema,
        note: z.string(),
        skipReason: z.string().nullable(),
        skippedPhases: z.array(phaseSchema),
        currentPhaseCompleted: z.boolean(),
        recoveryVerified: z.boolean(),
      }),
    }),
  ),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});
export async function listIncidentPhaseHistory(
  id: string,
  page: number,
  signal?: AbortSignal,
) {
  return phaseHistorySchema.parse(
    await apiRequest<unknown>(
      `/api/incidents/${encodeURIComponent(id)}/progress`,
      {
        target: "same-origin",
        cache: "no-store",
        query: { page, limit: 10 },
        ...(signal ? { signal } : {}),
      },
    ),
  );
}
