import { z } from "zod";
export const closureFormSchema = z.object({
  summary: z.string().trim().min(20).max(4000),
  confirmed: z.literal(true),
});
export type ClosureForm = z.infer<typeof closureFormSchema>;
export const incidentClosureSchema = z.object({
  status: z.enum([
    "open",
    "triage",
    "containment",
    "eradication",
    "recovery",
    "lessons_learned",
    "closed",
  ]),
  expectedUpdatedAt: z.string().datetime(),
  closedAt: z.string().datetime().nullable(),
  canClose: z.boolean(),
  restriction: z.string().nullable(),
  closure: z
    .object({
      id: z.string().uuid(),
      recordedAt: z.string().datetime(),
      closedBy: z
        .object({ id: z.string().uuid(), name: z.string() })
        .nullable(),
      summary: z.string().nullable(),
    })
    .nullable(),
});
export const closedIncidentSchema = z.object({
  changed: z.boolean(),
  closedAt: z.string().datetime().nullable(),
});
