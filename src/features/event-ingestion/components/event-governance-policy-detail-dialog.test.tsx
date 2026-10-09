import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockUsePolicyDetail = vi.fn();

vi.mock("../hooks/use-event-governance", () => ({
  useEventGovernancePolicyDetail: (id: string | null) => mockUsePolicyDetail(id),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

import { EventGovernancePolicyDetailDialog } from "./event-governance-policy-detail-dialog";

const samplePolicy = {
  id: "7d191192-3490-410a-ba53-3a72d3f92d44",
  name: "Authentication Retention Policy",
  purpose: "Retain auth logs for 90 days with cold archival",
  eventFamily: "AUTHENTICATION" as const,
  retentionDays: 90,
  accessScope: "SECURITY_OPERATIONS",
  maskingRules: { maskIp: true, hashToken: true },
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

describe("EventGovernancePolicyDetailDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders when closed without crashing", () => {
    mockUsePolicyDetail.mockReturnValue({
      data: null,
      isPending: false,
      isError: false,
      error: null,
    });

    const { container } = render(
      <EventGovernancePolicyDetailDialog
        policyId={samplePolicy.id}
        isOpen={false}
        onClose={vi.fn()}
      />,
    );

    const dialog = container.querySelector("dialog");
    expect(dialog).not.toHaveAttribute("open");
  });

  it("renders policy details and lifecycle timeline when loaded", () => {
    mockUsePolicyDetail.mockReturnValue({
      data: samplePolicy,
      isPending: false,
      isError: false,
      error: null,
    });

    render(
      <EventGovernancePolicyDetailDialog
        policyId={samplePolicy.id}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getAllByText(/Authentication Retention Policy/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Retain auth logs for 90 days with cold archival")).toBeInTheDocument();
    expect(screen.getByText("Hot Storage (Fast Query)")).toBeInTheDocument();
    expect(screen.getByText("Cold Archival Storage")).toBeInTheDocument();
    expect(screen.getByText("Automated Purge & Disposal")).toBeInTheDocument();
    expect(screen.getAllByText(/90 days/i).length).toBeGreaterThan(0);
  });

  it("calls onClose when close button clicked", () => {
    const handleClose = vi.fn();
    mockUsePolicyDetail.mockReturnValue({
      data: samplePolicy,
      isPending: false,
      isError: false,
      error: null,
    });

    render(
      <EventGovernancePolicyDetailDialog
        policyId={samplePolicy.id}
        isOpen={true}
        onClose={handleClose}
      />,
    );

    const closeButton = screen.getByRole("button", { name: /Close/i });
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalled();
  });
});
