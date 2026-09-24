import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ mutateAsync: vi.fn(), toastSuccess: vi.fn() }));
vi.mock("../hooks/use-assign-user-roles", () => ({
  useAssignableRoles: () => ({ data: [
    { code: "EMPLOYEE", name: "Employee", description: null, isSystem: true },
    { code: "AUDITOR", name: "Auditor", description: null, isSystem: true },
  ], isPending: false, isError: false, refetch: vi.fn() }),
  useAssignUserRoles: () => ({ mutateAsync: mocks.mutateAsync, isPending: false, reset: vi.fn() }),
}));
vi.mock("../hooks/use-user-detail", () => ({ useUserDetail: () => ({
  data: { fullName: "Test User", roles: [{ code: "EMPLOYEE" }] },
  isPending: false, isError: false, refetch: vi.fn(),
}) }));
vi.mock("@/components/feedback/toast", () => ({ useToast: () => ({ success: mocks.toastSuccess }) }));

import { AssignUserRolesDialog } from "./assign-user-roles-dialog";

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value(this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute("open"); } });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("AssignUserRolesDialog", () => {
  it("keeps existing roles out of selection and submits only new roles", async () => {
    mocks.mutateAsync.mockResolvedValue({ assignedRoleCodes: ["AUDITOR"], changed: true });
    const user = userEvent.setup();
    render(<AssignUserRolesDialog userId="00000000-0000-4000-8000-000000000010" onClose={vi.fn()} />);
    expect(screen.queryByText("Employee")).not.toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /Auditor/ }));
    await user.click(screen.getByRole("button", { name: "Assign roles" }));
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledWith({
      userId: "00000000-0000-4000-8000-000000000010", roleCodes: ["AUDITOR"],
    }));
  });
});
