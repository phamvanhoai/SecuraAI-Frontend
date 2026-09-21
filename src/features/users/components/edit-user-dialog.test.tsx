import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  mutationReset: vi.fn(),
  toastSuccess: vi.fn(),
  detail: {
    id: "00000000-0000-4000-8000-000000000010",
    email: "analyst@example.com",
    fullName: "Security Analyst",
    phone: "0901111111",
    employeeCode: "SEC-010",
    department: { id: "00000000-0000-4000-8000-000000000020", code: "SEC", name: "Security" },
    roles: [{ code: "EMPLOYEE" }],
  },
}));

vi.mock("../hooks/use-update-user", () => ({
  useUpdateUser: () => ({
    mutateAsync: mocks.mutateAsync,
    reset: mocks.mutationReset,
    isPending: false,
    error: null,
  }),
}));
vi.mock("../hooks/use-user-detail", () => ({
  useUserDetail: () => ({
    data: mocks.detail,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));
vi.mock("../hooks/use-user-create-options", () => ({
  useUserCreateOptions: () => ({
    data: {
      departments: [{ id: "00000000-0000-4000-8000-000000000020", code: "SEC", name: "Security" }],
      roles: [{ id: "00000000-0000-4000-8000-000000000030", code: "EMPLOYEE", name: "Employee" }],
    },
    isPending: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.toastSuccess }),
}));

import { EditUserDialog } from "./edit-user-dialog";

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) { this.setAttribute("open", ""); },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) { this.removeAttribute("open"); },
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("EditUserDialog", () => {
  it("prefills editable fields and submits the updated user", async () => {
    mocks.mutateAsync.mockResolvedValue({ fullName: "Updated Analyst" });
    const user = userEvent.setup();
    render(
      <EditUserDialog
        userId="00000000-0000-4000-8000-000000000010"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Email")).toBeDisabled();
    const fullName = screen.getByLabelText("Full name");
    await user.clear(fullName);
    await user.type(fullName, "Updated Analyst");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        fullName: "Updated Analyst",
        phone: "0901111111",
        employeeCode: "SEC-010",
        departmentId: "00000000-0000-4000-8000-000000000020",
        roleCodes: ["EMPLOYEE"],
      }),
    );
  });
});
