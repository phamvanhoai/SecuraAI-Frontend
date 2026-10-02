import { describe, expect, it } from "vitest";
import {
  listNormalizedEventsQuerySchema,
  normalizedEventDetailSchema,
  normalizedEventItemSchema,
  normalizedEventMetricsSchema,
  paginatedNormalizedEventsSchema,
} from "./normalized-event-schema";

describe("normalized-event-schema", () => {
  const sampleItem = {
    id: "33333333-3333-4333-8333-333333333333",
    eventSourceId: "11111111-1111-4111-8111-111111111111",
    eventSourceName: "Corporate VPN Gateway",
    eventSourceType: "VPN_GATEWAY",
    ingestionBatchId: "22222222-2222-4222-8222-222222222222",
    externalEventId: "EXT-8899",
    eventFamily: "VPN_SSO" as const,
    eventType: "vpn_session_start",
    schemaVersion: "1.0.0",
    occurredAt: "2026-10-02T12:00:00.000Z",
    ingestedAt: "2026-10-02T12:00:05.000Z",
    accountIdentifier: "analyst@secura.ai",
    sourceIp: "192.168.1.50",
    destinationIp: "10.0.0.1",
    deviceIdentifier: "DEV-MAC-01",
    severity: "HIGH",
    mappingStatus: "MAPPED" as const,
    mappedUser: {
      id: "44444444-4444-4444-8444-444444444444",
      email: "analyst@secura.ai",
      fullName: "Security Analyst",
    },
    mappedAsset: {
      id: "55555555-5555-4555-8555-555555555555",
      name: "Core VPN Server",
      assetCode: "AST-VPN-01",
      assetType: "SERVER",
      criticality: "HIGH",
    },
    anomalyCount: 1,
    createdAt: "2026-10-02T12:00:05.000Z",
  };

  it("validates valid normalized event item", () => {
    const result = normalizedEventItemSchema.safeParse(sampleItem);
    expect(result.success).toBe(true);
  });

  it("validates event item with null relations", () => {
    const itemWithNulls = {
      ...sampleItem,
      mappedUser: null,
      mappedAsset: null,
      sourceIp: null,
      destinationIp: null,
      deviceIdentifier: null,
      severity: null,
      externalEventId: null,
      schemaVersion: null,
      ingestionBatchId: null,
    };
    const result = normalizedEventItemSchema.safeParse(itemWithNulls);
    expect(result.success).toBe(true);
  });

  it("validates normalized event detail with payload and anomaly detections", () => {
    const detail = {
      ...sampleItem,
      normalizedPayload: {
        rawLog: "User logged in successfully",
        protocol: "IKEv2",
        bytesTransferred: 45000,
      },
      anomalyDetections: [
        {
          id: "66666666-6666-4666-8666-666666666666",
          anomalyScore: 0.94,
          threshold: 0.85,
          isAnomaly: true,
          detectedAt: "2026-10-02T12:01:00.000Z",
        },
      ],
    };
    const result = normalizedEventDetailSchema.safeParse(detail);
    expect(result.success).toBe(true);
  });

  it("validates paginated normalized events", () => {
    const paginated = {
      items: [sampleItem],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    };
    const result = paginatedNormalizedEventsSchema.safeParse(paginated);
    expect(result.success).toBe(true);
  });

  it("validates metrics payload", () => {
    const metrics = {
      totalEvents: 100,
      totalMapped: 85,
      totalUnmapped: 15,
      eventsLast24Hours: 42,
      byFamily: {
        AUTHENTICATION: 50,
        VPN_SSO: 30,
        APPLICATION_ACCESS: 20,
      },
    };
    const result = normalizedEventMetricsSchema.safeParse(metrics);
    expect(result.success).toBe(true);
  });

  it("validates query filter schemas", () => {
    const query = {
      page: 2,
      limit: 50,
      eventFamily: "AUTHENTICATION" as const,
      mappingStatus: "MAPPED" as const,
      q: "login_failed",
      sortBy: "occurredAt" as const,
      sortOrder: "desc" as const,
    };
    const result = listNormalizedEventsQuerySchema.safeParse(query);
    expect(result.success).toBe(true);
  });
});
