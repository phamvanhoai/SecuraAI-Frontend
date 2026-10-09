import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/api-client";
import {
  getNormalizedEventMetrics,
  listNormalizedEvents,
} from "./normalized-events";

vi.mock("@/lib/api/api-client", () => ({
  apiRequest: vi.fn(),
}));

describe("normalized-events api client", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockItem = {
    id: "33333333-3333-4333-8333-333333333333",
    eventSourceId: "11111111-1111-4111-8111-111111111111",
    eventSourceName: "Corporate VPN",
    eventSourceType: "VPN_GATEWAY",
    ingestionBatchId: null,
    externalEventId: null,
    eventFamily: "VPN_SSO" as const,
    eventType: "vpn_session_start",
    schemaVersion: null,
    occurredAt: "2026-10-02T12:00:00.000Z",
    ingestedAt: "2026-10-02T12:00:05.000Z",
    accountIdentifier: "test@secura.ai",
    sourceIp: "10.0.0.5",
    destinationIp: null,
    deviceIdentifier: null,
    severity: "INFO",
    mappingStatus: "MAPPED" as const,
    mappedUser: {
      id: "44444444-4444-4444-8444-444444444444",
      email: "test@secura.ai",
      fullName: "Test User",
    },
    mappedAsset: null,
    anomalyCount: 0,
    createdAt: "2026-10-02T12:00:05.000Z",
  };

  it("calls listNormalizedEvents with pagination params and parses result", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [mockItem],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    const result = await listNormalizedEvents({
      page: 1,
      limit: 20,
    });

    expect(apiRequest).toHaveBeenCalledWith(
      expect.stringContaining("/api/events?page=1&limit=20"),
      { target: "same-origin" },
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.eventType).toBe("vpn_session_start");
  });

  it("calls listNormalizedEvents with search and filter parameters", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [mockItem],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    });

    const result = await listNormalizedEvents({
      q: "vpn",
      eventFamily: "VPN_SSO",
      mappingStatus: "MAPPED",
      sourceIp: "10.0.0.5",
      account: "test@secura.ai",
      asset: "GW-01",
      from: "2026-10-01T00:00:00.000Z",
      to: "2026-10-02T23:59:59.999Z",
    });

    expect(apiRequest).toHaveBeenCalledWith(
      expect.stringContaining("q=vpn"),
      { target: "same-origin" },
    );
    expect(apiRequest).toHaveBeenCalledWith(
      expect.stringContaining("eventFamily=VPN_SSO"),
      { target: "same-origin" },
    );
    expect(apiRequest).toHaveBeenCalledWith(
      expect.stringContaining("sourceIp=10.0.0.5"),
      { target: "same-origin" },
    );
    expect(result.items).toHaveLength(1);
  });

  it("calls getNormalizedEventMetrics and parses metrics", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      totalEvents: 10,
      totalMapped: 8,
      totalUnmapped: 2,
      eventsLast24Hours: 5,
      byFamily: {
        AUTHENTICATION: 5,
        VPN_SSO: 3,
        APPLICATION_ACCESS: 2,
      },
    });

    const result = await getNormalizedEventMetrics();

    expect(apiRequest).toHaveBeenCalledWith("/api/events/metrics", {
      target: "same-origin",
    });
    expect(result.totalEvents).toBe(10);
  });

  it("calls updateEventMapping and parses response", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      id: "22222222-2222-4222-8222-222222222222",
      eventId: "33333333-3333-4333-8333-333333333333",
      userId: "44444444-4444-4444-8444-444444444444",
      monitoredAccountId: null,
      assetId: null,
      mappingMethod: "MANUAL",
      confidence: 0.9,
      reason: "Manual verification",
      mappedBy: null,
      mappedAt: "2026-10-02T12:00:05.000Z",
      isActive: true,
      supersedesMappingId: null,
      mappedUser: {
        id: "44444444-4444-4444-8444-444444444444",
        email: "test@secura.ai",
        fullName: "Test User",
      },
      mappedAsset: null,
      monitoredAccount: null,
      createdAt: "2026-10-02T12:00:05.000Z",
    });

    const payload = {
      userId: "44444444-4444-4444-8444-444444444444",
      assetId: null,
      monitoredAccountId: null,
      reason: "Manual verification",
      confidence: 0.9,
    };

    const { updateEventMapping } = await import("./normalized-events");
    const result = await updateEventMapping("33333333-3333-4333-8333-333333333333", payload);

    expect(apiRequest).toHaveBeenCalledWith(
      "/api/events/33333333-3333-4333-8333-333333333333/mappings",
      {
        method: "PUT",
        target: "same-origin",
        body: payload,
      },
    );
    expect(result.mappingMethod).toBe("MANUAL");
    expect(result.confidence).toBe(0.9);
  });
});
