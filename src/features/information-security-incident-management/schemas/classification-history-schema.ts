import { z } from "zod";

const severity = z.enum(["low", "medium", "high", "critical"]);
export const classificationHistorySchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      classifiedAt: z.string().datetime(),
      classifiedBy: z.object({ id: z.uuid(), name: z.string() }).nullable(),
      previousSeverity: severity.nullable(),
      severity: severity.nullable(),
      rationale: z.string().nullable(),
    }),
  ),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});
