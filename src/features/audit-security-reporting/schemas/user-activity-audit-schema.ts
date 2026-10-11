import { z } from "zod";
export const auditOutcomeSchema = z.enum(["SUCCESS", "FAILURE", "DENIED"]);
export const userActivityAuditResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      actor: z.object({
        id: z.uuid().nullable(),
        name: z.string(),
        email: z.email().nullable(),
      }),
      action: z.string(),
      resource: z.object({ type: z.string(), id: z.uuid().nullable() }),
      occurredAt: z.iso.datetime({ offset: true }),
      outcome: auditOutcomeSchema,
      source: z.string().nullable(),
      sourceIp: z.string().nullable(),
      errorCode: z.string().nullable(),
    }),
  ),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    pageCount: z.number().int().positive(),
  }),
});
export type AuditOutcome = z.infer<typeof auditOutcomeSchema>;
export type UserActivityAuditRecord = z.infer<
  typeof userActivityAuditResponseSchema
>["items"][number];
