import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DefineTargetRiskDialog } from "./define-target-risk-dialog";
const state = vi.hoisted(() => ({
  status: "open",
  toast: vi.fn(),
  mutate: vi.fn(),
}));
vi.mock("../hooks/use-risk-register", () => ({
  useRiskRecord: () => ({
    data: {
      status: state.status,
      acceptances: [],
      latestAssessment: { residualRating: null },
      assessments: [
        {
          id: "residual",
          type: "periodic_review",
          residualRating: "high",
          riskAppetite: "low",
          riskTolerance: null,
          assessedAt: "2026-10-14T09:00:00Z",
        },
      ],
      treatmentPlans: [
        {
          id: "00000000-0000-4000-8000-000000000001",
          title: "Improve backup",
          status: "active",
          strategy: "mitigate",
        },
      ],
    },
    isError: false,
  }),
}));
vi.mock("../hooks/use-define-target-risk", () => ({
  useDefineTargetRisk: () => ({ isPending: false, mutateAsync: state.mutate }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: state.toast }),
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
  state.status = "open";
  vi.clearAllMocks();
});
describe("define target risk", () => {
  it("uses residual history even when latest assessment has no residual", () => {
    render(
      <DefineTargetRiskDialog
        riskId="risk"
        riskLabel="RSK"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Define target" })).toBeEnabled();
  });
  it("locks saving for accepted Risk", () => {
    state.status = "accepted";
    render(
      <DefineTargetRiskDialog
        riskId="risk"
        riskLabel="RSK"
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Define target" }),
    ).toBeDisabled();
  });
  it("warns outside appetite and reports missing tolerance honestly", async () => {
    state.mutate.mockResolvedValue({
      riskCode: "RSK",
      targetRisk: "medium",
      withinTolerance: null,
    });
    render(
      <DefineTargetRiskDialog
        riskId="risk"
        riskLabel="RSK"
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: /Medium/i }));
    expect(screen.getByText(/proposed target is outside/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Target rationale/), {
      target: {
        value:
          "The planned actions aim for medium as an achievable first step.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Define target" }));
    await waitFor(() =>
      expect(state.toast).toHaveBeenCalledWith(
        "Target risk defined",
        "RSK: medium; tolerance not recorded.",
      ),
    );
  });
});
