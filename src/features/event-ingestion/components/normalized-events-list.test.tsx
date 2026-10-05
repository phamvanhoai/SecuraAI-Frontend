import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockUseNormalizedEvents = vi.fn();

vi.mock("../hooks/use-normalized-events", () => ({
  useNormalizedEvents: (params?: unknown) => mockUseNormalizedEvents(params),
  useNormalizedEventDetail: () => ({
    isLoading: false,
    isError: false,
    data: undefined,
  }),
  useMappingOptions: () => ({
    isPending: false,
    data: { users: [], assets: [], monitoredAccounts: [] },
  }),
  useUpdateEventMapping: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
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

vi.mock("../hooks/use-event-sources", () => ({
  useEventSources: () => ({
    isPending: false,
    data: {
      items: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Wazuh Production SIEM",
          sourceType: "WAZUH",
        },
      ],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    },
  }),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
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
});

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
    expect(screen.getAllByText("Wazuh Production SIEM")[0]).toBeInTheDocument();
    expect(screen.getByText("user_login_success")).toBeInTheDocument();
    expect(screen.getByText("admin@secura.ai")).toBeInTheDocument();
    expect(screen.getByText("Secura Administrator")).toBeInTheDocument();
    expect(screen.getByText("Core Gateway")).toBeInTheDocument();
    expect(screen.getAllByText("Authentication")[0]).toBeInTheDocument();
    expect(screen.getAllByText("MAPPED")[0]).toBeInTheDocument();
    expect(screen.getByText("Anomaly")).toBeInTheDocument();
  });

  it("handles search input submission", async () => {
    const user = userEvent.setup();
    render(<NormalizedEventsList />);

    const searchInput = screen.getByPlaceholderText(/Search event type, account, IP, asset/i);
    await user.type(searchInput, "login");
    const searchBtn = screen.getByRole("button", { name: /^Search$/i });
    await user.click(searchBtn);

    expect(mockUseNormalizedEvents).toHaveBeenCalledWith(
      expect.objectContaining({ q: "login" }),
    );
  });

  it("handles dropdown filters for family, source, and mapping status", async () => {
    const user = userEvent.setup();
    render(<NormalizedEventsList />);

    const familySelect = screen.getByLabelText(/Filter by event family/i);
    await user.selectOptions(familySelect, "AUTHENTICATION");

    expect(mockUseNormalizedEvents).toHaveBeenCalledWith(
      expect.objectContaining({ eventFamily: "AUTHENTICATION" }),
    );

    const sourceSelect = screen.getByLabelText(/Filter by event source/i);
    await user.selectOptions(sourceSelect, "11111111-1111-4111-8111-111111111111");

    expect(mockUseNormalizedEvents).toHaveBeenCalledWith(
      expect.objectContaining({ eventSourceId: "11111111-1111-4111-8111-111111111111" }),
    );

    const statusSelect = screen.getByLabelText(/Filter by ingestion status/i);
    await user.selectOptions(statusSelect, "MAPPED");

    expect(mockUseNormalizedEvents).toHaveBeenCalledWith(
      expect.objectContaining({ mappingStatus: "MAPPED" }),
    );
  });

  it("handles advanced filter panel inputs and quick presets", async () => {
    const user = userEvent.setup();
    render(<NormalizedEventsList />);

    const toggleFiltersBtn = screen.getByRole("button", { name: /Filters/i });
    await user.click(toggleFiltersBtn);

    const ipInput = screen.getByPlaceholderText(/192\.168\.1\.100/i);
    await user.type(ipInput, "10.0.0.5");

    expect(mockUseNormalizedEvents).toHaveBeenCalledWith(
      expect.objectContaining({ sourceIp: "10.0.0.5" }),
    );

    const accountInput = screen.getByPlaceholderText(/admin@company\.com/i);
    await user.type(accountInput, "user@test.com");

    expect(mockUseNormalizedEvents).toHaveBeenCalledWith(
      expect.objectContaining({ account: "user@test.com" }),
    );

    const preset24hBtn = screen.getByRole("button", { name: /Last 24 Hours/i });
    await user.click(preset24hBtn);

    expect(mockUseNormalizedEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.any(String),
        to: expect.any(String),
      }),
    );
  });

  it("resets all filters when clicking Reset", async () => {
    const user = userEvent.setup();
    render(<NormalizedEventsList />);

    const familySelect = screen.getByLabelText(/Filter by event family/i);
    await user.selectOptions(familySelect, "VPN_SSO");

    const resetBtn = screen.getByRole("button", { name: /Reset/i });
    await user.click(resetBtn);

    expect(familySelect).toHaveValue("ALL");
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

  it("opens event detail dialog when clicking View button", async () => {
    const user = userEvent.setup();
    render(<NormalizedEventsList />);

    const viewButton = screen.getByRole("button", { name: /View/i });
    expect(viewButton).toBeInTheDocument();

    await user.click(viewButton);

    expect(screen.getByText("Security Event Inspection")).toBeInTheDocument();
  });
});

