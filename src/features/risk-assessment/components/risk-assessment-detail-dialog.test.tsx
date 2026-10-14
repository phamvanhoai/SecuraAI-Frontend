import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { RiskRegisterDetail } from "../schemas/risk-register-schema";
import { RiskAssessmentDetailDialog } from "./risk-assessment-detail-dialog";

const state = vi.hoisted(() => ({
  risk: undefined as RiskRegisterDetail | undefined,
  user: { id: "officer", roles: [{ code: "SECURITY_OFFICER" }] },
  refetch: vi.fn(),
  editVulnerability: vi.fn(),
  editThreat: vi.fn(),
}));
vi.mock("../hooks/use-risk-register", () => ({
  useRiskRecord: () => ({
    data: state.risk,
    isPending: false,
    isError: false,
    refetch: state.refetch,
  }),
}));
vi.mock("@/features/authentication-account", () => ({
  useSessionUser: () => ({ data: state.user }),
}));
vi.mock("./update-risk-treatment-plan-dialog", () => ({
  UpdateRiskTreatmentPlanDialog: () => null,
}));
vi.mock("./risk-acceptance-dialogs", () => ({
  SubmitRiskAcceptanceDialog: () => null,
  DecideRiskAcceptanceDialog: () => null,
}));
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
});
afterEach(cleanup);
beforeEach(() => {
  state.user = { id: "officer", roles: [{ code: "SECURITY_OFFICER" }] };
  state.risk = {
    id: "risk",
    riskCode: "RSK-001",
    title: "Database exposure",
    description: "Customer database",
    status: "open",
    owner: { id: "owner", fullName: "Risk Owner", inactive: false },
    createdBy: { id: "officer", fullName: "Security Officer", inactive: false },
    reviewDate: "2027-01-31T00:00:00Z",
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-02T00:00:00Z",
    latestAssessment: null,
    assessments: [],
    assets: [],
    controls: [],
    threats: [],
    vulnerabilities: [],
    incidents: [],
    acceptances: [],
    linkedCounts: { controls: 0, treatmentPlans: 1, incidents: 0 },
    activeTreatmentPlan: null,
    treatmentPlans: [
      {
        id: "plan",
        riskId: "risk",
        title: "Secure access",
        strategy: "mitigate",
        status: "active",
        owner: { id: "owner", fullName: "Risk Owner", inactive: false },
        targetCompletionDate: "2026-10-11T00:00:00Z",
        actionCount: 1,
        progress: 50,
        updatedAt: "2026-10-02T00:00:00Z",
        controls: [],
        actions: [
          {
            id: "action",
            title: "Enforce MFA",
            assignedToUserId: "owner",
            dueDate: "2026-10-08T00:00:00Z",
            status: "in_progress",
          },
        ],
      },
    ],
    contextHistory: [],
  };
});
const open = () =>
  render(
    <RiskAssessmentDetailDialog
      id="risk"
      onClose={vi.fn()}
      onEditVulnerability={state.editVulnerability}
      onEditThreat={state.editThreat}
    />,
  );
describe("Risk detail workflow", () => {
  it("warns when historical ratings no longer cover the vulnerability context", () => {
    if (state.risk)
      state.risk.vulnerabilityWorkflow = {
        canIdentify: true,
        blockedReason: null,
        assessmentReviewRequired: true,
      };
    state.user = { id: "owner", roles: [{ code: "EMPLOYEE" }] };
    open();
    expect(
      screen.getByText(/Existing ratings are historical/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Review and submit acceptance" }),
    ).toBeDisabled();
  });
  it("shows the saved service scope and explains stable asset membership", () => {
    if (state.risk)
      state.risk.scope = {
        type: "business_service",
        businessService: {
          id: "service",
          name: "Customer service",
          status: "active",
        },
      };
    open();
    expect(
      screen.getByText("Business service — Customer service (Active)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/not the service's current asset list/),
    ).toBeInTheDocument();
  });
  it("shows numeric dates, record metadata, action details and acceptance empty state", () => {
    open();
    expect(screen.getByText("31/01/2027")).toBeInTheDocument();
    expect(screen.getByText("Created by")).toBeInTheDocument();
    expect(screen.getByText("Enforce MFA")).toBeInTheDocument();
    expect(
      screen.getByText("No risk acceptance requests recorded."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Update Secure access" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Update treatment plans"),
    ).not.toBeInTheDocument();
  });
  it.each(["completed", "cancelled"])("keeps %s plans read-only", (status) => {
    state.risk?.treatmentPlans.forEach((plan) => {
      plan.status = status;
    });
    open();
    expect(
      screen.queryByRole("button", { name: /Update Secure/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Read-only")).toBeInTheDocument();
  });
  it("does not offer updates to an Executive", () => {
    state.user = { id: "executive", roles: [{ code: "EXECUTIVE" }] };
    open();
    expect(
      screen.queryByRole("button", { name: /Update Secure/ }),
    ).not.toBeInTheDocument();
  });
  it("lets the assigned owner update an active plan", () => {
    state.user = { id: "owner", roles: [{ code: "EMPLOYEE" }] };
    open();
    expect(
      screen.getByRole("button", { name: "Update Secure access" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /submit acceptance/ }),
    ).toBeDisabled();
    expect(
      screen.getByText("Assess residual risk before submitting acceptance."),
    ).toBeInTheDocument();
  });
  it("does not offer self-approval", () => {
    state.risk?.acceptances.push({
      id: "acceptance",
      decision: "pending",
      reason: "Temporary acceptance",
      requestedAt: "2026-10-02T00:00:00Z",
      validUntil: "2026-11-01T00:00:00Z",
      requestedBy: "officer",
      decidedBy: null,
      decidedAt: null,
    });
    open();
    expect(
      screen.queryByRole("button", { name: "Review decision" }),
    ).not.toBeInTheDocument();
  });
  it("offers review to a different eligible approver", () => {
    state.risk?.acceptances.push({
      id: "acceptance",
      decision: "pending",
      reason: "Temporary acceptance",
      requestedAt: "2026-10-02T00:00:00Z",
      validUntil: "2026-11-01T00:00:00Z",
      requestedBy: "owner",
      decidedBy: null,
      decidedAt: null,
    });
    open();
    expect(
      screen.getByRole("button", { name: "Review decision" }),
    ).toBeInTheDocument();
  });
  it("explains inconsistent source data without changing its status", () => {
    if (state.risk) state.risk.status = "under_treatment";
    open();
    expect(
      screen.getByText(/no status has been changed automatically/),
    ).toBeInTheDocument();
    expect(state.risk?.status).toBe("under_treatment");
  });
  it("offers inline edit for a vulnerability when the workflow allows changes", async () => {
    if (state.risk) {
      state.risk.vulnerabilityWorkflow = {
        canIdentify: true,
        blockedReason: null,
        assessmentReviewRequired: false,
      };
      state.risk.vulnerabilities = [{
        id: "00000000-0000-4000-8000-000000000001",
        name: "Missing MFA",
        description: "Administrator accounts do not require MFA.",
        createdAt: "2026-10-01T00:00:00.000Z",
        updatedAt: "2026-10-01T00:00:00.000Z",
        controls: [],
      }];
    }
    open();
    fireEvent.click(screen.getByRole("button", { name: "Actions for Missing MFA" }));
    const editAction = await screen.findByRole("menuitem", {
      name: "Edit vulnerability",
    });
    expect(editAction.closest("dialog")).not.toBeNull();
    fireEvent.click(editAction);
    expect(state.editVulnerability).toHaveBeenCalledWith(
      expect.objectContaining({ id: "risk", riskCode: "RSK-001" }),
      expect.objectContaining({ name: "Missing MFA" }),
    );
  });
  it("keeps only one vulnerability actions menu open", () => {
    if (state.risk) {
      state.risk.vulnerabilityWorkflow = {
        canIdentify: true,
        blockedReason: null,
        assessmentReviewRequired: false,
      };
      state.risk.vulnerabilities = [
        {
          id: "00000000-0000-4000-8000-000000000001",
          name: "Missing MFA",
          description: "Administrator accounts do not require MFA.",
          createdAt: "2026-10-01T00:00:00.000Z",
          updatedAt: "2026-10-01T00:00:00.000Z",
          controls: [],
        },
        {
          id: "00000000-0000-4000-8000-000000000002",
          name: "Missing recovery procedure",
          description: "The recovery procedure is not documented.",
          createdAt: "2026-10-01T00:00:00.000Z",
          updatedAt: "2026-10-01T00:00:00.000Z",
          controls: [],
        },
      ];
    }
    open();
    const firstTrigger = screen.getByRole("button", {
      name: "Actions for Missing MFA",
    });
    const secondTrigger = screen.getByRole("button", {
      name: "Actions for Missing recovery procedure",
    });

    fireEvent.click(firstTrigger);
    expect(firstTrigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("menu")).toHaveLength(1);

    fireEvent.click(secondTrigger);
    expect(firstTrigger).toHaveAttribute("aria-expanded", "false");
    expect(secondTrigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("menu")).toHaveLength(1);
  });
  it("offers inline edit for a threat and closes another context menu", () => {
    if (state.risk) {
      state.risk.vulnerabilityWorkflow = {
        canIdentify: true,
        blockedReason: null,
        assessmentReviewRequired: false,
      };
      state.risk.threats = [{
        id: "00000000-0000-4000-8000-000000000010",
        name: "Credential theft",
        description: "Phishing captures privileged credentials.",
        vulnerabilities: [{ id: "00000000-0000-4000-8000-000000000001", name: "Missing MFA" }],
        createdAt: "2026-10-01T00:00:00.000Z",
        updatedAt: "2026-10-01T00:00:00.000Z",
      }];
    }
    open();
    fireEvent.click(screen.getByRole("button", { name: "Actions for threat Credential theft" }));
    const action = screen.getByRole("menuitem", { name: "Edit threat" });
    fireEvent.click(action);
    expect(state.editThreat).toHaveBeenCalledWith(
      expect.objectContaining({ id: "risk", riskCode: "RSK-001" }),
      expect.objectContaining({ name: "Credential theft" }),
    );
  });
});
