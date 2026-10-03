import { render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../hooks/use-roles", () => ({
  useUserPermissions: () => ({
    isPending: false,
    isError: false,
    data: {
      user: {
        id: "00000000-0000-4000-8000-000000000010",
        fullName: "Employee User",
        email: "employee@example.com",
        role: "EMPLOYEE",
      },
      editable: true,
      allowablePermissions: ["assets.read"],
      rolePermissions: ["assets.read"],
      allow: [],
      deny: [],
      effectivePermissions: ["assets.read"],
      updatedAt: "2026-10-03T00:00:00.000Z",
    },
  }),
  usePermissions: () => ({
    isPending: false,
    isError: false,
    data: {
      items: [
        {
          id: "00000000-0000-4000-8000-000000000020",
          code: "roles.update",
          module: "roles",
          action: "update",
          description: "Configure permissions.",
        },
        {
          id: "00000000-0000-4000-8000-000000000021",
          code: "assets.read",
          module: "assets",
          action: "read",
          description: "View assets.",
        },
      ],
      pagination: { page: 1, limit: 100, total: 2, totalPages: 1 },
    },
  }),
  useConfigureUserPermissions: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: vi.fn() }),
}));

import { UserPermissionsDialog } from "./user-permissions-dialog";

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
});

describe("UserPermissionsDialog", () => {
  it("prevents an employee from selecting an administrator-only allow override", () => {
    render(
      <UserPermissionsDialog
        userId="00000000-0000-4000-8000-000000000010"
        onClose={vi.fn()}
      />,
    );

    const adminPermission = screen.getByRole("combobox", {
      name: "Override for roles.update",
    });
    expect(adminPermission).toBeDisabled();
    expect(adminPermission).toHaveValue("INHERIT");
    expect(
      screen.getByText("Admin-only permission; unavailable for this role."),
    ).toBeVisible();
    expect(
      within(
        screen.getByRole("combobox", { name: "Override for assets.read" }),
      ).getByRole("option", { name: "Allow" }),
    ).not.toBeDisabled();
  });
});
