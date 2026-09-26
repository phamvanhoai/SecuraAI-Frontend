import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ session: vi.fn() }));

vi.mock("@/features/authentication-account", () => ({ useSessionUser: mocks.session }));
vi.mock("@/features/policy-compliance-control", () => ({
  EmployeePolicyAcknowledgementManager: ({ onViewHistory }: { onViewHistory?: () => void }) => (
    <div>
      <p>Employee policy acknowledgement</p>
      <button role="tab" type="button">Published</button>
      {onViewHistory ? <button role="tab" type="button" onClick={onViewHistory}>Version history</button> : null}
    </div>
  ),
  PolicyDraftsManager: ({
    onAssignDepartments,
    onCreateNewVersion,
    onMapControls,
    onViewPublished,
    onViewHistory,
  }: {
    onAssignDepartments?: () => void;
    onCreateNewVersion?: () => void;
    onMapControls?: () => void;
    onViewPublished?: () => void;
    onViewHistory?: () => void;
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
      {onMapControls ? (
        <button type="button" onClick={onMapControls}>
          Open control-mapping workflow
        </button>
      ) : null}
      <button role="tab" type="button">Drafts</button>
      <button role="tab" type="button">Rejected</button>
      {onViewPublished ? <button role="tab" type="button" onClick={onViewPublished}>Published</button> : null}
      {onViewHistory ? <button type="button" onClick={onViewHistory}>Version history</button> : null}
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
  PolicyVersionHistoryManager: ({ onBack }: { onBack?: () => void }) => (
    <div><p>Version history workflow</p>{onBack ? <button role="tab" type="button" onClick={onBack}>Drafts</button> : null}</div>
  ),
  PublishedPolicyManager: ({ onViewDrafts, onViewHistory }: { onViewDrafts?: () => void; onViewHistory?: () => void }) => (
    <div>
      <p>Published policy viewer</p>
      {onViewDrafts ? <button role="tab" type="button" onClick={onViewDrafts}>Drafts</button> : null}
      <button role="tab" type="button">Published</button>
      {onViewHistory ? <button type="button" onClick={onViewHistory}>Version history</button> : null}
    </div>
  ),
  PolicyControlMappingManager: ({ onBack }: { onBack?: () => void }) => (
    <div>
      <p>Control-mapping workflow</p>
      {onBack ? <button onClick={onBack}>Back to policies</button> : null}
    </div>
  ),
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

  it("lets a Security Officer view published policies", async () => {
    const user = userEvent.setup();
    mocks.session.mockReturnValue({
      data: { permissions: ["policies.create", "policies.update"] },
      isPending: false,
    });
    render(<PoliciesPage />);
    const publishedTab = screen.getByRole("tab", {
      name: "Published",
    });
    await user.click(publishedTab);
    expect(screen.getByText("Published policy viewer")).toBeInTheDocument();
  });

  it("shows policy views as tabs for a Security Officer", async () => {
    const user = userEvent.setup();
    mocks.session.mockReturnValue({
      data: { permissions: ["policies.create", "policies.update"] },
      isPending: false,
    });
    render(<PoliciesPage />);

    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(screen.getByRole("tab", { name: "Drafts" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Version history" }));
    expect(screen.getByText("Version history workflow")).toBeInTheDocument();
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

  it("lets a policy author open control mapping and return", async () => {
    const user = userEvent.setup();
    mocks.session.mockReturnValue({
      data: { permissions: ["policies.create", "compliance.map-controls"] },
      isPending: false,
    });
    render(<PoliciesPage />);
    await user.click(
      screen.getByRole("button", { name: "Open control-mapping workflow" }),
    );
    expect(screen.getByText("Control-mapping workflow")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to policies" }));
    expect(
      screen.getByRole("button", { name: "Open control-mapping workflow" }),
    ).toBeInTheDocument();
  });

  it("shows policy acknowledgement for an employee", () => {
    mocks.session.mockReturnValue({
      data: { permissions: ["policies.acknowledge"] },
      isPending: false,
    });
    render(<PoliciesPage />);
    expect(
      screen.getByText("Employee policy acknowledgement"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tab", { name: "Published" })).toBeInTheDocument();
  });
});
