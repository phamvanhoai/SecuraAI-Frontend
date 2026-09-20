import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ items: [] as unknown[] }));
vi.mock("../hooks/use-session-user", () => ({
  useSessionUser: () => ({
    isSuccess: true,
    data: {
      id: "admin-id",
      email: "admin@example.test",
      permissions: ["mfa-recovery.manage"],
    },
  }),
}));
vi.mock("../hooks/use-mfa-recovery", () => ({
  useMfaRecoveryRequests: () => ({
    data: {
      items: mocks.items,
      pagination: { page: 1, totalPages: 1 },
    },
  }),
  useDecideMfaRecoveryRequest: () => ({ mutate: vi.fn() }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

import { MfaRecoveryAdmin } from "./mfa-recovery-admin";

function request(id: string, email: string, fullName: string) {
  return {
    id: `request-${id}`,
    status: "pending",
    submittedAt: new Date("2026-09-18T00:00:00Z"),
    user: { id, email, fullName },
  };
}

afterEach(cleanup);

describe("MfaRecoveryAdmin", () => {
  it("hides the current administrator by ID and normalized email while retaining other users", () => {
    mocks.items = [
      request("admin-id", "old@example.test", "Current admin by ID"),
      request("different-id", "ADMIN@example.test", "Current admin by email"),
      request("other-id", "other@example.test", "Other administrator"),
    ];
    render(<MfaRecoveryAdmin />);
    expect(screen.queryByText("Current admin by ID")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Current admin by email"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Other administrator")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Approve" })).toHaveLength(1);
  });

  it("shows an empty state when only the current administrator has a request", () => {
    mocks.items = [request("admin-id", "admin@example.test", "Current admin")];
    render(<MfaRecoveryAdmin />);
    expect(screen.getByText("No pending requests")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Approve" }),
    ).not.toBeInTheDocument();
  });
});
