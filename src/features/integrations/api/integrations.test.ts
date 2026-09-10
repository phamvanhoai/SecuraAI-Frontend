import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createIntegration,
  listIntegrations,
  testIntegrationConnection,
  triggerIntegrationSync,
} from "./integrations";

describe("integrations API client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("lists integrations and parses response envelope", async () => {
    const mockList = {
      success: true,
      data: {
        items: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            name: "Splunk SIEM",
            integrationType: "siem",
            baseUrl: "https://siem.test.com",
            status: "active",
            lastConnectedAt: null,
            createdAt: "2026-09-01T00:00:00.000Z",
            updatedAt: "2026-09-01T00:00:00.000Z",
          },
        ],
        pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
      },
    };

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(mockList), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await listIntegrations({ page: 1, limit: 20 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.name).toBe("Splunk SIEM");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/integrations?page=1&limit=20&sortBy=createdAt&sortOrder=desc",
      undefined,
    );
  });

  it("creates a new integration", async () => {
    const mockIntegration = {
      success: true,
      data: {
        id: "22222222-2222-4222-8222-222222222222",
        name: "Palo Alto Firewall",
        integrationType: "firewall",
        baseUrl: "https://paloalto.test.com",
        status: "inactive",
        lastConnectedAt: null,
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z",
      },
    };

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(mockIntegration), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await createIntegration({
      name: "Palo Alto Firewall",
      integrationType: "firewall",
      baseUrl: "https://paloalto.test.com",
    });

    expect(result.id).toBe("22222222-2222-4222-8222-222222222222");
    expect(result.name).toBe("Palo Alto Firewall");
  });

  it("tests connection and returns latency", async () => {
    const mockTestResult = {
      success: true,
      data: {
        success: true,
        latencyMs: 95,
        message: "Ping OK",
        checkedAt: "2026-09-01T12:00:00.000Z",
      },
    };

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(mockTestResult), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await testIntegrationConnection(
      "33333333-3333-4333-8333-333333333333",
      { timeoutMs: 5000 },
    );

    expect(result.success).toBe(true);
    expect(result.latencyMs).toBe(95);
  });

  it("triggers manual sync and returns sync job record", async () => {
    const mockSyncJob = {
      success: true,
      data: {
        id: "44444444-4444-4444-8444-444444444444",
        integrationId: "33333333-3333-4333-8333-333333333333",
        syncScheduleId: null,
        status: "completed",
        recordsProcessed: 150,
        recordsFailed: 0,
        startedAt: "2026-09-01T12:00:00.000Z",
        completedAt: "2026-09-01T12:00:02.000Z",
        errorMessage: null,
        createdAt: "2026-09-01T12:00:00.000Z",
      },
    };

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(mockSyncJob), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await triggerIntegrationSync(
      "33333333-3333-4333-8333-333333333333",
    );

    expect(result.status).toBe("completed");
    expect(result.recordsProcessed).toBe(150);
  });

  it("throws normalized error on 400 Bad Request", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_FAILED",
            message: "SSRF verification failed for local address",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(
      createIntegration({
        name: "Localhost SIEM",
        integrationType: "siem",
        baseUrl: "http://127.0.0.1:8080",
      }),
    ).rejects.toThrow("SSRF verification failed for local address");
  });
});
