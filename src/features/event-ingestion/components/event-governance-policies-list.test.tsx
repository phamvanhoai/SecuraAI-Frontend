import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockUsePolicies = vi.fn();
const mockUseSummary = vi.fn();

vi.mock("../hooks/use-event-governance", () => ({
  useEventGovernancePolicies: (params: unknown) => mockUsePolicies(params),
  useEventGovernanceSummary: () => mockUseSummary(),
  useEventGovernancePolicyDetail: () => ({ data: null, isPending: false, isError: false, error: null }),
  useUpdateEventGovernancePolicy: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

import { EventGovernancePoliciesList } from "./event-governance-policies-list";

const samplePolicy = {
  id: "7d191192-3490-410a-ba53-3a72d3f92d44",
  name: "Authentication Retention Policy",
  purpose: "Retain auth logs for 90 days",
  eventFamily: "AUTHENTICATION" as const,
  retentionDays: 90,
  accessScope: "SECURITY_OPERATIONS",
  maskingRules: { maskIp: true },
  exportAllowed: true,
  archiveAfterDays: 30,
  deletionEnabled: true,
  status: "ACTIVE" as const,
  createdBy: {
    id: "9a9bf33a-02db-48e4-a8ad-90517278d7f2",
    name: "Admin User",
    email: "admin@securaai.internal",
  },
  updatedBy: {
    id: "9a9bf33a-02db-48e4-a8ad-90517278d7f2",
    name: "Admin User",
    email: "admin@securaai.internal",
  },
  createdAt: "2026-10-01T08:00:00.000Z",
  updatedAt: "2026-10-01T08:00:00.000Z",
};

const sampleSummary = {
  totalPolicies: 3,
  activePolicies: 3,
  inactivePolicies: 0,
  minRetentionDays: 30,
  maxRetentionDays: 365,
  avgRetentionDays: 161,
  policiesWithArchival: 2,
  policiesWithAutomatedDeletion: 3,
  exportAllowedCount: 2,
};

describe("EventGovernancePoliciesList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders metric strip and policy list data correctly", () => {
    mockUseSummary.mockReturnValue({
      data: sampleSummary,
      isPending: false,
      isError: false,
      error: null,
    });
    mockUsePolicies.mockReturnValue({
      data: {
        items: [samplePolicy],
        pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
      },
      isPending: false,
      isError: false,
      error: null,
    });

    render(<EventGovernancePoliciesList />);

    expect(
      screen.getByText("Event data governance policies"),
    ).toBeInTheDocument();
    expect(screen.getByText("Authentication Retention Policy")).toBeInTheDocument();
    expect(screen.getByText("Retain auth logs for 90 days")).toBeInTheDocument();
    expect(screen.getByText("90 days")).toBeInTheDocument();
    expect(screen.getByText("After 30 days")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  it("handles search input submission", () => {
    mockUseSummary.mockReturnValue({ data: sampleSummary, isPending: false, isError: false });
    mockUsePolicies.mockReturnValue({
      data: { items: [], pagination: { page: 1, limit: 20, totalItems: 0, totalPages: 0 } },
      isPending: false,
      isError: false,
    });

    render(<EventGovernancePoliciesList />);

    const searchInput = screen.getByPlaceholderText(
      "Search by policy name, purpose, or scope...",
    );
    fireEvent.change(searchInput, { target: { value: "VPN policy" } });
    const submitButton = screen.getByRole("button", { name: "Search" });
    fireEvent.click(submitButton);

    expect(mockUsePolicies).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "VPN policy",
      }),
    );
  });
});
