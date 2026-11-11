import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { ControlAssessmentManager } from "./control-assessment-manager";

const { save } = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock("@/features/authentication-account", () => ({
  useSessionUser: () => ({ data: { permissions: ["compliance.assess-controls"] } }),
}));
vi.mock("@/components/feedback/toast", () => ({ useToast: () => ({ success: vi.fn() }) }));
vi.mock("../hooks/use-control-assessments", () => ({
  useCreateControlAssessment: () => ({ mutateAsync: save, isPending: false }),
  useControlAssessments: () => ({
    isPending: false, isError: false,
    data: {
      items: [{ id: "control", controlCode: "CTRL-DEMO", name: "Demo control", description: "Demo", applicability: "applicable", implementationStatus: "planned", owner: null, evidence: [{ id: "evidence", name: "Test evidence", source: "Testing", collectedAt: "2026-01-01T00:00:00Z", reviewedAt: null }], assessments: [] }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    },
  }),
}));
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value(this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute("open"); } });
});
beforeEach(() => { vi.clearAllMocks(); save.mockResolvedValue({}); });
afterEach(cleanup);

it.each([
  ["Test method", 1000],
  ["Assessment notes", 5000],
  ["Reason for implementation change *", 2000],
] as const)("preserves overflowing %s and prevents assessment submission", async (label, maximum) => {
  const user = userEvent.setup();
  render(<ControlAssessmentManager />);
  await user.click(screen.getByRole("button", { name: "Actions for CTRL-DEMO" }));
  await user.click(screen.getByRole("button", { name: /^Assess$/ }));
  await user.selectOptions(screen.getByLabelText("Implementation status *"), "implemented");
  await user.click(screen.getByLabelText("Test method"));
  await user.paste("Test access restrictions");
  await user.click(screen.getByLabelText("Assessment notes"));
  await user.paste("All access restriction scenarios passed.");
  await user.click(screen.getByLabelText("Reason for implementation change *"));
  await user.paste("Deployment completed and tested.");
  const field = screen.getByLabelText(label);
  await user.clear(field);
  await user.click(field);
  await user.paste("A".repeat(maximum + 1));
  expect(field).toHaveValue("A".repeat(maximum + 1));
  const message = `Use at most ${maximum.toLocaleString("en-US")} characters.`;
  expect(await screen.findByText(message)).toBeVisible();
  const submit = screen.getByRole("button", { name: /Save assessment/ });
  await user.click(submit);
  expect(save).not.toHaveBeenCalled();
  await user.clear(field);
  await user.paste("A".repeat(maximum));
  expect(screen.queryByText(message)).not.toBeInTheDocument();
  await user.click(submit);
  await waitFor(() => expect(save).toHaveBeenCalledOnce());
});
