import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ useSessionUser: vi.fn() }));

vi.mock("@/features/authentication-account", () => ({
  useSessionUser: mocks.useSessionUser,
}));

vi.mock("@/features/audit-security-reporting", () => ({
  SecurityDashboardView: () => <div>Security posture telemetry</div>,
}));

vi.mock(
  "@/features/policy-compliance-control/hooks/use-policy-acknowledgements",
  () => ({
    useEmployeePolicies: () => ({
      data: { pagination: { total: 2 } },
      isPending: false,
    }),
  }),
);

vi.mock("@/features/notification-system-logs", () => ({
  useNotificationInbox: () => ({
    data: { unreadCount: 3 },
    isPending: false,
  }),
}));

import { DashboardRoleRouter } from "./dashboard-role-router";

const user = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "employee@gmail.com",
  fullName: "Employee Test",
  status: "ACTIVE",
  mustChangePassword: false,
  roles: [{ code: "EMPLOYEE", name: "Employee" }],
  permissions: ["policies.acknowledge", "risks.read"],
};

describe("DashboardRoleRouter", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it("does not request the privileged dashboard view for an Employee", () => {
    mocks.useSessionUser.mockReturnValue({ isPending: false, data: user });

    render(<DashboardRoleRouter />);

    expect(
      screen.getByRole("heading", { name: "Welcome back, Employee Test" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /Policies/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /Owned risks/ })).toBeVisible();
    expect(
      screen.queryByText("Security posture telemetry"),
    ).not.toBeInTheDocument();
  });

  it("shows only capability-backed contextual destinations", () => {
    mocks.useSessionUser.mockReturnValue({
      isPending: false,
      data: { ...user, permissions: [] },
    });

    render(<DashboardRoleRouter />);

    expect(
      screen.queryByRole("link", { name: /Policies/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Owned risks/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Incidents/ })).toBeVisible();
    expect(screen.getByRole("link", { name: /Notifications/ })).toBeVisible();
  });

  it.each(["SECURITY_OFFICER", "EXECUTIVE"])(
    "shows security posture telemetry for %s",
    (code) => {
      mocks.useSessionUser.mockReturnValue({
        isPending: false,
        data: { ...user, roles: [{ code, name: code }] },
      });

      render(<DashboardRoleRouter />);

      expect(screen.getByText("Security posture telemetry")).toBeVisible();
      expect(screen.queryByText(/Welcome,/)).not.toBeInTheDocument();
    },
  );
});
