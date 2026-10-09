import { z } from "zod";

export const auditActorTypes = ["USER", "SYSTEM", "API_KEY"] as const;
export type AuditActorType = (typeof auditActorTypes)[number];

export const auditLogActorSchema = z.object({
  id: z.string(),
  type: z.enum(auditActorTypes),
  name: z.string(),
  email: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  keyPrefix: z.string().nullable().optional(),
});

export type AuditLogActor = z.infer<typeof auditLogActorSchema>;

export const auditLogItemSchema = z.object({
  id: z.string().uuid(),
  actorType: z.enum(auditActorTypes),
  actorUserId: z.string().uuid().nullable(),
  actorApiKeyId: z.string().uuid().nullable(),
  actor: auditLogActorSchema.nullable(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().nullable(),
  occurredAt: z.string(),
  beforeData: z.record(z.string(), z.unknown()).nullable(),
  afterData: z.record(z.string(), z.unknown()).nullable(),
  correlationId: z.string().nullable(),
  source: z.string().nullable(),
  sourceIp: z.string().nullable(),
  userAgent: z.string().nullable(),
  previousHash: z.string().nullable(),
  recordHash: z.string(),
  createdAt: z.string(),
});

export type AuditLogItem = z.infer<typeof auditLogItemSchema>;

export const paginatedAuditLogsSchema = z.object({
  items: z.array(auditLogItemSchema),
  pagination: z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    totalItems: z.number().int().min(0),
    totalPages: z.number().int().min(0),
  }),
});

export type PaginatedAuditLogs = z.infer<typeof paginatedAuditLogsSchema>;

export const listAuditLogsQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  actor: z.string().trim().max(100).optional(),
  actorType: z.enum(auditActorTypes).optional(),
  action: z.string().trim().max(100).optional(),
  resourceType: z.string().trim().max(100).optional(),
  correlationId: z.string().trim().max(100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z
    .enum(["occurredAt", "action", "resourceType", "actorType", "sourceIp", "createdAt"])
    .default("occurredAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
