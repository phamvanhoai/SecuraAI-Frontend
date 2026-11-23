import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { ControlAssessmentManager } from "./control-assessment-manager";

const { save, history } = vi.hoisted(() => ({ save: vi.fn(), history: { items: [] as unknown[], applicability: "applicable", reviewRequired: false, reviewReasons: [] as string[] } }));
vi.mock("@/features/authentication-account", () => ({
  useSessionUser: () => ({ data: { permissions: ["compliance.assess-controls"] } }),
}));
vi.mock("@/components/feedback/toast", () => ({ useToast: () => ({ success: vi.fn() }) }));
vi.mock("../hooks/use-control-assessments", () => ({
  useCreateControlAssessment: () => ({ mutateAsync: save, isPending: false }),
  useControlAssessments: () => ({
    isPending: false, isError: false,
    data: {
      items: [{ id: "control", controlCode: "CTRL-DEMO", name: "Demo control", description: "Demo", applicability: history.applicability, implementationStatus: "planned", owner: null, evidence: [{ id: "00000000-0000-4000-8000-000000000001", name: "Test evidence", source: "Testing", collectedAt: "2026-01-01T00:00:00Z", reviewedAt: null }], assessments: history.items, reviewRequired: history.reviewRequired, reviewReasons: history.reviewReasons }],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    },
  }),
}));
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value(this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute("open"); } });
});
beforeEach(() => { vi.clearAllMocks(); history.items = []; history.applicability = "applicable"; history.reviewRequired = false; history.reviewReasons = []; save.mockResolvedValue({}); });
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
  await user.clear(screen.getByLabelText("Effectiveness (%)"));
  await user.type(screen.getByLabelText("Effectiveness (%)"), "90");
  await user.click(screen.getByRole("checkbox", { name: /Test evidence/ }));
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
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ body: expect.objectContaining({ evidenceIds: ["00000000-0000-4000-8000-000000000001"] }) }));
});

it('shows preserved Evidence snapshots and an honest legacy message in History', async () => {
  const base = { result: 'effective', effectiveness: 90, testMethod: 'Access test', notes: 'Verified scope', assessedAt: '2026-01-02T00:00:00Z', assessor: { id: 'actor', fullName: 'Officer' } };
  history.items = [
    { ...base, id: 'new', evidenceBasis: [{ id: 'old-evidence', name: 'Original archived report', source: 'Original test source', collectedAt: '2026-01-01T00:00:00Z', validFrom: null, validUntil: null }] },
    { ...base, id: 'legacy', evidenceBasis: null },
  ];
  const user = userEvent.setup();
  render(<ControlAssessmentManager />);
  await user.click(screen.getByRole('button', { name: 'Actions for CTRL-DEMO' }));
  await user.click(screen.getByRole('button', { name: /^Assess$/ }));
  await user.click(screen.getByRole('tab', { name: /History/ }));
  expect(screen.getByText('Original archived report')).toBeVisible();
  expect(screen.getByText('Original test source')).toBeVisible();
  expect(screen.getByText('Evidence snapshot was not recorded for this historical assessment.')).toBeVisible();
});
it('requires explicit Evidence selection before saving', async () => {
  const user = userEvent.setup();
  render(<ControlAssessmentManager />);
  await user.click(screen.getByRole('button', { name: 'Actions for CTRL-DEMO' }));
  await user.click(screen.getByRole('button', { name: /^Assess$/ }));
  await user.selectOptions(screen.getByLabelText('Implementation status *'), 'implemented');
  await user.type(screen.getByLabelText('Reason for implementation change *'), 'Deployment completed for testing.');
  await user.type(screen.getByLabelText('Effectiveness (%)'), '90');
  await user.click(screen.getByRole('button', { name: /Save assessment/ }));
  expect(await screen.findByText('Select at least one Evidence item used for this assessment.')).toBeVisible();
  expect(save).not.toHaveBeenCalled();
});

it.each(['not_applicable', 'under_review'])('disables saving for %s', async applicability => {
  history.applicability = applicability;
  const user = userEvent.setup();
  render(<ControlAssessmentManager />);
  await user.click(screen.getByRole('button', { name: 'Actions for CTRL-DEMO' }));
  await user.click(screen.getByRole('button', { name: /^Assess$/ }));
  await user.selectOptions(screen.getByLabelText('Implementation status *'), 'implemented');
  expect(screen.getByText(/Only Applicable controls can be assessed/)).toBeVisible();
  expect(screen.getByRole('button', { name: /Save assessment/ })).toBeDisabled();
  expect(save).not.toHaveBeenCalled();
});
it('keeps deployment editable but prevents saving Planned or Not implemented', async () => {
  const user = userEvent.setup();
  render(<ControlAssessmentManager />);
  await user.click(screen.getByRole('button', { name: 'Actions for CTRL-DEMO' }));
  await user.click(screen.getByRole('button', { name: /^Assess$/ }));
  expect(screen.getByRole('button', { name: /Save assessment/ })).toBeDisabled();
  await user.selectOptions(screen.getByLabelText('Implementation status *'), 'not_implemented');
  expect(screen.getByRole('button', { name: /Save assessment/ })).toBeDisabled();
  await user.selectOptions(screen.getByLabelText('Implementation status *'), 'partially_implemented');
  expect(screen.getByRole('button', { name: /Save assessment/ })).toBeEnabled();
});

it('keeps the latest result and displays review reasons in the list and assessment form', async () => {
  history.reviewRequired = true;
  history.reviewReasons = ['Evidence "Original report" has expired.'];
  history.items = [{ id: 'assessment', result: 'effective', effectiveness: 90, testMethod: 'Access test', notes: 'Historical assessment', assessedAt: '2026-01-02T00:00:00Z', assessor: { id: 'actor', fullName: 'Officer' }, evidenceBasis: null }];
  const user = userEvent.setup();
  render(<ControlAssessmentManager />);
  expect(screen.getByText('Effective', { selector: 'span' })).toBeVisible();
  expect(screen.getByText('Review required', { selector: 'span' })).toBeVisible();
  expect(screen.getAllByText('Evidence "Original report" has expired.')[0]).toBeVisible();
  await user.click(screen.getByRole('button', { name: 'Actions for CTRL-DEMO' }));
  await user.click(screen.getByRole('button', { name: /^Assess$/ }));
  expect(screen.getByText('Review the Control and Evidence, then save a new assessment. Historical results are preserved.')).toBeVisible();
});

it('starts the first assessment without an assumed result or score and synchronizes user choices', async () => {
  const user = userEvent.setup();
  render(<ControlAssessmentManager />);
  await user.click(screen.getByRole('button', { name: 'Actions for CTRL-DEMO' }));
  await user.click(screen.getByRole('button', { name: /^Assess$/ }));
  const score = screen.getByLabelText('Effectiveness (%)');
  const result = screen.getByLabelText('Testing result');
  expect(score).toHaveValue(null);
  expect(result).toHaveValue('');
  await user.selectOptions(result, 'partially_effective');
  expect(score).toHaveValue(50);
  await user.clear(score);
  await user.type(score, '85');
  expect(result).toHaveValue('effective');
  await user.clear(score);
  expect(result).toHaveValue('');
});
