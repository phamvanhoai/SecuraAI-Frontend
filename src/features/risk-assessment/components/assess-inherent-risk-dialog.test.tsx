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
};

vi.mock("../hooks/use-risk-register", () => ({
  useRiskRecord: () => ({
    data: {
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
});
