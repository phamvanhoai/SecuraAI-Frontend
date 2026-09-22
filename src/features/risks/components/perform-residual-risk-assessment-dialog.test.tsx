import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/api-error";
import type { RiskDetail } from "../schemas/risk-detail-schema";
import { PerformResidualRiskAssessmentDialog } from "./perform-residual-risk-assessment-dialog";

const mocks = vi.hoisted(() => ({ mutateAsync: vi.fn(), success: vi.fn() }));
vi.mock("../hooks/use-perform-residual-risk-assessment", () => ({
  usePerformResidualRiskAssessment: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
}));

const timestamp = "2026-09-22T08:00:00.000Z";
const risk = {
  assessment: {
    id: "11111111-1111-4111-8111-111111111111",
    riskCode: "RISK-001",
    title: "Credential compromise",
    description: null,
    status: "in_treatment",
    assessedAt: timestamp,
    closedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    assessedBy: null,
    cancellation: null,
  },
  target: {
    type: "asset",
    id: "22222222-2222-4222-8222-222222222222",
    code: "AST-001",
    name: "Identity service",
    status: "active",
    deleted: false,
  },
  inherentRisk: { likelihood: 4, impact: 4, score: 16, level: "high" },
  residualRisk: null,
  threats: [],
  vulnerabilities: [],
  treatmentPlans: [],
  previousAssessment: null,
} satisfies RiskDetail;

const props = { risk, onClose: vi.fn(), onReload: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.removeAttribute("open");
    },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
});

describe("residual risk assessment dialog", () => {
  it("calculates the score and submits with the concurrency version", async () => {
    mocks.mutateAsync.mockResolvedValue({
      residualRisk: { score: 6, level: "medium" },
    });
    render(<PerformResidualRiskAssessmentDialog {...props} />);

    fireEvent.change(screen.getByLabelText("Residual likelihood"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Residual impact"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText(/Assessment note/), {
      target: { value: "Controls were verified as effective." },
    });

    expect(screen.getByText("Reduction: 10 points.")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Save residual assessment" }),
    );
    await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
    expect(mocks.mutateAsync).toHaveBeenCalledWith({
      riskAssessmentId: risk.assessment.id,
      data: {
        residualLikelihood: 2,
        residualImpact: 3,
        assessmentNote: "Controls were verified as effective.",
        expectedUpdatedAt: timestamp,
      },
    });
  });

  it("prevents a residual score above the inherent score", () => {
    render(<PerformResidualRiskAssessmentDialog {...props} />);
    fireEvent.change(screen.getByLabelText("Residual likelihood"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Residual impact"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText(/Assessment note/), {
      target: { value: "Controls were verified as effective." },
    });

    expect(
      screen.getByText("This exceeds the inherent score of 16."),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Save residual assessment" }),
    ).toBeDisabled();
  });

  it("locks the form and offers reload after a conflict", async () => {
    mocks.mutateAsync.mockRejectedValue(
      new ApiError("Risk changed", 409, "CONFLICT", {
        error: { code: "RISK_ASSESSMENT_CHANGED" },
      }),
    );
    render(<PerformResidualRiskAssessmentDialog {...props} />);
    fireEvent.change(screen.getByLabelText(/Assessment note/), {
      target: { value: "Controls were verified as effective." },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Save residual assessment" }),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Reload risk details" }),
      ).toBeVisible(),
    );
    expect(screen.getByLabelText("Residual likelihood")).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Reload risk details" }),
    );
    expect(props.onReload).toHaveBeenCalledOnce();
  });
});
