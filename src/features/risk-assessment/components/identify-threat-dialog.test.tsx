import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { IdentifyThreatDialog } from "./identify-threat-dialog";
const state = vi.hoisted(() => ({ risk: vi.fn(), save: vi.fn() }));
vi.mock("../hooks/use-risk-register", () => ({ useRiskRecord: state.risk }));
vi.mock("../hooks/use-identify-threat", () => ({ useIdentifyThreat: () => ({ mutateAsync: state.save, isPending: false }) }));
vi.mock("@/components/feedback/toast", () => ({ useToast: () => ({ success: vi.fn() }) }));
vi.mock("./risk-context-history-list", () => ({ RiskContextHistoryList: () => <p>Saved history remains readable</p> }));
beforeAll(() => { Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value(this: HTMLDialogElement) { this.setAttribute("open", ""); } }); });
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it.each(["Accepted Risk requires review", "Pending acceptance locks context", "Closed Risk is read-only"])("locks creation but preserves History: %s", (blockedReason) => {
  state.risk.mockReturnValue({ data: { acceptances: [], vulnerabilities: [{ id: "v", name: "Weakness", description: "Demo" }], contextHistory: [], vulnerabilityWorkflow: { canIdentify: false, blockedReason } } });
  render(<IdentifyThreatDialog riskId="risk" riskLabel="Demo risk" onClose={vi.fn()} />);
  expect(screen.getByLabelText("Threat name")).toBeDisabled();
  expect(screen.getByLabelText("Threat scenario")).toBeDisabled();
  expect(screen.getByLabelText("Threat scenario")).toHaveClass("disabled:bg-neutral-soft", "disabled:resize-none");
  expect(screen.getByRole("button", { name: "Identify threat" })).toBeDisabled();
  expect(screen.getByText(blockedReason)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: /History/ }));
  expect(screen.getByText("Saved history remains readable")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Close" })).toBeEnabled();
  expect(state.save).not.toHaveBeenCalled();
});
it('enables creation from the server capability after review', () => {
  state.risk.mockReturnValue({ data: { acceptances: [], vulnerabilities: [{ id: "v", name: "Weakness", description: "Demo" }], contextHistory: [], vulnerabilityWorkflow: { canIdentify: true, blockedReason: null } } });
  render(<IdentifyThreatDialog riskId="risk" riskLabel="Demo risk" onClose={vi.fn()} />);
  expect(screen.getByLabelText("Threat name")).toBeEnabled();
  expect(screen.getByRole("button", { name: "Identify threat" })).toBeEnabled();
});

it.each([
  ["Threat name", 100],
  ["Threat scenario", 2000],
] as const)("preserves overflow and blocks saving %s", async (label, maximum) => {
  state.risk.mockReturnValue({ data: { acceptances: [], vulnerabilities: [{ id: "v", name: "Weakness", description: "Demo" }], contextHistory: [], vulnerabilityWorkflow: { canIdentify: true, blockedReason: null } } });
  const user = userEvent.setup();
  render(<IdentifyThreatDialog riskId="risk" riskLabel="Demo risk" onClose={vi.fn()} />);
  const field = screen.getByLabelText(label);
  await user.click(field);
  await user.paste("A".repeat(maximum + 1));
  expect(field).toHaveValue("A".repeat(maximum + 1));
  const message = `Use at most ${maximum.toLocaleString("en-US")} characters.`;
  expect(await screen.findByText(message)).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Identify threat" }));
  expect(state.save).not.toHaveBeenCalled();
  await user.clear(field);
  await user.paste("A".repeat(maximum));
  await waitFor(() => expect(screen.queryByText(message)).not.toBeInTheDocument());
});
