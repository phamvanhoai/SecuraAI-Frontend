import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PolicyDraftsManager } from "./policy-drafts-manager";

const mocks = vi.hoisted(() => ({
  useSessionUser: vi.fn(),
  usePolicyDrafts: vi.fn(),
  usePolicyDraft: vi.fn(),
  useSubmitPolicyForReview: vi.fn(),
  useRejectedPolicies: vi.fn(),
  submitPolicyForReview: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  searchParams: "",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/policies",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(mocks.searchParams),
}));
vi.mock("@/features/authentication-account", () => ({ useSessionUser: mocks.useSessionUser }));
vi.mock("../hooks/use-policy-drafts", () => ({
  usePolicyDrafts: mocks.usePolicyDrafts,
  usePolicyDraft: mocks.usePolicyDraft,
  useSubmitPolicyForReview: mocks.useSubmitPolicyForReview,
}));
vi.mock("../hooks/use-policy-publication", () => ({
  useRejectedPolicies: mocks.useRejectedPolicies,
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.toastSuccess, error: mocks.toastError }),
}));
vi.mock("./policy-draft-form-dialog", () => ({
  PolicyDraftFormDialog: () => null,
}));

afterEach(cleanup);

describe("PolicyDraftsManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute("open");
    };
    mocks.searchParams = "";
    mocks.useSubmitPolicyForReview.mockReturnValue({
      mutateAsync: mocks.submitPolicyForReview,
      isPending: false,
    });
    mocks.usePolicyDraft.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
    });
    mocks.usePolicyDrafts.mockReturnValue({
      data: {
        items: [
          {
            policyId: "00000000-0000-4000-8000-000000000010",
            policyCode: "POL-SEC-001",
            title: "Chính sách an toàn thông tin",
            description: "Corporate security requirements",
            ownerUserId: null,
            policyStatus: "draft",
            version: {
              id: "00000000-0000-4000-8000-000000000020",
              versionNumber: "1.0",
              content: "Nội dung",
              changeSummary: "Initial draft",
              status: "draft",
              createdByUserId: null,
              createdAt: "2026-09-11T00:00:00.000Z",
            },
            createdAt: "2026-09-11T00:00:00.000Z",
            updatedAt: "2026-09-11T00:00:00.000Z",
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
    mocks.useRejectedPolicies.mockReturnValue({
      data: {
        items: [
          {
            policyId: "00000000-0000-4000-8000-000000000030",
            policyCode: "POL-SEC-REJECTED",
            title: "Rejected security policy",
            version: {
              id: "00000000-0000-4000-8000-000000000040",
              versionNumber: "1.0",
              status: "rejected",
            },
            rejection: {
              reason: "Clarify the incident response responsibilities.",
              rejectedByUserId: "00000000-0000-4000-8000-000000000050",
              rejectedByName: "Admin Reviewer",
              rejectedAt: "2026-09-27T00:00:00.000Z",
            },
            updatedAt: "2026-09-27T00:00:00.000Z",
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("renders backend drafts and available actions for an authorized user", () => {
    mocks.useSessionUser.mockReturnValue({
      data: { permissions: ["policies.create"] },
      isPending: false,
    });

    render(<PolicyDraftsManager />);

    expect(
      screen.getByRole("heading", {
        name: "Information Security Policy Drafts",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("POL-SEC-001")).toBeInTheDocument();
    expect(
      screen.getByText("Chính sách an toàn thông tin"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create draft" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Drafts/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("shows rejected policies owned by the Security Officer in a tab", async () => {
    const user = userEvent.setup();
    mocks.useSessionUser.mockReturnValue({
      data: { permissions: ["policies.create"] },
      isPending: false,
    });

    render(<PolicyDraftsManager />);

    await user.click(screen.getByRole("tab", { name: /Rejected/ }));

    expect(screen.getByText("POL-SEC-REJECTED")).toBeInTheDocument();
    expect(
      screen.getByText("Clarify the incident response responsibilities."),
    ).toBeInTheDocument();
    expect(mocks.useRejectedPolicies).toHaveBeenCalledWith(
      { page: 1, limit: 20, sortOrder: "desc" },
      true,
    );
  });

  it("opens the new-version workflow for a user with update permission", async () => {
    const user = userEvent.setup();
    const onCreateNewVersion = vi.fn();
    mocks.useSessionUser.mockReturnValue({
      data: { permissions: ["policies.create", "policies.update"] },
      isPending: false,
    });

    render(<PolicyDraftsManager onCreateNewVersion={onCreateNewVersion} />);

    await user.click(
      screen.getByRole("button", { name: "Create new version" }),
    );
    expect(onCreateNewVersion).toHaveBeenCalledOnce();
  });

  it("confirms and submits a draft for Admin review", async () => {
    const user = userEvent.setup();
    mocks.useSessionUser.mockReturnValue({
      data: { permissions: ["policies.create", "policies.submit"] },
      isPending: false,
    });
    mocks.submitPolicyForReview.mockResolvedValue({});

    render(<PolicyDraftsManager />);

    await user.click(
      screen.getByRole("button", {
        name: /Actions for/,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Submit for review" }));
    expect(
      screen.getByRole("heading", { name: "Submit policy for review" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Submit for review" }));
    expect(mocks.submitPolicyForReview).toHaveBeenCalledWith({
      policyId: "00000000-0000-4000-8000-000000000010",
      versionId: "00000000-0000-4000-8000-000000000020",
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "Policy submitted for review",
      "POL-SEC-001 is now available to Admin reviewers.",
    );
  });

  it("opens department assignment when the action is available", async () => {
    const user = userEvent.setup();
    const onAssignDepartments = vi.fn();
    mocks.useSessionUser.mockReturnValue({
      data: {
        permissions: ["policies.create", "policies.assign-department"],
      },
      isPending: false,
    });

    render(<PolicyDraftsManager onAssignDepartments={onAssignDepartments} />);

    await user.click(
      screen.getByRole("button", {
        name: "Assign departments",
      }),
    );
    expect(onAssignDepartments).toHaveBeenCalledOnce();
  });

  it("does not expose draft data without policies.create", () => {
    mocks.useSessionUser.mockReturnValue({
      data: { permissions: [] },
      isPending: false,
    });

    render(<PolicyDraftsManager />);

    expect(
      screen.getByText("You do not have permission to manage policy drafts"),
    ).toBeInTheDocument();
    expect(screen.queryByText("POL-SEC-001")).not.toBeInTheDocument();
    expect(mocks.usePolicyDrafts).toHaveBeenCalledWith(
      { page: 1, limit: 20, sortOrder: "desc" },
      false,
    );
  });

  it("keeps overview metrics when filtered drafts are empty", () => {
    mocks.searchParams = "q=does-not-exist";
    mocks.useSessionUser.mockReturnValue({
      data: { permissions: ["policies.create"] },
      isPending: false,
    });
    const overviewResult = mocks.usePolicyDrafts();
    mocks.usePolicyDrafts
      .mockReset()
      .mockReturnValueOnce({
        data: {
          items: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        },
        isPending: false,
        isError: false,
        refetch: vi.fn(),
      })
      .mockReturnValue(overviewResult);

    render(<PolicyDraftsManager />);

    expect(screen.getByText("No policy drafts found.")).toBeInTheDocument();
    const metrics = screen.getByRole("region", {
      name: "Policy draft metrics",
    });
    expect(within(metrics).getAllByText("1")).toHaveLength(4);
  });
});
