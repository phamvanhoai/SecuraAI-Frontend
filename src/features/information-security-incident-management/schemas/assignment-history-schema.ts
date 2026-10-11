import { z } from "zod";

const actor = z.object({ id: z.uuid(), name: z.string() }).nullable();
export const assignmentHistorySchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      assignedAt: z.string().datetime(),
      assignedBy: actor,
      previousHandler: actor,
      handler: actor,
      note: z.string().nullable(),
    }),
  ),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});
