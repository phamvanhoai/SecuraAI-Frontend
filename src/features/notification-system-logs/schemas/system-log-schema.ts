import { z } from "zod";
export const systemLogStatusSchema = z.enum(["SUCCESS", "FAILURE", "DENIED"]);
export const systemLogDetailSchema = z.object({
  id: z.uuid(),
  action: z.string(),
  actorType: z.string(),
  actorUserId: z.uuid().nullable(),
  actorApiKeyId: z.uuid().nullable(),
  resourceType: z.string(),
  resourceId: z.string().nullable(),
  occurredAt: z.iso.datetime({ offset: true }),
  createdAt: z.iso.datetime({ offset: true }),
  beforeData: z.unknown().nullable(),
  afterData: z.unknown().nullable(),
  correlationId: z.string().nullable(),
  source: z.string().nullable(),
  sourceIp: z.string().nullable(),
  userAgent: z.string().nullable(),
  previousHash: z.string().nullable(),
  recordHash: z.string(),
  actor: z
    .object({
      id: z.string(),
      type: z.string(),
      name: z.string(),
      email: z.string().nullable().optional(),
      role: z.string().nullable().optional(),
      keyPrefix: z.string().nullable().optional(),
    })
    .nullable(),
});
export const systemLogSearchResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.uuid(),
      occurredAt: z.iso.datetime({ offset: true }),
      eventType: z.string(),
      source: z.string(),
      actor: z.string(),
      actorDetail: z.string().nullable(),
      status: systemLogStatusSchema,
      resourceType: z.string(),
      correlationId: z.string().nullable(),
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
export type SystemLogStatus = z.infer<typeof systemLogStatusSchema>;
export type SystemLogRecord = z.infer<
  typeof systemLogSearchResponseSchema
>["items"][number];
export type SystemLogDetail = z.infer<typeof systemLogDetailSchema>;
