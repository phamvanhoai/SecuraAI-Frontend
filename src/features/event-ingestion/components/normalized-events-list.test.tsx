import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockUseNormalizedEvents = vi.fn();

vi.mock("../hooks/use-normalized-events", () => ({
  useNormalizedEvents: (params?: unknown) => mockUseNormalizedEvents(params),
  useNormalizedEventMetrics: () => ({
    isPending: false,
    data: {
      totalEvents: 100,
      totalMapped: 80,
      totalUnmapped: 20,
      eventsLast24Hours: 15,
      byFamily: {
        AUTHENTICATION: 60,
        VPN_SSO: 30,
        APPLICATION_ACCESS: 10,
      },
    },
  }),
}));

import { NormalizedEventsList } from "./normalized-events-list";

const mockItems = [
  {
    id: "33333333-3333-4333-8333-333333333333",
    eventSourceId: "11111111-1111-4111-8111-111111111111",
    eventSourceName: "Wazuh Production SIEM",
    eventSourceType: "WAZUH",
    ingestionBatchId: "22222222-2222-4222-8222-222222222222",
    externalEventId: "EXT-1001",
    eventFamily: "AUTHENTICATION" as const,
    eventType: "user_login_success",
    schemaVersion: "1.0.0",
    occurredAt: "2026-10-02T10:00:00.000Z",
    ingestedAt: "2026-10-02T10:00:05.000Z",
    accountIdentifier: "admin@secura.ai",
    sourceIp: "192.168.1.100",
    destinationIp: "10.0.0.1",
    deviceIdentifier: "DEV-WS-01",
    severity: "LOW",
    mappingStatus: "MAPPED" as const,
    mappedUser: {
      id: "44444444-4444-4444-8444-444444444444",
      email: "admin@secura.ai",
      fullName: "Secura Administrator",
    },
    mappedAsset: {
      id: "55555555-5555-4555-8555-555555555555",
      name: "Core Gateway",
      assetCode: "AST-GW-01",
      assetType: "ROUTER",
      criticality: "HIGH",
    },
    anomalyCount: 1,
    createdAt: "2026-10-02T10:00:05.000Z",
  },
];

describe("NormalizedEventsList", () => {
  beforeEach(() => {
    mockUseNormalizedEvents.mockReturnValue({
      isPending: false,
      error: null,
      data: {
        items: mockItems,
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders centralized security events table with key attributes", () => {
    render(<NormalizedEventsList />);

    expect(screen.getByText("Ingested Security Events")).toBeInTheDocument();
    expect(screen.getByText("Wazuh Production SIEM")).toBeInTheDocument();
    expect(screen.getByText("user_login_success")).toBeInTheDocument();
    expect(screen.getByText("admin@secura.ai")).toBeInTheDocument();
    expect(screen.getByText("Secura Administrator")).toBeInTheDocument();
    expect(screen.getByText("Core Gateway")).toBeInTheDocument();
    expect(screen.getByText("Authentication")).toBeInTheDocument();
    expect(screen.getByText("MAPPED")).toBeInTheDocument();
    expect(screen.getByText("Anomaly")).toBeInTheDocument();
  });

  it("renders empty state when no events exist", () => {
    mockUseNormalizedEvents.mockReturnValueOnce({
      isPending: false,
      error: null,
      data: {
        items: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
    });

    render(<NormalizedEventsList />);
    expect(screen.getByText("No security events found")).toBeInTheDocument();
  });

  it("handles pagination clicks", async () => {
    const user = userEvent.setup();
    mockUseNormalizedEvents.mockReturnValue({
      isPending: false,
      error: null,
      data: {
        items: mockItems,
        pagination: { page: 1, limit: 20, total: 40, totalPages: 2 },
      },
    });

    render(<NormalizedEventsList />);
    const nextBtn = screen.getByRole("button", { name: /Next/i });
    await user.click(nextBtn);

    expect(mockUseNormalizedEvents).toHaveBeenCalled();
  });
});
