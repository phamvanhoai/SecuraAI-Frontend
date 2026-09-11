import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PolicyDraftsManager } from "./policy-drafts-manager";

const mocks = vi.hoisted(() => ({
  useSessionUser: vi.fn(),
  usePolicyDrafts: vi.fn(),
  usePolicyDraft: vi.fn(),
  searchParams: "",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/policies",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(mocks.searchParams),
}));
vi.mock("@/features/auth", () => ({ useSessionUser: mocks.useSessionUser }));
vi.mock("../hooks/use-policy-drafts", () => ({
  usePolicyDrafts: mocks.usePolicyDrafts,
  usePolicyDraft: mocks.usePolicyDraft,
}));
vi.mock("./policy-draft-form-dialog", () => ({
  PolicyDraftFormDialog: () => null,
}));

afterEach(cleanup);

describe("PolicyDraftsManager", () => {
  beforeEach(() => {
    mocks.searchParams = "";
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
