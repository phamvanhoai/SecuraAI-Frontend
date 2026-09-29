import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PolicyPublicationManager } from "./policy-publication-manager";

afterEach(cleanup);

const mocks = vi.hoisted(() => ({ approve: vi.fn(), reject: vi.fn() }));

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function showModal(
    this: HTMLDialogElement,
  ) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function close(
    this: HTMLDialogElement,
  ) {
    this.removeAttribute("open");
  });
  mocks.approve.mockReset();
  mocks.reject.mockReset();
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
    data: policyId
      ? {
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
        }
      : undefined,
    isPending: false,
    isError: false,
  }),
  useApprovePolicyForPublication: () => ({
    isPending: false,
    mutateAsync: mocks.approve,
  }),
  useRequestPolicyRevision: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useRejectPolicy: () => ({ isPending: false, mutateAsync: mocks.reject }),
  useRejectedPolicies: () => ({
    data: {
      items: [
        {
          policyId: "00000000-0000-4000-8000-000000000020",
          policyCode: "ISP-009",
          title: "Rejected access policy",
          ownerUserId: "00000000-0000-4000-8000-000000000012",
          version: {
            id: "00000000-0000-4000-8000-000000000021",
            versionNumber: "2.0",
            status: "rejected",
          },
          rejection: {
            id: "00000000-0000-4000-8000-000000000022",
            reason: "Missing mandatory access review controls.",
            rejectedByUserId: "00000000-0000-4000-8000-000000000023",
            rejectedByName: "System Administrator",
            rejectedAt: "2026-09-26T08:00:00.000Z",
          },
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    },
    isPending: false,
    isError: false,
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
    expect(screen.getAllByText("Awaiting approval")).toHaveLength(3);
    expect(
      screen.getByPlaceholderText("Search by policy code or title"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Actions for Information Security Policy",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Rejected/ }),
    ).toHaveAttribute("aria-selected", "false");
  });

  it("keeps overview metrics when a search has no matches", async () => {
    const user = userEvent.setup();
    render(<PolicyPublicationManager />);

    await user.type(
      screen.getByPlaceholderText("Search by policy code or title"),
      "does-not-exist",
    );
    await user.click(
      screen.getByRole("button", { name: "Search policy drafts" }),
    );

    expect(
      await screen.findByText("No policy drafts awaiting approval were found."),
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole("region", { name: "Policy publication metrics" }),
      ).getAllByText("1"),
    ).toHaveLength(4);
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

  it("switches between the approval and rejected policy tabs", async () => {
    const user = userEvent.setup();
    render(<PolicyPublicationManager />);

    expect(
      screen.getByRole("tab", { name: /Awaiting approval/ }),
    ).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByText("Rejected access policy")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Rejected/ }));

    expect(screen.getByText("Rejected access policy")).toBeInTheDocument();
    expect(
      screen.getByText("Missing mandatory access review controls."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /Rejected/ }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("requires a reason and rejects the reviewed policy", async () => {
    const user = userEvent.setup();
    mocks.reject.mockResolvedValue({});
    render(<PolicyPublicationManager />);

    await user.click(screen.getByRole("button", { name: "Actions for Information Security Policy" }));
    await user.click(screen.getByRole("button", { name: "Review details" }));
    await user.click(screen.getByRole("button", { name: "Reject policy" }));
    await user.click(screen.getByRole("button", { name: "Confirm rejection" }));
    expect(screen.getByText(/at least 3 characters/)).toBeInTheDocument();

    await user.type(screen.getByLabelText("Rejection reason"), "Missing required controls.");
    await user.click(screen.getByRole("button", { name: "Confirm rejection" }));
    expect(mocks.reject).toHaveBeenCalledWith({
      policyId: "00000000-0000-4000-8000-000000000010",
      versionId: "00000000-0000-4000-8000-000000000011",
      body: { reason: "Missing required controls." },
    });
  });
});
