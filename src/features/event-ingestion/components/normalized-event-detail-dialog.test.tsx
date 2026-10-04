import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockUseNormalizedEventDetail = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("../hooks/use-normalized-events", () => ({
  useNormalizedEventDetail: (id: string | null) =>
    mockUseNormalizedEventDetail(id),
  useMappingOptions: () => ({
    data: { users: [], assets: [], monitoredAccounts: [] },
    isPending: false,
  }),
  useUpdateEventMapping: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

import { NormalizedEventDetailDialog } from "./normalized-event-detail-dialog";

const mockEventDetail = {
  id: "33333333-3333-4333-8333-333333333333",
  eventSourceId: "11111111-1111-4111-8111-111111111111",
  eventSourceName: "Wazuh Production SIEM",
  eventSourceType: "WAZUH",
  ingestionBatchId: "22222222-2222-4222-8222-222222222222",
  externalEventId: "EXT-WAZUH-9999",
  eventFamily: "AUTHENTICATION" as const,
  eventType: "user_login_failure",
  schemaVersion: "1.0.0",
  occurredAt: "2026-10-02T10:00:00.000Z",
  ingestedAt: "2026-10-02T10:00:05.000Z",
  accountIdentifier: "admin@secura.ai",
  sourceIp: "192.168.1.105",
  destinationIp: "10.0.0.1",
  deviceIdentifier: "DEV-WS-99",
  severity: "HIGH",
  mappingStatus: "MAPPED" as const,
  mappedUser: {
    id: "44444444-4444-4444-8444-444444444444",
    email: "admin@secura.ai",
    fullName: "Secura Administrator",
  },
  mappedAsset: {
    id: "55555555-5555-4555-8555-555555555555",
    name: "Core Gateway Router",
    assetCode: "AST-GW-01",
    assetType: "ROUTER",
    criticality: "CRITICAL",
  },
  anomalyCount: 1,
  createdAt: "2026-10-02T10:00:05.000Z",
  normalizedPayload: {
    event_action: "failed_login",
    reason: "invalid_password",
    attempt_count: 5,
    client_app: "SecuraPortal",
  },
  anomalyDetections: [
    {
      id: "66666666-6666-4666-8666-666666666666",
      anomalyScore: 0.942,
      threshold: 0.85,
      isAnomaly: true,
      detectedAt: "2026-10-02T10:01:00.000Z",
    },
  ],
};

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    },
  });

  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });
});

afterEach(cleanup);

describe("NormalizedEventDetailDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state when query is loading", () => {
    mockUseNormalizedEventDetail.mockReturnValue({
      isLoading: true,
      isError: false,
      data: undefined,
    });

    render(
      <NormalizedEventDetailDialog
        eventId="33333333-3333-4333-8333-333333333333"
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Loading event details...")).toBeInTheDocument();
  });

  it("renders error state when query fails", () => {
    mockUseNormalizedEventDetail.mockReturnValue({
      isLoading: false,
      isError: true,
      error: new Error("Event not found"),
      data: undefined,
    });

    render(
      <NormalizedEventDetailDialog
        eventId="33333333-3333-4333-8333-333333333333"
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Event not found")).toBeInTheDocument();
  });

  it("renders complete security event details including source, timestamps, identity, asset, anomalies, and payload", () => {
    mockUseNormalizedEventDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: mockEventDetail,
    });

    render(
      <NormalizedEventDetailDialog
        eventId="33333333-3333-4333-8333-333333333333"
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getAllByText("user_login_failure")[0]).toBeInTheDocument();
    expect(screen.getByText("Authentication")).toBeInTheDocument();
    expect(screen.getAllByText("MAPPED")[0]).toBeInTheDocument();
    expect(screen.getByText("Severity: HIGH")).toBeInTheDocument();
    expect(screen.getByText("1 Anomaly Detected")).toBeInTheDocument();

    expect(screen.getByText("Wazuh Production SIEM")).toBeInTheDocument();
    expect(screen.getByText("WAZUH")).toBeInTheDocument();
    expect(screen.getByText("EXT-WAZUH-9999")).toBeInTheDocument();

    // Identity
    expect(screen.getAllByText("admin@secura.ai")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Secura Administrator")[0]).toBeInTheDocument();

    // Asset & Network
    expect(screen.getAllByText("192.168.1.105")[0]).toBeInTheDocument();
    expect(screen.getAllByText("10.0.0.1")[0]).toBeInTheDocument();
    expect(screen.getAllByText("DEV-WS-99")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Core Gateway Router")[0]).toBeInTheDocument();
    expect(screen.getByText(/AST-GW-01 \(ROUTER\)/)).toBeInTheDocument();
    expect(screen.getByText("CRITICAL")).toBeInTheDocument();


    // AI Anomaly detection
    expect(screen.getByText("AI Anomaly Detections (1)")).toBeInTheDocument();
    expect(screen.getByText("0.9420")).toBeInTheDocument();

    // Payload JSON
    expect(screen.getByText(/failed_login/)).toBeInTheDocument();
    expect(screen.getByText(/invalid_password/)).toBeInTheDocument();
  });

  it("copies payload JSON to clipboard when Copy Payload button is clicked", async () => {
    mockUseNormalizedEventDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: mockEventDetail,
    });

    render(
      <NormalizedEventDetailDialog
        eventId="33333333-3333-4333-8333-333333333333"
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    const copyBtn = screen.getByRole("button", { name: /Copy Payload/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      JSON.stringify(mockEventDetail.normalizedPayload, null, 2),
    );
  });

  it("renders active mapping info and opens correction dialog when Review & Correct Mapping is clicked", () => {
    const eventWithMapping = {
      ...mockEventDetail,
      activeMapping: {
        id: "map-1",
        eventId: mockEventDetail.id,
        mappingMethod: "AUTO" as const,
        confidence: 0.95,
        reason: "Auto-matched on Active Directory account",
        isActive: true,
        supersedesMappingId: null,
        mappedAt: "2026-10-02T10:00:05.000Z",
        userId: "44444444-4444-4444-8444-444444444444",
        assetId: "55555555-5555-4555-8555-555555555555",
        monitoredAccountId: "acc-1",
        mappedUser: mockEventDetail.mappedUser,
        mappedAsset: mockEventDetail.mappedAsset,
        monitoredAccount: {
          id: "acc-1",
          accountIdentifier: "admin@secura.ai",
          sourceSystem: "Active Directory",
          displayName: "Secura Admin Account",
        },
        mappedBy: null,
        createdAt: "2026-10-02T10:00:05.000Z",
      },
      mappingHistory: [
        {
          id: "map-hist-1",
          eventId: mockEventDetail.id,
          mappingMethod: "AUTO" as const,
          confidence: 0.5,
          reason: "Initial probabilistic IP heuristic",
          isActive: false,
          supersedesMappingId: null,
          mappedAt: "2026-10-02T09:59:00.000Z",
          userId: null,
          assetId: null,
          monitoredAccountId: null,
          mappedUser: null,
          mappedAsset: null,
          monitoredAccount: null,
          mappedBy: null,
          createdAt: "2026-10-02T09:59:00.000Z",
        },
      ],
    };

    mockUseNormalizedEventDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: eventWithMapping,
    });

    render(
      <NormalizedEventDetailDialog
        eventId={mockEventDetail.id}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Entity Mapping & Association Review")).toBeInTheDocument();
    expect(screen.getByText("Auto Generated")).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText(/Auto-matched on Active Directory account/)).toBeInTheDocument();
    expect(screen.getByText(/Linked Monitored Account/)).toBeInTheDocument();

    // History trail
    expect(screen.getByText("Mapping History & Audit Trail (1)")).toBeInTheDocument();
    expect(screen.getByText("SUPERSEDED")).toBeInTheDocument();
    expect(screen.getByText("Initial probabilistic IP heuristic")).toBeInTheDocument();

    // Review button
    const reviewBtn = screen.getByRole("button", { name: /Review & Correct Mapping/i });
    expect(reviewBtn).toBeInTheDocument();
    fireEvent.click(reviewBtn);

    expect(screen.getByText("Review & Correct Entity Mapping")).toBeInTheDocument();
  });
});
