import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import type { RiskReassessmentReviewItem } from "../schemas/risk-reassessment-review-schema";
import { RiskReassessmentRequestDetailDialog } from "./risk-reassessment-request-detail-dialog";

const request: RiskReassessmentReviewItem = {
  id: "00000000-0000-4000-8000-000000000163",
  reason: "Repeated privileged authentication failures require reassessment.",
  status: "pending",
  requestedAt: "2026-10-02T02:00:00.000Z",
  reviewedAt: null,
  reviewComment: null,
  canReject: true,
  risk: {
    id: "00000000-0000-4000-8000-000000000161",
    riskCode: "DEMO-RSK-REVIEW-001",
    title: "Privileged access risk requiring owner review",
    status: "under_treatment",
    latestInherentAssessment: { likelihood: 4, impact: 5, rating: "critical" },
    treatmentPlans: [],
  },
  incident: {
    id: "00000000-0000-4000-8000-000000000162",
    incidentCode: "DEMO-INC-REASSESS-001",
    title: "Repeated privileged login failures",
    severity: "high",
  },
  controlWeakness: null,
  requestedBy: {
    id: "00000000-0000-4000-8000-000000000002",
    fullName: "Security Officer",
  },
  reviewedBy: null,
};

beforeAll(() => {
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
      this.dispatchEvent(new Event("close"));
    },
  });
});

afterEach(cleanup);

describe("RiskReassessmentRequestDetailDialog", () => {
  it("shows the complete request context and closes", async () => {
    const onClose = vi.fn();
    render(
      <RiskReassessmentRequestDetailDialog
        request={request}
        onClose={onClose}
      />,
    );

    expect(screen.getByText(request.reason)).toBeInTheDocument();
    expect(screen.getAllByText(/DEMO-RSK-REVIEW-001/)).not.toHaveLength(0);
    expect(screen.getAllByText(/DEMO-INC-REASSESS-001/)).not.toHaveLength(0);
    expect(screen.getByText("Critical")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
