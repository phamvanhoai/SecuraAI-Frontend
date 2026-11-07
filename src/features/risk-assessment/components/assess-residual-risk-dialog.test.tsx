import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AssessResidualRiskDialog } from "./assess-residual-risk-dialog";

const state = vi.hoisted(() => ({
  status: "accepted",
  ready: false,
  mutateAsync: vi.fn().mockResolvedValue({ riskCode: "RSK-001", score: 12, rating: "high", withinTolerance: false }),
  isError: false,
  isPending: false,
  refetch: vi.fn(),
}));
const record = {
  id: "assessment",
  type: "periodic_review",
  residualLikelihood: 2,
  residualImpact: 3,
  residualRating: "medium",
  controlEffectiveness: 80,
  targetRisk: "low",
  riskAppetite: "medium",
  riskTolerance: "medium",
  assessedBy: { fullName: "Risk Owner" },
  reason: "Verified restoration after treatment.",
  methodologyVersion: "SECURAAI-RISK-MATRIX-v1",
  assessedAt: "2026-10-14T03:00:00Z",
};
vi.mock("../hooks/use-risk-register", () => ({
  useRiskRecord: () => ({
    data: {
      status: state.status,
      acceptances: [],
      controls: state.ready ? [{ id: "control", name: "MFA", latestEffectiveness: 80 }] : [],
      latestAssessment: state.ready ? { inherentRating: "critical" } : null,
      assessments: Array.from({ length: 6 }, (_, index) => ({
        ...record,
        id: `assessment-${index}`,
        reason: `Assessment basis ${index + 1}`,
      })),
    },
    isError: state.isError,
    isPending: state.isPending,
    refetch: state.refetch,
  }),
}));
vi.mock("../hooks/use-assess-residual-risk", () => ({
  useAssessResidualRisk: () => ({ isPending: false, mutateAsync: state.mutateAsync }),
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
  state.isError = false;
  state.status = "accepted";
  state.ready = false;
  vi.clearAllMocks();
});
describe("residual assessment history", () => {
  it("submits numeric scores after changing radio choices", async () => {
    state.status = "open"; state.ready = true;
    render(<AssessResidualRiskDialog riskId="risk" riskLabel="RSK-001" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("radio", { name: /^4Likely/ }));
    fireEvent.click(screen.getByRole("radio", { name: /^3Moderate/ }));
    fireEvent.change(screen.getByLabelText(/Assessment basis/), { target: { value: "Verified the remaining likelihood and impact after control testing." } });
    fireEvent.click(screen.getByRole("button", { name: "Save residual assessment" }));
    await waitFor(() => expect(state.mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ likelihood: 4, impact: 3 })));
  });
  it("allows an accepted Risk to view paginated history and close", () => {
    const close = vi.fn();
    render(
      <AssessResidualRiskDialog
        riskId="risk"
        riskLabel="RSK-001"
        onClose={close}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Save residual assessment" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("tab", { name: "History (6)" }));
    expect(screen.getAllByText("80%")).toHaveLength(5);
    expect(screen.queryByText("Assessment basis 6")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("Assessment basis 6")).toBeInTheDocument();
    expect(screen.getAllByText("80%")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(close).toHaveBeenCalledOnce();
  });
  it("supports keyboard switching to history", () => {
    render(
      <AssessResidualRiskDialog
        riskId="risk"
        riskLabel="RSK-001"
        onClose={vi.fn()}
      />,
    );
    fireEvent.keyDown(
      screen.getByRole("tab", { name: "Assess residual risk" }),
      { key: "ArrowRight" },
    );
    expect(screen.getByRole("tab", { name: "History (6)" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
  it("shows retry instead of treating a load error as empty history", () => {
    state.isError = true;
    render(
      <AssessResidualRiskDialog
        riskId="risk"
        riskLabel="RSK-001"
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "History (6)" }));
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(state.refetch).toHaveBeenCalledOnce();
  });
});
