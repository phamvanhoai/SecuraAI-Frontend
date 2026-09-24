import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DepartmentReportManager } from "./department-report-manager";
const mocks = vi.hoisted(() => ({ query: vi.fn(), session: vi.fn() }));
vi.mock("../hooks/use-department-report", () => ({
  useDepartmentReport: mocks.query,
}));
vi.mock("@/features/authentication-account", () => ({ useSessionUser: mocks.session }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe("department training report", () => {
  it("does not query the report without permission", () => {
    mocks.session.mockReturnValue({ data: { permissions: [] } });
    render(<DepartmentReportManager />);
    expect(screen.getByText(/do not have permission/)).toBeVisible();
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it("shows real totals and applies search and progress only on submit", () => {
    mocks.session.mockReturnValue({
      data: { permissions: ["training-department-reports.read"] },
    });
    const counts = {
      employees: 2,
      assignedEmployees: 1,
      assigned: 4,
      completed: 2,
      overdue: 1,
      coverageRate: 50,
      completionRate: 50,
    };
    mocks.query.mockReturnValue({
      data: {
        items: [
          { id: "it", name: "Information Technology", code: "IT", ...counts },
        ],
        summary: counts,
        pagination: { page: 1, total: 1, totalPages: 1 },
      },
      refetch: vi.fn(),
    });
    render(<DepartmentReportManager />);
    expect(screen.getByText("Information Technology")).toBeVisible();
    fireEvent.change(screen.getByLabelText("Search departments"), {
      target: { value: "IT" },
    });
    fireEvent.change(screen.getByLabelText("Progress"), {
      target: { value: "overdue" },
    });
    expect(mocks.query).toHaveBeenLastCalledWith(1, "", "all");
    fireEvent.click(screen.getByRole("button", { name: /^Search$/ }));
    expect(mocks.query).toHaveBeenLastCalledWith(1, "IT", "overdue");
  });
});
