import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const useAudit = vi.hoisted(() => vi.fn());
vi.mock("../hooks/use-user-activity-audit", () => ({
  useUserActivityAudit: useAudit,
}));
import { UserActivityAuditLogManager } from "./user-activity-audit-log-manager";

describe("UserActivityAuditLogManager", () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    });
  });
  afterEach(cleanup);

  it("renders backend audit data and sends filters to the query hook", () => {
    useAudit.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        items: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            actor: {
              id: null,
              name: "Admin User",
              email: "admin@example.test",
            },
            action: "USER_UPDATED",
            resource: { type: "USER", id: null },
            occurredAt: "2026-10-08T08:00:00.000Z",
            outcome: "SUCCESS",
            source: "API",
            sourceIp: null,
            errorCode: null,
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, pageCount: 1 },
      },
    });
    render(<UserActivityAuditLogManager />);
    expect(screen.getByText("Admin User")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Filter by outcome"), {
      target: { value: "DENIED" },
    });
    expect(useAudit).toHaveBeenLastCalledWith(
      expect.objectContaining({ outcome: "DENIED" }),
    );
  });

  it("renders an actionable error state", () => {
    useAudit.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
    });
    render(<UserActivityAuditLogManager />);
    expect(
      screen.getByText(/unable to load audit records/i),
    ).toBeInTheDocument();
  });

  it("shows a meaningful preference resource instead of a raw UUID", () => {
    useAudit.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        items: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            actor: { id: null, name: "Nhi Nguyen", email: "nhi@example.test" },
            action: "PERSONAL_NOTIFICATION_PREFERENCES_UPDATED",
            resource: {
              type: "USER_NOTIFICATION_PREFERENCES",
              id: "bcecbb23-e122-4ab0-a92a-ee41880e44f9",
            },
            occurredAt: "2026-10-08T08:05:00.000Z",
            outcome: "SUCCESS",
            source: "API",
            sourceIp: null,
            errorCode: null,
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, pageCount: 1 },
      },
    });
    render(<UserActivityAuditLogManager />);
    expect(
      screen.getByText("Notification preferences · Nhi Nguyen"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("bcecbb23-e122-4ab0-a92a-ee41880e44f9"),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/08\/10\/2026/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    expect(
      screen.queryByText("bcecbb23-e122-4ab0-a92a-ee41880e44f9"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Technical resource ID")).not.toBeInTheDocument();
  });
});
