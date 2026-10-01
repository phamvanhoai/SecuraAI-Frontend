import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmployeePolicyAcknowledgementManager } from "./employee-policy-acknowledgement-manager";

const mocks = vi.hoisted(() => ({ acknowledge: vi.fn(), success: vi.fn() }));

vi.mock("@/features/authentication-account", () => ({
  useSessionUser: () => ({ data: { permissions: ["policies.acknowledge"] }, isPending: false }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success, error: vi.fn() }),
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
        versionNumber: "1.0",
        effectiveDate: "2026-09-30T00:00:00.000Z",
        publishedAt: "2026-09-30T00:00:00.000Z",
        acknowledgedAt: null,
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
        versionNumber: "1.0",
        content: "Employees must protect company information.",
        changeSummary: null,
        effectiveDate: "2026-09-30T00:00:00.000Z",
        publishedAt: "2026-09-30T00:00:00.000Z",
      },
      acknowledgedAt: null,
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
