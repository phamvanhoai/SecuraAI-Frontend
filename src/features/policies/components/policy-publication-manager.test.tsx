import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PolicyPublicationManager } from "./policy-publication-manager";

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

vi.mock("../hooks/use-policy-publication", () => ({
  usePublishablePolicies: () => ({
    data: {
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
  usePolicyReview: () => ({
    data: undefined,
    isPending: false,
    isError: false,
  }),
  usePublishPolicyVersion: () => ({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
}));

describe("PolicyPublicationManager", () => {
  it("renders the Log Sources-aligned publication workspace in English", () => {
    render(<PolicyPublicationManager />);

    expect(
      screen.getByRole("heading", {
        name: "Publish official policy versions",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Information Security Policy")).toBeInTheDocument();
    expect(screen.getAllByText("Pending publication")).toHaveLength(2);
    expect(
      screen.getByPlaceholderText("Search by policy code or title"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Actions for Information Security Policy",
      }),
    ).toBeInTheDocument();
  });
});
