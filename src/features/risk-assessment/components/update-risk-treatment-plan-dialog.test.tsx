import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { riskRegisterDetailSchema } from "../schemas/risk-register-schema";
import { UpdateRiskTreatmentPlanDialog } from "./update-risk-treatment-plan-dialog";
const state = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock("../hooks/use-update-risk-treatment-plan", () => ({ useUpdateRiskTreatmentPlan: () => ({ mutateAsync: state.save, isPending: false }) }));
vi.mock("../hooks/use-create-risk-treatment-plan", () => ({ useRiskTreatmentPlanOptions: () => ({ data: { users: [], controls: [] } }) }));
vi.mock("@/components/feedback/toast", () => ({ useToast: () => ({ success: vi.fn(), warning: vi.fn() }) }));
beforeAll(() => { Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value(this: HTMLDialogElement) { this.setAttribute("open", ""); } }); });
afterEach(cleanup);
beforeEach(() => { state.save.mockReset(); state.save.mockResolvedValue({}); });
const id = "11111111-1111-4111-8111-111111111111";
const cost = { costToFix: "100000000", expectedLoss: "5000000", currency: "VND", periodMonths: 12, basis: "Synthetic comparison including one-time and operating costs." };
const plan = riskRegisterDetailSchema.shape.treatmentPlans.element.parse({ id, riskId: id, title: "Accept demo exposure", strategy: "accept", status: "draft", owner: { id, fullName: "Owner", inactive: false }, targetCompletionDate: "2027-12-31T00:00:00Z", actionCount: 0, progress: 0, updatedAt: "2026-10-19T00:00:00Z", controls: [], actions: [], acceptanceCost: cost });
it("preloads, edits and saves cost justification without inventing actions", async () => {
  render(<UpdateRiskTreatmentPlanDialog plan={plan} onClose={vi.fn()} />);
  expect(screen.getByLabelText("Cost to fix *")).toHaveValue("100000000");
  expect(screen.queryByRole("button", { name: "Add action" })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Expected loss *"), { target: { value: "6000000" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(state.save).toHaveBeenCalledWith(expect.objectContaining({ acceptanceCost: { ...cost, expectedLoss: "6000000" }, actions: [], expectedUpdatedAt: plan.updatedAt })));
});
it("requires missing costs on an old Accept plan instead of fabricating them", async () => {
  render(<UpdateRiskTreatmentPlanDialog plan={{ ...plan, acceptanceCost: null }} onClose={vi.fn()} />);
  fireEvent.submit(screen.getByRole("button", { name: "Save changes" }).closest("form") ?? document.createElement("form"));
  expect(await screen.findByRole("alert")).toHaveTextContent(/Accept requires/);
  expect(state.save).not.toHaveBeenCalled();
});
