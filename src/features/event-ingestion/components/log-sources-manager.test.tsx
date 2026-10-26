import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createMock, updateMock, mockSessionUser } = vi.hoisted(() => ({
  createMock: vi.fn(),
  updateMock: vi.fn(),
  mockSessionUser: vi.fn(() => ({
    data: { roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }] },
    isPending: false,
  })),
}));

vi.mock("@/features/authentication-account", () => ({
  useSessionUser: () => mockSessionUser(),
}));

vi.mock("../hooks/use-log-sources", () => ({
  useLogSourceMetrics: () => ({
    data: { total: 0, active: 0, receiving: 0, errors: 0 },
  }),
  useLogSources: () => ({
    data: {
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    },
    isError: false,
    isPending: false,
  }),
  useCreateLogSource: () => ({ isPending: false, mutateAsync: createMock }),
  useUpdateLogSource: () => ({ isPending: false, mutateAsync: updateMock }),
  useDeleteLogSource: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

vi.mock("../hooks/use-event-sources", () => ({
  useEventSources: () => ({
    data: {
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    },
    isError: false,
    isPending: false,
  }),
  useEventSource: () => ({
    data: undefined,
    isError: false,
    isPending: false,
  }),
  useCreateEventSource: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUpdateEventSource: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useTestEventSourceConnection: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useImportEvents: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useBatchDetail: () => ({ isPending: false, isError: false, data: undefined }),
  useBatchInvalidEvents: () => ({ isPending: false, isError: false, data: undefined }),
  useSourceBatches: () => ({ isPending: false, isError: false, data: undefined }),
}));

vi.mock("../hooks/use-normalized-events", () => ({
  useNormalizedEventMetrics: () => ({
    data: {
      totalEvents: 0,
      totalMapped: 0,
      totalUnmapped: 0,
      eventsLast24Hours: 0,
      byFamily: { AUTHENTICATION: 0, VPN_SSO: 0, APPLICATION_ACCESS: 0 },
    },
    isPending: false,
  }),
  useNormalizedEvents: () => ({
    data: {
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    },
    isPending: false,
    error: null,
  }),
  useNormalizedEventDetail: () => ({
    data: undefined,
    isPending: false,
    error: null,
  }),
}));

vi.mock("../hooks/use-event-governance", () => ({
  useEventGovernanceSummary: () => ({
    data: {
      totalPolicies: 0,
      activePolicies: 0,
      inactivePolicies: 0,
      minRetentionDays: 0,
      maxRetentionDays: 0,
      avgRetentionDays: 0,
      policiesWithArchival: 0,
      policiesWithAutomatedDeletion: 0,
      exportAllowedCount: 0,
    },
    isPending: false,
    isError: false,
    error: null,
  }),
  useEventGovernancePolicies: () => ({
    data: {
      items: [],
      pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 },
    },
    isPending: false,
    isError: false,
    error: null,
  }),
  useEventGovernancePolicyDetail: () => ({
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

import { LogSourcesManager } from "./log-sources-manager";

describe("LogSourcesManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionUser.mockReturnValue({
      data: { roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }] },
      isPending: false,
    });
  });
  afterEach(cleanup);

  it("renders the 3 active V2 tabs and switches between them", async () => {
    const user = userEvent.setup();
    render(<LogSourcesManager />);

    // Assert the 3 active tabs exist
    expect(
      screen.getByRole("button", { name: /Security events/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Normalized event sources/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Data governance & Retention/i }),
    ).toBeInTheDocument();

    // Default tab is Security events
    expect(screen.getByText("Total events")).toBeInTheDocument();

    // Switch to Normalized event sources
    await user.click(
      screen.getByRole("button", { name: /Normalized event sources/i }),
    );
    expect(
      screen.getAllByRole("button", { name: /Register event source/i }).length,
    ).toBeGreaterThan(0);

    // Switch to Data governance & Retention
    await user.click(
      screen.getByRole("button", { name: /Data governance & Retention/i }),
    );
    expect(
      screen.getByText("Total policies"),
    ).toBeInTheDocument();
  });

  it("hides Security events tab and defaults to Normalized event sources when user is ADMIN", () => {
    mockSessionUser.mockReturnValue({
      data: { roles: [{ code: "ADMIN", name: "Administrator" }] },
      isPending: false,
    });

    render(<LogSourcesManager />);

    expect(
      screen.queryByRole("button", { name: /Security events/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Normalized event sources/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Event source metrics" }),
    ).toBeInTheDocument();
  });
});

