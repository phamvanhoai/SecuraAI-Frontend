import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/api-error";
import { EmployeePolicyAcknowledgementManager } from "./employee-policy-acknowledgement-manager";

const mocks = vi.hoisted(() => ({ acknowledge: vi.fn(), success: vi.fn(), error: vi.fn(), previous: false, acknowledgedAt: null as string | null }));
const previous = { versionId: "00000000-0000-4000-8000-000000000012", versionNumber: "1.0", acknowledgedAt: "2026-09-30T00:00:00.000Z" };

vi.mock("@/features/authentication-account", () => ({
  useSessionUser: () => ({ data: { permissions: ["policies.acknowledge"] }, isPending: false }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success, error: mocks.error }),
}));
vi.mock("../hooks/use-policy-acknowledgements", () => ({
  useEmployeePolicies: () => ({
    data: {
      items: [{
        policyId: "00000000-0000-4000-8000-000000000010",
        versionId: "00000000-0000-4000-8000-000000000011",
        policyCode: "ISP-001",
        title: "Information Security Policy",
        description: null,
        versionNumber: mocks.previous ? "2.0" : "1.0",
        effectiveDate: "2026-09-30T00:00:00.000Z",
        publishedAt: "2026-09-30T00:00:00.000Z",
        acknowledgedAt: mocks.acknowledgedAt,
        previousAcknowledgement: mocks.previous ? previous : null,
        changeSummary: "Added MFA requirements",
      }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    },
    isPending: false,
    isError: false,
  }),
  useEmployeePolicy: () => ({
    data: {
      policyId: "00000000-0000-4000-8000-000000000010",
      policyCode: "ISP-001",
      title: "Information Security Policy",
      description: null,
      version: {
        id: "00000000-0000-4000-8000-000000000011",
        versionNumber: mocks.previous ? "2.0" : "1.0",
        content: "Employees must protect company information.",
        changeSummary: "Added MFA requirements",
        effectiveDate: "2026-09-30T00:00:00.000Z",
        publishedAt: "2026-09-30T00:00:00.000Z",
      },
      acknowledgedAt: mocks.acknowledgedAt,
      previousAcknowledgement: mocks.previous ? previous : null,
    },
    isPending: false,
    isError: false,
  }),
  useAcknowledgePolicy: () => ({ mutateAsync: mocks.acknowledge, isPending: false }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("EmployeePolicyAcknowledgementManager", () => {
  beforeEach(() => {
    mocks.previous = false;
    mocks.acknowledgedAt = null;
    HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function close() { this.removeAttribute("open"); };
  });
  it("shows the old confirmation separately and requires a fresh v2 confirmation", async () => {
    mocks.previous = true;
    const user = userEvent.setup();
    render(<EmployeePolicyAcknowledgementManager />);
    expect(screen.getByText("New version — reading required")).toBeInTheDocument();
    expect(screen.getByText(/Previously acknowledged v1.0/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Read policy" }));
    expect(screen.getByText(/The current published version is v2.0/)).toBeInTheDocument();
    expect(screen.getByText("Added MFA requirements")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Confirm reading" })).toBeDisabled();
  });
  it("keeps v1 history visible after v2 is acknowledged without another confirmation button", async () => {
    mocks.previous = true;
    mocks.acknowledgedAt = "2026-11-26T00:00:00.000Z";
    const user = userEvent.setup();
    render(<EmployeePolicyAcknowledgementManager />);
    await user.click(screen.getByRole("button", { name: "Read policy" }));
    expect(screen.getByText(/You acknowledged v2.0/)).toBeInTheDocument();
    expect(screen.getByText(/That confirmation remains in your history/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirm reading" })).not.toBeInTheDocument();
  });
  it("closes a stale confirmation and directs the employee to the current version", async () => {
    mocks.acknowledge.mockRejectedValue(new ApiError("Policy changed", 409, "CONFLICT"));
    const user = userEvent.setup();
    render(<EmployeePolicyAcknowledgementManager />);
    await user.click(screen.getByRole("button", { name: "Read policy" }));
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Confirm reading" }));
    expect(mocks.error).toHaveBeenCalledWith("Unable to confirm reading", expect.stringContaining("Open the current version"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.success).not.toHaveBeenCalled();
  });
  it("requires explicit confirmation before recording policy reading", async () => {
    HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function close() { this.removeAttribute("open"); };
    mocks.acknowledge.mockResolvedValue({});
    const user = userEvent.setup();
    render(<EmployeePolicyAcknowledgementManager />);

    await user.click(screen.getByRole("button", { name: "Read policy" }));
    const submit = screen.getByRole("button", { name: "Confirm reading" });
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: /I have read and understood/i }));
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(mocks.acknowledge).toHaveBeenCalledWith({
      policyId: "00000000-0000-4000-8000-000000000010",
      versionId: "00000000-0000-4000-8000-000000000011",
    });
    expect(mocks.success).toHaveBeenCalledWith(
      "Policy acknowledged",
      "Your confirmation has been recorded.",
    );
  });
});
