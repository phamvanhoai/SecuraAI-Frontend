import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { riskRegisterDetailSchema } from "../schemas/risk-register-schema";
const save = vi.hoisted(() => vi.fn());
vi.mock("../hooks/use-complete-risk-review", () => ({ useCompleteRiskReview: () => ({ mutateAsync: save, isPending: false }) }));
vi.mock("@/components/feedback/toast", () => ({ useToast: () => ({ success: vi.fn() }) }));
import { CompleteRiskReviewDialog } from "./complete-risk-review-dialog";
const id = "00000000-0000-4000-8000-000000000001";
function fixture() {
  return riskRegisterDetailSchema.parse({ id, riskCode: "RSK", title: "Risk", description: null, status: "open", owner: null,
    reviewDate: "2026-10-16T00:00:00Z", assets: [], createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-25T00:00:00Z",
    latestAssessment: null, linkedCounts: { controls: 0, treatmentPlans: 0, incidents: 0 }, activeTreatmentPlan: null,
    createdBy: null, assessments: [{ id, type: "periodic_review", inherentLikelihood: 4, inherentImpact: 4, inherentRating: "high",
      controlEffectiveness: 80, residualLikelihood: 2, residualImpact: 5, residualRating: "high", targetRisk: "low", riskAppetite: "medium", riskTolerance: "medium",
      reason: "Assessment", methodologyVersion: "SECURAAI-RISK-MATRIX-v1", assessedBy: null, assessedAt: "2026-10-26T00:00:00Z", reviewDate: null }],
    controls: [], threats: [], vulnerabilities: [], treatmentPlans: [], incidents: [], acceptances: [],
    currentReview: { openedAt: "2026-10-25T00:00:00Z", openedBy: id, openedByName: "Owner", previousReviewDate: "2026-10-16T00:00:00Z", reason: "Periodic review" }, canCompleteReview: true,
  });
}
beforeAll(() => { Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value(this: HTMLDialogElement) { this.setAttribute("open", ""); } }); });
beforeEach(() => { vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-10-27T10:00:00Z")); save.mockResolvedValue({}); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });
it("submits conclusion, chosen deadline and exact review/assessment revisions", async () => {
  const risk = fixture();
  render(<CompleteRiskReviewDialog risk={risk} onClose={vi.fn()} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Review conclusion"), "Reviewed all current exposure and controls.");
  await user.clear(screen.getByLabelText("Next review date"));
  fireEvent.change(screen.getByLabelText("Next review date"), { target: { value: "2026-11-01" } });
  await user.click(screen.getByRole("button", { name: "Complete review" }));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({ assessmentId: id, expectedOpenedAt: risk.currentReview?.openedAt, expectedUpdatedAt: risk.updatedAt }));
});
it("blocks completion without residual after opening", () => {
  const risk = fixture(); risk.assessments = [];
  render(<CompleteRiskReviewDialog risk={risk} onClose={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Complete review" })).toBeDisabled();
  expect(screen.getByText(/Assess residual risk after opening/)).toBeVisible();
});
it("keeps entered conclusion on a stale-data conflict", async () => {
  save.mockRejectedValueOnce(new Error("Review changed. Refresh Risk."));
  const close = vi.fn();
  render(<CompleteRiskReviewDialog risk={fixture()} onClose={close} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Review conclusion"), "Reviewed current controls and exposure.");
  await user.click(screen.getByRole("button", { name: "Complete review" }));
  await waitFor(() => expect(screen.getByText("Review changed. Refresh Risk.")).toBeVisible());
  expect(screen.getByLabelText("Review conclusion")).toHaveValue("Reviewed current controls and exposure.");
  expect(close).not.toHaveBeenCalled();
});
