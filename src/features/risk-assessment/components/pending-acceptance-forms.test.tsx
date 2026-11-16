import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { PENDING_ACCEPTANCE_MESSAGE } from "../pending-acceptance";
import { riskRegisterDetailSchema } from "../schemas/risk-register-schema";
import { IdentifyThreatDialog } from "./identify-threat-dialog";
import { EditThreatDialog } from "./edit-threat-dialog";
import { IdentifyVulnerabilityDialog } from "./identify-vulnerability-dialog";
import { EditVulnerabilityDialog } from "./edit-vulnerability-dialog";
import { AssessResidualRiskDialog } from "./assess-residual-risk-dialog";
import { DefineTargetRiskDialog } from "./define-target-risk-dialog";
import { CreateRiskTreatmentPlanDialog } from "./create-risk-treatment-plan-dialog";
import { UpdateRiskTreatmentPlanDialog } from "./update-risk-treatment-plan-dialog";
import { UpdateTreatmentActionProgressDialog } from "./update-treatment-action-progress-dialog";

const state = vi.hoisted(() => ({ save: vi.fn(), pending: true }));
vi.mock("../hooks/use-risk-register", () => ({ useRiskRecord: () => ({
  data: {
    status: "open", acceptances: state.pending ? [{ decision: "pending" }] : [],
    vulnerabilityWorkflow: { canIdentify: false, blockedReason: "Legacy pending message" },
    contextHistory: [], assessments: [], controls: [], vulnerabilities: [], treatmentPlans: [],
  }, isPending: false, isError: false,
}) }));
vi.mock("../hooks/use-identify-threat", () => ({ useIdentifyThreat: () => ({ mutateAsync: state.save }) }));
vi.mock("../hooks/use-update-threat", () => ({ useUpdateThreat: () => ({ mutateAsync: state.save }) }));
vi.mock("../hooks/use-identify-vulnerability", () => ({ useIdentifyVulnerability: () => ({ mutateAsync: state.save }) }));
vi.mock("../hooks/use-update-vulnerability", () => ({ useUpdateVulnerability: () => ({ mutateAsync: state.save }) }));
vi.mock("../hooks/use-assess-residual-risk", () => ({ useAssessResidualRisk: () => ({ mutateAsync: state.save }) }));
vi.mock("../hooks/use-define-target-risk", () => ({ useDefineTargetRisk: () => ({ mutateAsync: state.save }) }));
vi.mock("../hooks/use-update-risk-treatment-plan", () => ({ useUpdateRiskTreatmentPlan: () => ({ mutateAsync: state.save }) }));
vi.mock("../hooks/use-update-treatment-action-progress", () => ({ useUpdateTreatmentActionProgress: () => ({ mutateAsync: state.save }) }));
vi.mock("../hooks/use-vulnerability-control-options", () => ({ useVulnerabilityControlOptions: () => ({ data: [] }) }));
vi.mock("../hooks/use-create-risk-treatment-plan", () => ({
  useCreateRiskTreatmentPlan: () => ({ mutateAsync: state.save }),
  useRiskTreatmentPlanOptions: () => ({ data: { users: [], controls: [] } }),
}));
vi.mock("@/components/feedback/toast", () => ({ useToast: () => ({ success: vi.fn(), warning: vi.fn() }) }));

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value(this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute("open"); } });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const id = "11111111-1111-4111-8111-111111111111";
const timestamp = "2026-11-09T00:00:00Z";
const props = { riskId: id, riskLabel: "Demo", onClose: vi.fn() };
const plan = riskRegisterDetailSchema.shape.treatmentPlans.element.parse({
  id, riskId: id, title: "Demo plan", strategy: "mitigate", status: "active", owner: null,
  targetCompletionDate: timestamp, actionCount: 0, progress: 0, updatedAt: timestamp, actions: [], controls: [],
});
const cases = [
  { name: "Identify Threat", form: <IdentifyThreatDialog {...props} />, save: "Identify threat", field: "Threat name" },
  { name: "Edit Threat", form: <EditThreatDialog {...props} threat={{ id, name: "Threat", description: "Scenario", vulnerabilities: [], createdAt: timestamp, updatedAt: timestamp }} />, save: "Save changes", field: "Threat name" },
  { name: "Identify Vulnerability", form: <IdentifyVulnerabilityDialog {...props} />, save: "Identify vulnerability", field: "Vulnerability name" },
  { name: "Edit Vulnerability", form: <EditVulnerabilityDialog {...props} vulnerability={{ id, name: "Weakness", description: "Scenario", controls: [], updatedAt: timestamp }} />, save: "Save changes", field: "Vulnerability name" },
  { name: "Assess Residual", form: <AssessResidualRiskDialog {...props} />, save: "Save residual assessment" },
  { name: "Define Target", form: <DefineTargetRiskDialog {...props} />, save: "Define target" },
  { name: "Create Plan", form: <CreateRiskTreatmentPlanDialog {...props} />, save: "Create plan", field: "Plan title" },
  { name: "Update Plan and Actions", form: <UpdateRiskTreatmentPlanDialog plan={plan} onClose={props.onClose} />, save: "Save changes", field: "Plan title" },
  { name: "Update Action Progress", form: <UpdateTreatmentActionProgressDialog riskId={id} treatmentPlanId={id} action={{ id, title: "Demo action", description: null, assignee: null, dueDate: null, progressPercent: 0, status: "pending", completedAt: null, createdAt: timestamp, updatedAt: timestamp }} onClose={props.onClose} onReload={vi.fn()} />, save: "Save progress", field: "Progress (%)" },
];
it.each(cases)("$name uses the same pending warning and blocks edits", ({ form, save, field }) => {
  render(form);
  expect(screen.getByText(PENDING_ACCEPTANCE_MESSAGE)).toBeVisible();
  expect(screen.queryByText("Legacy pending message")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: save })).toBeDisabled();
  if (field) expect(screen.getByLabelText(field)).toBeDisabled();
  const history = screen.queryByRole("tab", { name: /History/ });
  if (history) {
    fireEvent.click(history);
    expect(history).toHaveAttribute("aria-selected", "true");
  }
  expect(state.save).not.toHaveBeenCalled();
});
