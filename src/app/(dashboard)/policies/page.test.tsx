import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ session: vi.fn() }));

vi.mock("@/features/auth", () => ({ useSessionUser: mocks.session }));
vi.mock("@/features/policies", () => ({
  PolicyDraftsManager: ({
    onAssignDepartments,
    onCreateNewVersion,
  }: {
    onAssignDepartments?: () => void;
    onCreateNewVersion?: () => void;
  }) => (
    <div>
      <button type="button" onClick={onCreateNewVersion}>
        Open new-version workflow
      </button>
      {onAssignDepartments ? (
        <button type="button" onClick={onAssignDepartments}>
          Open assignment workflow
        </button>
      ) : null}
    </div>
  ),
  PolicyDepartmentAssignmentManager: ({ onBack }: { onBack?: () => void }) => (
    <div>
      <p>Department assignment workflow</p>
      {onBack ? (
        <button type="button" onClick={onBack}>
          Back to drafts
        </button>
      ) : null}
    </div>
  ),
  PolicyPublicationManager: () => <p>Publication workflow</p>,
  UpdatePolicyVersionManager: ({ onBack }: { onBack?: () => void }) => (
    <div>
      <p>New-version workflow</p>
      {onBack ? (
        <button type="button" onClick={onBack}>
          Back to drafts
        </button>
      ) : null}
    </div>
  ),
}));

import PoliciesPage from "./page";

afterEach(cleanup);

describe("PoliciesPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lets a policy author move between drafts and the new-version workflow", async () => {
    const user = userEvent.setup();
    mocks.session.mockReturnValue({
      data: { permissions: ["policies.create", "policies.update"] },
      isPending: false,
    });

    render(<PoliciesPage />);

    await user.click(
      screen.getByRole("button", { name: "Open new-version workflow" }),
    );
    expect(screen.getByText("New-version workflow")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to drafts" }));
    expect(
      screen.getByRole("button", { name: "Open new-version workflow" }),
    ).toBeInTheDocument();
  });

  it("shows the new-version workflow directly with update-only access", () => {
    mocks.session.mockReturnValue({
      data: { permissions: ["policies.update"] },
      isPending: false,
    });

    render(<PoliciesPage />);

    expect(screen.getByText("New-version workflow")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Back to drafts" }),
    ).not.toBeInTheDocument();
  });

  it("lets a policy author open department assignment and return", async () => {
    const user = userEvent.setup();
    mocks.session.mockReturnValue({
      data: {
        permissions: ["policies.create", "policies.assign-department"],
      },
      isPending: false,
    });

    render(<PoliciesPage />);
    await user.click(
      screen.getByRole("button", { name: "Open assignment workflow" }),
    );
    expect(
      screen.getByText("Department assignment workflow"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to drafts" }));
    expect(
      screen.getByRole("button", { name: "Open assignment workflow" }),
    ).toBeInTheDocument();
  });

  it("shows department assignment directly with assign-only access", () => {
    mocks.session.mockReturnValue({
      data: { permissions: ["policies.assign-department"] },
      isPending: false,
    });

    render(<PoliciesPage />);

    expect(
      screen.getByText("Department assignment workflow"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Back to drafts" }),
    ).not.toBeInTheDocument();
  });
});
