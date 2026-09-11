import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PolicyDraftsManager } from "./policy-drafts-manager";

const mocks = vi.hoisted(() => ({
  useSessionUser: vi.fn(),
  usePolicyDrafts: vi.fn(),
  usePolicyDraft: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/policies",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
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
            description: null,
            ownerUserId: null,
            policyStatus: "draft",
            version: {
              id: "00000000-0000-4000-8000-000000000020",
              versionNumber: "1.0",
              content: "Nội dung",
              changeSummary: null,
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
      screen.getByRole("heading", { name: "Bản nháp chính sách ATTT" }),
    ).toBeInTheDocument();
    expect(screen.getByText("POL-SEC-001")).toBeInTheDocument();
    expect(
      screen.getByText("Chính sách an toàn thông tin"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tạo bản nháp" }),
    ).toBeInTheDocument();
  });

  it("does not expose draft data without policies.create", () => {
    mocks.useSessionUser.mockReturnValue({
      data: { permissions: [] },
      isPending: false,
    });

    render(<PolicyDraftsManager />);

    expect(
      screen.getByText("Bạn không có quyền quản lý bản nháp chính sách"),
    ).toBeInTheDocument();
    expect(screen.queryByText("POL-SEC-001")).not.toBeInTheDocument();
    expect(mocks.usePolicyDrafts).toHaveBeenCalledWith(
      { page: 1, limit: 20, sortOrder: "desc" },
      false,
    );
  });
});
