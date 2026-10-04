import { z } from "zod";

export const eventFamilies = [
  "AUTHENTICATION",
  "VPN_SSO",
  "APPLICATION_ACCESS",
] as const;

export type EventFamily = (typeof eventFamilies)[number];

export const mappingStatuses = [
  "UNMAPPED",
  "PARTIALLY_MAPPED",
  "MAPPED",
  "NEEDS_REVIEW",
] as const;

export type MappingStatus = (typeof mappingStatuses)[number];

export const mappedUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().nullable(),
});

export type MappedUser = z.infer<typeof mappedUserSchema>;

export const mappedAssetSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  assetCode: z.string(),
  assetType: z.string(),
  criticality: z.string(),
});

export type MappedAsset = z.infer<typeof mappedAssetSchema>;

export const normalizedEventItemSchema = z.object({
  id: z.string().uuid(),
  eventSourceId: z.string().uuid(),
  eventSourceName: z.string(),
  eventSourceType: z.string(),
  ingestionBatchId: z.string().nullable(),
  externalEventId: z.string().nullable(),
  eventFamily: z.enum(eventFamilies),
  eventType: z.string(),
  schemaVersion: z.string().nullable(),
  occurredAt: z.string(),
  ingestedAt: z.string(),
  accountIdentifier: z.string().nullable(),
  sourceIp: z.string().nullable(),
  destinationIp: z.string().nullable(),
  deviceIdentifier: z.string().nullable(),
  severity: z.string().nullable(),
  mappingStatus: z.enum(mappingStatuses),
  mappedUser: mappedUserSchema.nullable(),
  mappedAsset: mappedAssetSchema.nullable(),
  anomalyCount: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export type NormalizedEventItem = z.infer<typeof normalizedEventItemSchema>;

export const anomalyDetectionItemSchema = z.object({
  id: z.string().uuid(),
  anomalyScore: z.number(),
  threshold: z.number(),
  isAnomaly: z.boolean(),
  detectedAt: z.string(),
});

export type AnomalyDetectionItem = z.infer<typeof anomalyDetectionItemSchema>;

export const normalizedEventDetailSchema = normalizedEventItemSchema.extend({
  normalizedPayload: z.record(z.string(), z.unknown()),
  anomalyDetections: z.array(anomalyDetectionItemSchema).optional(),
});

export type NormalizedEventDetail = z.infer<typeof normalizedEventDetailSchema>;

export const paginatedNormalizedEventsSchema = z.object({
  items: z.array(normalizedEventItemSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export type PaginatedNormalizedEvents = z.infer<
  typeof paginatedNormalizedEventsSchema
>;

export const normalizedEventMetricsSchema = z.object({
  totalEvents: z.number().int().nonnegative(),
  totalMapped: z.number().int().nonnegative(),
  totalUnmapped: z.number().int().nonnegative(),
  eventsLast24Hours: z.number().int().nonnegative(),
  byFamily: z.object({
    AUTHENTICATION: z.number().int().nonnegative(),
    VPN_SSO: z.number().int().nonnegative(),
    APPLICATION_ACCESS: z.number().int().nonnegative(),
  }),
});

export type NormalizedEventMetrics = z.infer<
  typeof normalizedEventMetricsSchema
>;

export const listNormalizedEventsQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  eventSourceId: z.string().uuid().optional(),
  eventFamily: z.enum(eventFamilies).optional(),
  mappingStatus: z.enum(mappingStatuses).optional(),
  severity: z.string().optional(),
  eventType: z.string().optional(),
  account: z.string().optional(),
  sourceIp: z.string().optional(),
  assetId: z.string().uuid().optional(),
  asset: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  q: z.string().optional(),
  sortBy: z
    .enum([
      "occurredAt",
      "ingestedAt",
      "eventType",
      "eventFamily",
      "severity",
      "mappingStatus",
    ])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type ListNormalizedEventsQuery = z.infer<
  typeof listNormalizedEventsQuerySchema
>;
