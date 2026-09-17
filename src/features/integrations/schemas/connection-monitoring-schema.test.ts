import { describe, expect, it } from "vitest";
import {
  connectionStatusSummarySchema,
  batchConnectionCheckResultSchema,
  integrationConnectionStatusSchema,
} from "./integration-schema";

describe("Connection Monitoring Schemas", () => {
  it("validates and parses valid connection status summary", () => {
    const raw = {
      totalIntegrations: 3,
      activeCount: 2,
      errorCount: 1,
      inactiveCount: 0,
      pendingCount: 0,
      timeWindow: "24h",
      checks24h: 10,
      successfulChecks24h: 9,
      failedChecks24h: 1,
      availability24h: 90.0,
      averageLatency24h: 65,
      failingIntegrations: [
        {
          id: "3b241101-e29b-41d4-a716-446655440000",
          name: "Fortinet FW",
          integrationType: "firewall",
          baseUrl: "https://fw.local",
          status: "error",
          lastConnectedAt: "2026-09-14T00:00:00Z",
          lastErrorMessage: "Connection timed out",
          lastCheckedAt: "2026-09-15T10:00:00Z",
        },
      ],
      recentLogs: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          integrationId: "3b241101-e29b-41d4-a716-446655440000",
          integrationName: "Fortinet FW",
          level: "error",
          message: "Connection check failed",
          createdAt: "2026-09-15T10:00:00Z",
          latencyMs: 5000,
          httpStatus: null,
          success: false,
          errorCode: "NETWORK_ERROR",
        },
      ],
    };

    const parsed = connectionStatusSummarySchema.parse(raw);
    expect(parsed.totalIntegrations).toBe(3);
    expect(parsed.activeCount).toBe(2);
    expect(parsed.availability24h).toBe(90.0);
    expect(parsed.failingIntegrations).toHaveLength(1);
  });

  it("validates batch check result schema", () => {
    const raw = {
      totalTested: 2,
      successful: 1,
      failed: 1,
      results: [
        {
          integrationId: "11111111-1111-4111-8111-111111111111",
          name: "Wazuh SIEM",
          connected: true,
          statusCode: 200,
          latencyMs: 45,
          message: "Connection established successfully",
        },
        {
          integrationId: "22222222-2222-4222-8222-222222222222",
          name: "Unreachable FW",
          connected: false,
          statusCode: 503,
          latencyMs: 150,
          message: "Service Unavailable",
        },
      ],
    };

    const parsed = batchConnectionCheckResultSchema.parse(raw);
    expect(parsed.totalTested).toBe(2);
    expect(parsed.successful).toBe(1);
    expect(parsed.results[0]?.connected).toBe(true);
  });

  it("validates integration connection status schema", () => {
    const raw = {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Splunk Cluster",
      integrationType: "siem",
      baseUrl: "https://splunk.local:8089",
      status: "active",
      lastConnectedAt: "2026-09-15T12:00:00Z",
      timeWindow: "24h",
      checks24h: 5,
      successfulChecks24h: 5,
      failedChecks24h: 0,
      availability24h: 100.0,
      averageLatency24h: 32,
      recentLogs: [],
    };

    const parsed = integrationConnectionStatusSchema.parse(raw);
    expect(parsed.name).toBe("Splunk Cluster");
    expect(parsed.availability24h).toBe(100.0);
  });
});
