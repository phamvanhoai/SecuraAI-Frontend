import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getConnectionStatusSummary,
  checkAllConnections,
  getIntegrationConnectionStatus,
} from "./integrations";

describe("Connection Monitoring API client", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fetches connection status summary envelope", async () => {
    const mockSummary = {
      totalIntegrations: 2,
      activeCount: 1,
      errorCount: 1,
      inactiveCount: 0,
      pendingCount: 0,
      timeWindow: "24h",
      checks24h: 4,
      successfulChecks24h: 3,
      failedChecks24h: 1,
      availability24h: 75.0,
      averageLatency24h: 45,
      failingIntegrations: [],
      recentLogs: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true, data: mockSummary }),
    } as Response);

    const result = await getConnectionStatusSummary({ timeWindow: "24h" });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/integrations/monitoring/connection-status?timeWindow=24h",
      expect.objectContaining({ method: "GET" }),
    );
    expect(result.availability24h).toBe(75.0);
    expect(result.totalIntegrations).toBe(2);
  });

  it("triggers batch connection check", async () => {
    const mockBatchResult = {
      totalTested: 1,
      successful: 1,
      failed: 0,
      results: [
        {
          integrationId: "11111111-1111-4111-8111-111111111111",
          name: "Fortinet FW",
          connected: true,
          statusCode: 200,
          latencyMs: 35,
          message: "Connection established successfully",
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true, data: mockBatchResult }),
    } as Response);

    const result = await checkAllConnections({ timeoutMs: 4000 });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/integrations/monitoring/check-all",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ timeoutMs: 4000 }),
      }),
    );
    expect(result.totalTested).toBe(1);
    expect(result.successful).toBe(1);
  });

  it("fetches single integration connection status", async () => {
    const integrationId = "11111111-1111-4111-8111-111111111111";
    const mockDetail = {
      id: integrationId,
      name: "Wazuh SIEM",
      integrationType: "siem",
      baseUrl: "https://wazuh.local",
      status: "active",
      lastConnectedAt: "2026-09-15T12:00:00Z",
      timeWindow: "24h",
      checks24h: 2,
      successfulChecks24h: 2,
      failedChecks24h: 0,
      availability24h: 100.0,
      averageLatency24h: 40,
      recentLogs: [],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true, data: mockDetail }),
    } as Response);

    const result = await getIntegrationConnectionStatus(integrationId, { timeWindow: "24h" });

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/integrations/${integrationId}/connection-status?timeWindow=24h`,
      expect.objectContaining({ method: "GET" }),
    );
    expect(result.name).toBe("Wazuh SIEM");
    expect(result.availability24h).toBe(100.0);
  });
});
