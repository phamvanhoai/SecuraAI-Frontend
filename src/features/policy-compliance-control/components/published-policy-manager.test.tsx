import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PublishedPolicyManager } from "./published-policy-manager";

vi.mock("@/features/authentication-account", () => ({
  useSessionUser: () => ({ data: { permissions: ["policies.update"] }, isPending: false }),
}));
vi.mock("../hooks/use-update-policy-version", () => ({
  usePublishedPoliciesForNewVersion: () => ({
    data: [{
      id: "00000000-0000-4000-8000-000000000010",
      policyCode: "ISP-001",
      title: "Information Security Policy",
      description: "Official requirements",
      currentVersion: "1.0",
      content: "Employees must protect company information.",
      changeSummary: "Initial publication",
      publishedAt: "2026-09-27T00:00:00.000Z",
      eligibleForNewVersion: true,
      updatedAt: "2026-09-27T00:00:00.000Z",
    }],
    isPending: false,
    isError: false,
  }),
}));

afterEach(cleanup);

describe("PublishedPolicyManager", () => {
  it("opens the official policy content from the list", async () => {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute("open");
    };
    const user = userEvent.setup();
    render(<PublishedPolicyManager />);
    await user.click(screen.getByRole("button", { name: "View policy" }));
    expect(screen.getByText("Employees must protect company information.")).toBeInTheDocument();
    expect(screen.getByText("Initial publication")).toBeInTheDocument();
  });
});
