import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { UpdateActiveTreatmentPlanDialog } from "./update-active-treatment-plan-dialog";
const state = vi.hoisted(() => ({ detail: vi.fn() }));
vi.mock("../hooks/use-risk-register", () => ({ useRiskRecord: state.detail }));
vi.mock("./update-risk-treatment-plan-dialog", () => ({ UpdateRiskTreatmentPlanDialog: () => <div>Editable plan form</div> }));
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value(this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute("open"); } });
});
afterEach(cleanup);
it.each(["accepted", "closed", "archived"])("blocks stale Update entry for %s Risk", (status) => {
  state.detail.mockReturnValue({ data: { status, acceptances: [], treatmentPlans: [{ id: "plan", status: "draft" }] } });
  render(<UpdateActiveTreatmentPlanDialog riskId="risk" planId="plan" onClose={vi.fn()} />);
  expect(screen.queryByText("Editable plan form")).not.toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("read-only");
  expect(screen.getByRole("button", { name: "Close" })).toBeEnabled();
});
it("blocks pending acceptance even when the plan remains Draft", () => {
  state.detail.mockReturnValue({ data: { status: "open", acceptances: [{ decision: "pending" }], treatmentPlans: [{ id: "plan", status: "draft" }] } });
  render(<UpdateActiveTreatmentPlanDialog riskId="risk" planId="plan" onClose={vi.fn()} />);
  expect(screen.queryByText("Editable plan form")).not.toBeInTheDocument();
});
it("allows an eligible Draft plan after review", () => {
  state.detail.mockReturnValue({ data: { status: "open", acceptances: [], treatmentPlans: [{ id: "plan", status: "draft" }] } });
  render(<UpdateActiveTreatmentPlanDialog riskId="risk" planId="plan" onClose={vi.fn()} />);
  expect(screen.getByText("Editable plan form")).toBeInTheDocument();
});
