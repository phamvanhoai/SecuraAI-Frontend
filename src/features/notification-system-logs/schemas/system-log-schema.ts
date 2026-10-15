import { z } from "zod";
export const systemLogStatusSchema = z.enum(["SUCCESS", "FAILURE", "DENIED"]);
export const systemLogSearchResponseSchema = z.object({
  items: z.array(z.object({ id: z.uuid(), occurredAt: z.iso.datetime({ offset: true }), eventType: z.string(), source: z.string(), actor: z.string(), actorDetail: z.string().nullable(), status: systemLogStatusSchema, resourceType: z.string(), correlationId: z.string().nullable(), errorCode: z.string().nullable() })),
  pagination: z.object({ page: z.number().int().positive(), limit: z.number().int().positive(), total: z.number().int().nonnegative(), pageCount: z.number().int().positive() }),
});
export type SystemLogStatus = z.infer<typeof systemLogStatusSchema>;
export type SystemLogRecord = z.infer<typeof systemLogSearchResponseSchema>["items"][number];
