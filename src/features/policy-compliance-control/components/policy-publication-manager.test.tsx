import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PolicyPublicationManager } from "./policy-publication-manager";

afterEach(cleanup);

const mocks = vi.hoisted(() => ({ approve: vi.fn() }));

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
  mocks.approve.mockReset();
});

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock("../hooks/use-policy-publication", () => ({
  usePublishablePolicies: (query: { q?: string }) => ({
    data: query.q
      ? {
          items: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        }
      : {
          items: [
            {
              id: "00000000-0000-4000-8000-000000000010",
              policyCode: "ISP-001",
              title: "Information Security Policy",
              description: "Corporate security requirements",
              ownerUserId: "00000000-0000-4000-8000-000000000012",
              status: "draft",
              draftVersion: {
                id: "00000000-0000-4000-8000-000000000011",
                versionNumber: "1.0",
                status: "draft",
                createdByUserId: null,
                createdAt: "2026-09-11T08:00:00.000Z",
              },
              updatedAt: "2026-09-11T08:00:00.000Z",
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
    isPending: false,
    isError: false,
  }),
  usePolicyReview: (policyId: string | null) => ({
    data: policyId ? {
      policyId: "00000000-0000-4000-8000-000000000010",
      policyCode: "ISP-001",
      title: "Information Security Policy",
      description: "Corporate security requirements",
      ownerUserId: "00000000-0000-4000-8000-000000000012",
      policyStatus: "draft",
      updatedAt: "2026-09-11T08:00:00.000Z",
      version: {
        id: "00000000-0000-4000-8000-000000000011",
        versionNumber: "1.0",
        status: "in_review",
        content: "Policy content",
        changeSummary: null,
        effectiveDate: null,
        createdByUserId: null,
        createdAt: "2026-09-11T08:00:00.000Z",
      },
    } : undefined,
    isPending: false,
    isError: false,
  }),
  useApprovePolicyForPublication: () => ({
    isPending: false,
    mutateAsync: mocks.approve,
  }),
}));

describe("PolicyPublicationManager", () => {
  it("renders the Log Sources-aligned publication workspace in English", () => {
    render(<PolicyPublicationManager />);

    expect(
      screen.getByRole("heading", {
        name: "Approve policy versions",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Information Security Policy")).toBeInTheDocument();
    expect(screen.getAllByText("Awaiting approval")).toHaveLength(2);
    expect(
      screen.getByPlaceholderText("Search by policy code or title"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Actions for Information Security Policy",
      }),
    ).toBeInTheDocument();
  });

  it("keeps overview metrics when a search has no matches", async () => {
    const user = userEvent.setup();
    render(<PolicyPublicationManager />);

    await user.type(
      screen.getByPlaceholderText("Search by policy code or title"),
      "does-not-exist",
    );
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(
      await screen.findByText(
        "No policy drafts awaiting approval were found.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("1")).toHaveLength(4);
  });

  it("approves a reviewed policy without publishing it", async () => {
    const user = userEvent.setup();
    mocks.approve.mockResolvedValue({});
    render(<PolicyPublicationManager />);

    await user.click(
      screen.getByRole("button", {
        name: "Actions for Information Security Policy",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Review details" }));
    expect(screen.getByText("Policy content")).toBeInTheDocument();
    expect(
      screen.getByText(/It does not publish the policy immediately/),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Approve for publication" }),
    );
    expect(mocks.approve).toHaveBeenCalledWith({
      policyId: "00000000-0000-4000-8000-000000000010",
      versionId: "00000000-0000-4000-8000-000000000011",
    });
  });
});
