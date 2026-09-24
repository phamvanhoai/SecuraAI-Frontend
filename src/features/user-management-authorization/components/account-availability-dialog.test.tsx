import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ mutateAsync: vi.fn(), toastSuccess: vi.fn(), toastInfo: vi.fn() }));
vi.mock("../hooks/use-account-availability", () => ({
  useAccountAvailability: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.toastSuccess, info: mocks.toastInfo }),
}));
import { AccountAvailabilityDialog } from "./account-availability-dialog";

const userRecord = {
  id: "00000000-0000-4000-8000-000000000010",
  email: "employee@example.com",
  fullName: "Employee User",
  employeeCode: "EMP-010",
  status: "active" as const,
  department: null,
  roles: [],
};

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true, value(this: HTMLDialogElement) { this.setAttribute("open", ""); },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true, value(this: HTMLDialogElement) { this.removeAttribute("open"); },
  });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("AccountAvailabilityDialog", () => {
  it("requires action and reason before deactivation", async () => {
    mocks.mutateAsync.mockResolvedValue({ changed: true });
    const interaction = userEvent.setup();
    render(<AccountAvailabilityDialog user={userRecord} canDeactivate canRemove onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Deactivate user" })).toBeDisabled();
    await interaction.click(screen.getByRole("radio", { name: /Deactivate/ }));
    await interaction.click(screen.getByRole("button", { name: "Deactivate user" }));
    expect(await screen.findByText("Reason must contain at least 10 characters.")).toBeInTheDocument();
    await interaction.type(screen.getByLabelText("Reason (required)"), "Employee has left the company");
    await interaction.click(screen.getByRole("button", { name: "Deactivate user" }));
    await waitFor(() => expect(mocks.mutateAsync).toHaveBeenCalledWith({
      userId: userRecord.id, action: "deactivate",
      body: { reason: "Employee has left the company" },
    }));
  });

  it("shows a stronger warning for soft removal", async () => {
    const interaction = userEvent.setup();
    render(<AccountAvailabilityDialog user={userRecord} canDeactivate canRemove onClose={vi.fn()} />);
    await interaction.click(screen.getByRole("radio", { name: /Remove \(soft delete\)/ }));
    expect(screen.getByText(/not reversible from User Management/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove user" })).toBeEnabled();
  });
});
