import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AssessInherentRiskDialog } from "./assess-inherent-risk-dialog";

const onClose = vi.fn();
const assessment = {
  id: "00000000-0000-4000-8000-000000000010",
  type: "initial",
  inherentLikelihood: 4,
  inherentImpact: 5,
  inherentRating: "critical" as const,
  residualLikelihood: null,
  residualImpact: null,
  residualRating: null,
  controlEffectiveness: null,
  targetRisk: null,
  riskAppetite: null,
  riskTolerance: null,
  reason: "Backups have not been verified through restoration testing.",
  assessedBy: {
    id: "00000000-0000-4000-8000-000000000011",
    fullName: "Security Officer",
    inactive: false,
  },
  assessedAt: "2026-10-12T10:00:00.000Z",
  reviewDate: null,
  methodologyVersion: "SECURAAI-RISK-MATRIX-v1",
};

vi.mock("../hooks/use-risk-register", () => ({
  useRiskRecord: () => ({
    data: {
      status: "open",
      assets: [{ name: "Customer database", criticality: "high" }],
      threats: [{ name: "Database failure" }],
      vulnerabilities: [{ name: "Untested backups" }],
      assessments: [assessment],
    },
    isError: false,
    isPending: false,
  }),
}));
vi.mock("../hooks/use-assess-inherent-risk", () => ({
  useAssessInherentRisk: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: vi.fn() }),
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

describe("Assess Inherent Risk history", () => {
  it("explains the scoring criteria and methodology", () => {
    render(
      <AssessInherentRiskDialog
        riskId="00000000-0000-4000-8000-000000000001"
        riskLabel="RSK-001"
        onClose={onClose}
      />,
    );

    expect(
      screen.getByText("Methodology: SECURAAI-RISK-MATRIX-v1"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "3 — Possible" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "3 — Moderate" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Score = Likelihood/)).toBeInTheDocument();
  });

  it("shows prior inherent assessments and closes from the history tab", () => {
    render(
      <AssessInherentRiskDialog
        riskId="00000000-0000-4000-8000-000000000001"
        riskLabel="RSK-001"
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "History (1)" }));
    expect(screen.getByText("4 × 5 = 20")).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getByText("Security Officer")).toBeInTheDocument();
    expect(screen.getByText(assessment.reason)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("warns and requires a detailed reason for a major rating reduction", async () => {
    render(
      <AssessInherentRiskDialog
        riskId="00000000-0000-4000-8000-000000000001"
        riskLabel="RSK-001"
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByLabelText("Likelihood (1–5)"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Potential impact (1–5)"), {
      target: { value: "2" },
    });
    expect(
      screen.getByText(/rating is changing from Critical to Low/i),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Assessment basis"), {
      target: { value: "Too short" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save assessment" }));
    expect(
      await screen.findByText(/at least 30 characters/i),
    ).toBeInTheDocument();
  });
});
