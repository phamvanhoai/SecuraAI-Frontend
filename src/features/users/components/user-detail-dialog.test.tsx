import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ useUserDetail: vi.fn() }));
vi.mock("../hooks/use-user-detail", () => ({
  useUserDetail: mocks.useUserDetail,
}));

import { UserDetailDialog } from "./user-detail-dialog";

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

describe("UserDetailDialog", () => {
  it("renders account, role, security, and activity details", () => {
    mocks.useUserDetail.mockReturnValue({
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      data: {
        id: "00000000-0000-4000-8000-000000000010",
        email: "analyst@example.com",
        fullName: "Security Analyst",
        phone: "0901234567",
        employeeCode: "SEC-010",
        avatarUrl: null,
        status: "active",
        mustChangePassword: false,
        emailVerifiedAt: "2026-09-01T00:00:00.000Z",
        lastLoginAt: "2026-09-19T01:00:00.000Z",
        disabledAt: null,
        department: {
          id: "00000000-0000-4000-8000-000000000020",
          code: "SEC",
          name: "Security",
        },
        roles: [
          {
            id: "00000000-0000-4000-8000-000000000030",
            code: "SECURITY_OFFICER",
            name: "Security Officer",
            description: null,
            assignedAt: "2026-08-01T00:00:00.000Z",
          },
        ],
        createdAt: "2026-08-01T00:00:00.000Z",
        updatedAt: "2026-09-19T00:00:00.000Z",
      },
    });

    render(
      <UserDetailDialog
        userId="00000000-0000-4000-8000-000000000010"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(screen.getByText("Full name")).toBeInTheDocument();
    expect(screen.getAllByText("Security Analyst")).toHaveLength(2);
    expect(screen.getByText("Security Officer")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("Phone")).toBeInTheDocument();
    expect(screen.getByText("0901234567")).toBeInTheDocument();
    expect(screen.queryByText("MFA")).not.toBeInTheDocument();
  });

  it("closes through the secondary action", async () => {
    mocks.useUserDetail.mockReturnValue({
      isPending: true,
      isError: false,
      data: undefined,
      refetch: vi.fn(),
    });
    const onClose = vi.fn();
    render(
      <UserDetailDialog
        userId="00000000-0000-4000-8000-000000000010"
        onClose={onClose}
      />,
    );

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
