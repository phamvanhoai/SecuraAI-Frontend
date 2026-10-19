import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import {
  DecideRiskAcceptanceDialog,
  OpenRiskReviewDialog,
  SubmitRiskAcceptanceDialog,
} from "./risk-acceptance-dialogs";
import { riskRegisterDetailSchema } from "../schemas/risk-register-schema";
const mutations = vi.hoisted(() => ({
  submit: vi.fn(),
  decide: vi.fn(),
  review: vi.fn(),
}));
vi.mock("../hooks/use-risk-acceptance", () => ({
  useSubmitRiskAcceptance: () => ({
    mutateAsync: mutations.submit,
    isPending: false,
  }),
  useDecideRiskAcceptance: () => ({
    mutateAsync: mutations.decide,
    isPending: false,
  }),
  useOpenRiskAcceptanceReview: () => ({
    mutateAsync: mutations.review,
    isPending: false,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: vi.fn(), warning: vi.fn() }),
}));
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const id = "11111111-1111-4111-8111-111111111111";
it("shows submitted financial justification to the approver without auto-approving", () => {
  render(<DecideRiskAcceptanceDialog acceptanceId={id} onClose={vi.fn()} acceptanceCost={{ costToFix: "100000000", expectedLoss: "5000000", currency: "VND", periodMonths: 12, basis: "Synthetic submitted estimate for twelve months." }} />);
  expect(screen.getByText("100,000,000 VND")).toBeInTheDocument();
  expect(screen.getByText("5,000,000 VND")).toBeInTheDocument();
  expect(screen.getByText(/Comparison period: 12 months/)).toBeInTheDocument();
  expect(mutations.decide).not.toHaveBeenCalled();
});
const date = "2026-10-14T00:00:00Z";
const assessment = {
  id,
  type: "periodic_review",
  inherentLikelihood: 4,
  inherentImpact: 4,
  inherentRating: "high",
  residualLikelihood: 2,
  residualImpact: 3,
  residualRating: "medium",
  controlEffectiveness: 80,
  targetRisk: "low",
  riskAppetite: "medium",
  riskTolerance: "medium",
  reason: "Verified current controls.",
  assessedBy: null,
  assessedAt: date,
  reviewDate: null,
  methodologyVersion: "SECURAAI-RISK-MATRIX-v1",
};
const risk = riskRegisterDetailSchema.parse({
  id,
  riskCode: "RSK-DEMO",
  title: "Database recovery",
  description: null,
  status: "under_treatment",
  owner: null,
  createdBy: null,
  reviewDate: null,
  assets: [],
  latestAssessment: null,
  assessments: [assessment],
  controls: [],
  treatmentPlans: [
    {
      id,
      riskId: id,
      title: "Backup plan",
      strategy: "mitigate",
      status: "active",
      owner: null,
      targetCompletionDate: null,
      actionCount: 1,
      progress: 50,
      updatedAt: date,
      actions: [],
    },
  ],
  incidents: [],
  threats: [],
  vulnerabilities: [],
  acceptances: [],
  linkedCounts: { controls: 0, treatmentPlans: 1, incidents: 0 },
  activeTreatmentPlan: null,
  createdAt: date,
  updatedAt: date,
  acceptanceWorkflow: {
    canSubmit: true,
    canOpenReview: false,
    blockedReason: null,
  },
});

it("keeps expired request rejection available and disables approval", () => {
  render(
    <DecideRiskAcceptanceDialog acceptanceId={id} expired onClose={vi.fn()} />,
  );
  expect(screen.getByRole("option", { name: "Approve" })).toBeDisabled();
  expect(screen.getByLabelText("Decision")).toHaveValue("rejected");
  expect(screen.getByRole("button", { name: "Record decision" })).toBeEnabled();
});
it("uses the actual residual and warns on proposed threshold exceedance without blocking submission", () => {
  render(<SubmitRiskAcceptanceDialog risk={risk} onClose={vi.fn()} />);
  expect(screen.getByLabelText("Residual likelihood (1–5)")).toHaveValue(2);
  fireEvent.change(screen.getByLabelText("Residual likelihood (1–5)"), {
    target: { value: "5" },
  });
  fireEvent.change(screen.getByLabelText("Residual impact (1–5)"), {
    target: { value: "5" },
  });
  expect(
    screen.getByText(/proposed residual exceeds appetite or tolerance/),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Submit for approval" }),
  ).toBeEnabled();
});
it("shows server eligibility and disables unavailable acceptance", () => {
  render(
    <SubmitRiskAcceptanceDialog
      risk={{
        ...risk,
        acceptanceWorkflow: {
          canSubmit: false,
          canOpenReview: false,
          blockedReason: "Resolve pending acceptance first.",
        },
      }}
      onClose={vi.fn()}
    />,
  );
  expect(
    screen.getByText("Resolve pending acceptance first."),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Submit for approval" }),
  ).toBeDisabled();
});
it("requires a rationale and offers Cancel when opening review", () => {
  render(
    <OpenRiskReviewDialog
      risk={{
        ...risk,
        status: "accepted",
        acceptanceWorkflow: {
          canSubmit: false,
          canOpenReview: true,
          blockedReason: null,
        },
      }}
      onClose={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Open review" }));
  expect(mutations.review).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
});
