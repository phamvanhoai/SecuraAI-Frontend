import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PolicyRevisionNotice } from "./policy-revision-notice";
import { PolicyDraftFormDialog } from "./policy-draft-form-dialog";
import { ownedPolicyDraftSchema } from "../schemas/policy-draft-schema";
vi.mock("../hooks/use-policy-drafts", () => ({
  useUpdatePolicyDraft: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useCreatePolicyDraft: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: vi.fn() }),
}));
afterEach(cleanup);
const id = "00000000-0000-4000-8000-000000000001";
const request = {
  id,
  reason: "Clarify the reporting responsibilities.\nAdd the contact point.",
  requestedAt: "2026-10-22T00:00:00Z",
  requestedBy: { id, name: "Reviewing Admin" },
};
it("renders the saved reason, author, time and resubmission guidance", () => {
  render(<PolicyRevisionNotice request={request} />);
  expect(
    screen.getByRole("heading", { name: "Latest revision request" }),
  ).toBeVisible();
  expect(
    screen.getByText(/Clarify the reporting responsibilities/),
  ).toBeVisible();
  expect(screen.getByText(/Requested by Reviewing Admin/)).toBeVisible();
  expect(screen.getByText(/submit it for review again/)).toBeVisible();
});
it.each([null, undefined])(
  "does not invent feedback when absent",
  (request) => {
    const { container } = render(<PolicyRevisionNotice request={request} />);
    expect(container).toBeEmptyDOMElement();
  },
);
it("shows honest fallback for a historical null reason", () => {
  render(<PolicyRevisionNotice request={{ ...request, reason: null }} />);
  expect(screen.getByText(/No reason was recorded/)).toBeVisible();
});
it("preserves revision feedback through the external draft contract and renders it in Edit draft", () => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  const draft = ownedPolicyDraftSchema.parse({
    policyId: id,
    policyCode: "POL-TEST",
    title: "Security policy",
    description: null,
    ownerUserId: id,
    policyStatus: "DRAFT",
    revisionRequest: request,
    version: {
      id,
      versionNumber: "1.0",
      content: "Policy content",
      changeSummary: null,
      status: "DRAFT",
      createdByUserId: id,
      createdAt: request.requestedAt,
    },
    createdAt: request.requestedAt,
    updatedAt: request.requestedAt,
  });
  render(<PolicyDraftFormDialog open draft={draft} onClose={vi.fn()} />);
  expect(screen.getByRole("dialog", { name: "Edit draft" })).toBeVisible();
  expect(
    screen.getByText(/Clarify the reporting responsibilities/),
  ).toBeVisible();
  expect(screen.getByLabelText("Policy content")).toHaveValue("Policy content");
});
