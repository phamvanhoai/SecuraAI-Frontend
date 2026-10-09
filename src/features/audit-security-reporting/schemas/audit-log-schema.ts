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

export const propertyChangeTypes = ["ADDED", "MODIFIED", "REMOVED", "UNCHANGED"] as const;
export type PropertyChangeType = (typeof propertyChangeTypes)[number];

export const propertyChangeSchema = z.object({
  property: z.string(),
  changeType: z.enum(propertyChangeTypes),
  beforeValue: z.unknown(),
  afterValue: z.unknown(),
});

export type PropertyChange = z.infer<typeof propertyChangeSchema>;

export const auditLogDiffSchema = z.object({
  id: z.string().uuid(),
  action: z.string(),
  resourceType: z.string(),
  resourceId: z.string().nullable(),
  occurredAt: z.string(),
  totalProperties: z.number().int(),
  totalModified: z.number().int(),
  totalAdded: z.number().int(),
  totalRemoved: z.number().int(),
  totalUnchanged: z.number().int(),
  hasChanges: z.boolean(),
  changes: z.array(propertyChangeSchema),
});

export type AuditLogDiff = z.infer<typeof auditLogDiffSchema>;

export function computePropertyChanges(
  beforeData: Record<string, unknown> | null,
  afterData: Record<string, unknown> | null,
): PropertyChange[] {
  const before = beforeData ?? {};
  const after = afterData ?? {};
  const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();

  return allKeys.map((key) => {
    const hasBefore = Object.prototype.hasOwnProperty.call(before, key);
    const hasAfter = Object.prototype.hasOwnProperty.call(after, key);
    const beforeVal = hasBefore ? before[key] : undefined;
    const afterVal = hasAfter ? after[key] : undefined;

    let changeType: PropertyChangeType;
    if (!hasBefore && hasAfter) {
      changeType = "ADDED";
    } else if (hasBefore && !hasAfter) {
      changeType = "REMOVED";
    } else if (JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      changeType = "MODIFIED";
    } else {
      changeType = "UNCHANGED";
    }

    return {
      property: key,
      changeType,
      beforeValue: beforeVal ?? null,
      afterValue: afterVal ?? null,
    };
  });
}

