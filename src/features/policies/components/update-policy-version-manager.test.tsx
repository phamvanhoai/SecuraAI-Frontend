import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  session: vi.fn(),
  success: vi.fn(),
}));

vi.mock("@/features/auth", () => ({
  useSessionUser: mocks.session,
}));
vi.mock("../hooks/use-update-policy-version", () => ({
  usePublishedPoliciesForNewVersion: () => ({
    data: [
      {
        id: "00000000-0000-4000-8000-000000000010",
        policyCode: "ISP-001",
        title: "Information Security Policy",
        description: null,
        currentVersion: "1.0",
        updatedAt: "2026-09-13T00:00:00.000Z",
      },
    ],
    isPending: false,
    isError: false,
  }),
  useUpdatePolicyVersion: () => ({
    isPending: false,
    mutateAsync: mocks.mutateAsync,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
}));

import { UpdatePolicyVersionManager } from "./update-policy-version-manager";

const policyId = "00000000-0000-4000-8000-000000000010";
const createdVersion = {
  policyId,
  policyCode: "ISP-001",
  title: "Information Security Policy",
  description: null,
  ownerUserId: null,
  policyStatus: "draft" as const,
  version: {
    id: "00000000-0000-4000-8000-000000000011",
    versionNumber: "1.1",
    content: "Updated content",
    changeSummary: "Added access review requirements",
    status: "draft" as const,
    createdByUserId: null,
    createdAt: "2026-09-13T00:00:00.000Z",
  },
  updatedAt: "2026-09-13T00:00:00.000Z",
};

afterEach(cleanup);

describe("UpdatePolicyVersionManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute("open", "");
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute("open");
    };
    mocks.session.mockReturnValue({
      data: { permissions: ["policies.update"] },
      isPending: false,
      isError: false,
    });
  });

  it("shows inline validation before sending a request", async () => {
    const user = userEvent.setup();
    render(<UpdatePolicyVersionManager />);

    await user.click(
      screen.getByRole("button", { name: "Create new version" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Create draft version" }),
    );

    expect(
      await screen.findByText("New version number is required."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Policy ID")).not.toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it("submits the backend request and confirms the created draft version", async () => {
    const user = userEvent.setup();
    mocks.mutateAsync.mockResolvedValue(createdVersion);
    render(<UpdatePolicyVersionManager />);

    await user.click(
      screen.getByRole("button", { name: "Create new version" }),
    );
    fireEvent.change(screen.getByLabelText("New version number"), {
      target: { value: "1.1" },
    });
    fireEvent.change(screen.getByLabelText("Policy content"), {
      target: { value: "Updated content" },
    });
    fireEvent.change(screen.getByLabelText("Change summary"), {
      target: { value: "Added access review requirements" },
    });
    await user.click(
      screen.getByRole("button", { name: "Create draft version" }),
    );

    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        policyId,
        input: {
          versionNumber: "1.1",
          content: "Updated content",
          changeSummary: "Added access review requirements",
        },
      }),
    );
    expect(mocks.success).toHaveBeenCalledWith(
      "New policy version created",
      "ISP-001 version 1.1 is ready for review as a draft.",
    );
  });

  it("does not expose the form without policies.update", () => {
    mocks.session.mockReturnValue({
      data: { permissions: [] },
      isPending: false,
      isError: false,
    });

    render(<UpdatePolicyVersionManager />);

    expect(
      screen.getByText("You do not have permission to update policies"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Create draft version" }),
    ).not.toBeInTheDocument();
  });
});
