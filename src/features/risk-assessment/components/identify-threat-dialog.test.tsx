import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  state.risk.mockReturnValue({ data: { vulnerabilities: [{ id: "v", name: "Weakness", description: "Demo" }], contextHistory: [], vulnerabilityWorkflow: { canIdentify: false, blockedReason } } });
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
  state.risk.mockReturnValue({ data: { vulnerabilities: [{ id: "v", name: "Weakness", description: "Demo" }], contextHistory: [], vulnerabilityWorkflow: { canIdentify: true, blockedReason: null } } });
  render(<IdentifyThreatDialog riskId="risk" riskLabel="Demo risk" onClose={vi.fn()} />);
  expect(screen.getByLabelText("Threat name")).toBeEnabled();
  expect(screen.getByRole("button", { name: "Identify threat" })).toBeEnabled();
});
