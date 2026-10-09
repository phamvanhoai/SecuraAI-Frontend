import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mockMutateAsync = vi.fn();

vi.mock("../hooks/use-event-governance", () => ({
  useUpdateEventGovernancePolicy: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    info: vi.fn(),
  }),
}));

import { EditEventGovernancePolicyDialog } from "./edit-event-governance-policy-dialog";

const samplePolicy = {
  id: "7d191192-3490-410a-ba53-3a72d3f92d44",
  name: "Authentication Retention Policy",
  purpose: "Retain auth logs for 90 days with cold archival",
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

describe("EditEventGovernancePolicyDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("pre-fills form controls with existing policy data", () => {
    render(
      <EditEventGovernancePolicyDialog
        policy={samplePolicy}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByDisplayValue("Authentication Retention Policy")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Retain auth logs for 90 days with cold archival"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("90")).toBeInTheDocument();
    expect(screen.getByDisplayValue("30")).toBeInTheDocument();
  });

  it("submits updated policy values and triggers success feedback", async () => {
    const handleClose = vi.fn();
    mockMutateAsync.mockResolvedValue({
      ...samplePolicy,
      retentionDays: 180,
      archiveAfterDays: 60,
    });

    render(
      <EditEventGovernancePolicyDialog
        policy={samplePolicy}
        isOpen={true}
        onClose={handleClose}
      />,
    );

    const retentionInput = screen.getByLabelText(/Retention Period/i);
    fireEvent.change(retentionInput, { target: { value: "180" } });

    const archiveInput = screen.getByLabelText(/Cold Archival Threshold/i);
    fireEvent.change(archiveInput, { target: { value: "60" } });

    const saveButton = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: samplePolicy.id,
        values: expect.objectContaining({
          name: "Authentication Retention Policy",
          retentionDays: 180,
          archiveAfterDays: 60,
        }),
      });
      expect(mockToastSuccess).toHaveBeenCalledWith(
        "Event data governance policy updated successfully",
      );
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it("displays validation error when archival days is greater than retention days", async () => {
    render(
      <EditEventGovernancePolicyDialog
        policy={samplePolicy}
        isOpen={true}
        onClose={vi.fn()}
      />,
    );

    const retentionInput = screen.getByLabelText(/Retention Period/i);
    fireEvent.change(retentionInput, { target: { value: "90" } });

    const archiveInput = screen.getByLabelText(/Cold Archival Threshold/i);
    fireEvent.change(archiveInput, { target: { value: "120" } });

    const saveButton = screen.getByRole("button", { name: /Save Changes/i });
    fireEvent.click(saveButton);

    expect(
      await screen.findByText(/Archival threshold .* must be less than retention period/i),
    ).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
