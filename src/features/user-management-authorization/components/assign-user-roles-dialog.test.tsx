import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ mutateAsync: vi.fn(), toastSuccess: vi.fn() }));
vi.mock("../hooks/use-assign-user-roles", () => ({
  useAccessAssignmentOptions: (enabled: boolean) => ({
    data: {
      roles: [{ code: "EMPLOYEE", name: "Employee" }, { code: "EXECUTIVE", name: "Executive" }],
      scopeCodes: [{ code: "AUDIT_VIEW", name: "View audit information" }, { code: "POLICY_APPROVE", name: "Approve policies" }],
      targetTypes: ["GLOBAL", "BUSINESS_SERVICE", "ASSET"],
      businessServices: [{ id: "00000000-0000-4000-8000-000000000020", name: "Security", ownerUserId: null }],
      assets: [{ id: "00000000-0000-4000-8000-000000000030", code: "AST-1", name: "Server", ownerUserId: null }],
    },
    isPending: false, isError: false, isSuccess: enabled, refetch: vi.fn(),
  }),
  useUserAccessAssignment: () => ({
    data: {
      user: { id: "00000000-0000-4000-8000-000000000010", fullName: "Test User", email: "test@example.com", status: "ACTIVE" },
      role: "EMPLOYEE", scopes: [],
      ownershipSummary: { businessServices: 0, assets: 1, risks: 2, treatmentPlans: 0, treatmentActions: 0, securityControls: 0, evidenceItems: 0, policies: 0 },
    },
    isPending: false, isError: false, isSuccess: true, refetch: vi.fn(),
  }),
  useAssignUserAccess: () => ({ mutateAsync: mocks.mutateAsync, isPending: false, reset: vi.fn() }),
}));
vi.mock("@/components/feedback/toast", () => ({ useToast: () => ({ success: mocks.toastSuccess }) }));

import { AssignUserRolesDialog } from "./assign-user-roles-dialog";

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value(this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute("open"); } });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("AssignUserRolesDialog", () => {
  it("submits role, scope, and ownership together", async () => {
    mocks.mutateAsync.mockResolvedValue({ changed: true, role: "EXECUTIVE", scopeCount: 1 });
    const user = userEvent.setup();
    render(<AssignUserRolesDialog userId="00000000-0000-4000-8000-000000000010" onClose={vi.fn()} />);
    await user.selectOptions(screen.getByRole("combobox", { name: "Role" }), "EXECUTIVE");
    await user.click(screen.getByRole("button", { name: "Add scope" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledWith({
      userId: "00000000-0000-4000-8000-000000000010",
      payload: {
        role: "EXECUTIVE", scopes: [{ scopeCode: "AUDIT_VIEW", targetType: "GLOBAL", expiresAt: null }],
      },
    }));
  });
});
