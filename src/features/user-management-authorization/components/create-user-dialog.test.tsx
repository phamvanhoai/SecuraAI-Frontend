import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  mutationReset: vi.fn(),
  refetch: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("../hooks/use-create-user", () => ({
  useCreateUser: () => ({
    mutateAsync: mocks.mutateAsync,
    reset: mocks.mutationReset,
    isPending: false,
    error: null,
  }),
}));
vi.mock("../hooks/use-user-create-options", () => ({
  useUserCreateOptions: () => ({
    data: {
      departments: [
        {
          id: "00000000-0000-4000-8000-000000000020",
          code: "SEC",
          name: "Security",
        },
      ],
      roles: [
        {
          id: "00000000-0000-4000-8000-000000000030",
          code: "EMPLOYEE",
          name: "Employee",
          description: "Standard employee access",
          isSystem: true,
        },
      ],
    },
    isPending: false,
    isError: false,
    refetch: mocks.refetch,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.toastSuccess }),
}));

import { CreateUserDialog } from "./create-user-dialog";

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

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CreateUserDialog", () => {
  it("uses backend options and submits a normalized account request", async () => {
    mocks.mutateAsync.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000010",
      email: "new@example.com",
      fullName: "New User",
      message: "Initialization email sent.",
    });
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CreateUserDialog open onClose={onClose} />);

    await user.type(screen.getByLabelText("Email"), "NEW@EXAMPLE.COM");
    await user.type(screen.getByLabelText("Full name"), "New User");
    await user.type(screen.getByLabelText("Phone"), "0901234567");
    await user.type(screen.getByLabelText("Employee code"), "EMP-010");
    await user.selectOptions(screen.getByLabelText("Department"), [
      "00000000-0000-4000-8000-000000000020",
    ]);
    await user.click(screen.getByRole("checkbox", { name: /Employee/ }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        email: "new@example.com",
        fullName: "New User",
        phone: "0901234567",
        employeeCode: "EMP-010",
        departmentId: "00000000-0000-4000-8000-000000000020",
        roleCodes: ["EMPLOYEE"],
      }),
    );
    expect(onClose).toHaveBeenCalledOnce();
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "User account created",
      "Initialization email sent.",
    );
  });

  it("shows inline validation for every required field", async () => {
    render(<CreateUserDialog open onClose={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Full name must contain at least 2 characters."),
    ).toBeInTheDocument();
    expect(screen.getByText("Employee code is required.")).toBeInTheDocument();
    expect(screen.getByText("Select a department.")).toBeInTheDocument();
    expect(screen.getByText("Select at least one role.")).toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });
});
