import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PolicyDepartmentAssignmentManager } from "./policy-department-assignment-manager";

const mocks = vi.hoisted(() => ({
  assign: vi.fn(),
  session: vi.fn(),
  useAssignments: vi.fn(),
}));

vi.mock("@/features/auth", () => ({ useSessionUser: mocks.session }));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: vi.fn() }),
}));
vi.mock("../hooks/use-policy-department-assignments", () => ({
  usePolicyDepartmentAssignments: mocks.useAssignments,
  useAssignPolicyDepartments: () => ({
    isPending: false,
    mutateAsync: mocks.assign,
  }),
}));

afterEach(cleanup);

describe("PolicyDepartmentAssignmentManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    HTMLDialogElement.prototype.showModal = function showModal(): void {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function close(): void {
      this.removeAttribute("open");
    };
    mocks.session.mockReturnValue({
      data: { permissions: ["policies.assign-department"] },
      isPending: false,
    });
    mocks.useAssignments.mockReturnValue({
      data: {
        items: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            policyCode: "POL-001",
            title: "Access control policy",
            updatedAt: "2026-09-14T00:00:00.000Z",
            departments: [],
          },
        ],
        departments: [
          {
            id: "00000000-0000-4000-8000-000000000002",
            code: "IT",
            name: "Information Technology",
          },
        ],
        departmentsTruncated: false,
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
      isPending: false,
      isError: false,
    });
    mocks.assign.mockResolvedValue({
      policyId: "00000000-0000-4000-8000-000000000001",
      policyCode: "POL-001",
      departmentIds: ["00000000-0000-4000-8000-000000000002"],
    });
  });

  it("assigns a published policy to selected departments", async () => {
    const user = userEvent.setup();
    render(<PolicyDepartmentAssignmentManager />);

    expect(screen.getByText("Access control policy")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Assign departments" }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: /Information Technology/ }),
    );
    await user.click(screen.getByRole("button", { name: "Save assignments" }));

    expect(mocks.assign).toHaveBeenCalledWith({
      policyId: "00000000-0000-4000-8000-000000000001",
      body: {
        departmentIds: ["00000000-0000-4000-8000-000000000002"],
      },
    });
  });

  it("does not request assignment data without permission", () => {
    mocks.session.mockReturnValue({
      data: { permissions: [] },
      isPending: false,
    });

    render(<PolicyDepartmentAssignmentManager />);

    expect(
      screen.getByText("You do not have permission to assign policies"),
    ).toBeInTheDocument();
    expect(mocks.useAssignments).toHaveBeenCalledWith(
      { page: 1, limit: 20 },
      false,
    );
  });
});
