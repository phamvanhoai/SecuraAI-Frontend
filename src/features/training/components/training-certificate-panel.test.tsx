import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TrainingCertificatePanel } from "./training-certificate-panel";
const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  mutation: vi.fn(),
  session: vi.fn(),
  success: vi.fn(),
  issue: vi.fn(),
}));
vi.mock("../hooks/use-certificate", () => ({
  useTrainingCertificate: mocks.query,
  useIssueTrainingCertificate: mocks.mutation,
}));
vi.mock("@/features/auth", () => ({ useSessionUser: mocks.session }));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
}));
const data = {
  enrollmentId: "enrollment-1",
  learnerName: "Employee",
  courseTitle: "Course",
  campaignTitle: "Campaign",
  completedAt: "2026-09-17T00:00:00.000Z",
  eligible: true,
  requirements: {
    courseCompleted: true,
    progressComplete: true,
    finalAssessmentRequired: true,
    finalAssessmentPassed: true,
  },
  certificate: null,
};
describe("training certificate panel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.mockReturnValue({ data, isPending: false, isError: false });
    mocks.mutation.mockReturnValue({
      mutateAsync: mocks.issue,
      isPending: false,
      isError: false,
    });
    mocks.session.mockReturnValue({
      data: { permissions: ["training-certificates.issue"] },
    });
  });
  afterEach(cleanup);
  it("issues for the selected enrollment and confirms persistence", async () => {
    render(
      <TrainingCertificatePanel
        enrollmentId="enrollment-1"
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Issue certificate" }));
    expect(
      screen.getByRole("alertdialog", {
        name: "Confirm certificate issuance",
      }),
    ).toBeInTheDocument();
    expect(mocks.issue).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm issuance" }));
    await waitFor(() =>
      expect(mocks.issue).toHaveBeenCalledWith("enrollment-1"),
    );
    await waitFor(() => expect(mocks.success).toHaveBeenCalled());
  });
  it("hides issuance from readers without the issue permission", () => {
    mocks.session.mockReturnValue({
      data: { permissions: ["training-completion.read"] },
    });
    render(
      <TrainingCertificatePanel
        enrollmentId="enrollment-1"
        onClose={() => {}}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Issue certificate" }),
    ).not.toBeInTheDocument();
  });
  it("disables issuance for ineligible enrollments", () => {
    mocks.query.mockReturnValue({
      data: {
        ...data,
        eligible: false,
        requirements: { ...data.requirements, finalAssessmentPassed: false },
      },
    });
    render(
      <TrainingCertificatePanel
        enrollmentId="enrollment-1"
        onClose={() => {}}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Issue certificate" }),
    ).toBeDisabled();
  });
  it("shows saved certificate and does not offer reissue", () => {
    mocks.query.mockReturnValue({
      data: {
        ...data,
        certificate: {
          number: "CERT-1",
          issuedAt: data.completedAt,
          issuedBy: "Officer",
        },
      },
    });
    render(
      <TrainingCertificatePanel
        enrollmentId="enrollment-1"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("CERT-1")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Issue certificate" }),
    ).not.toBeInTheDocument();
  });
  it("prevents double submission while pending", () => {
    mocks.mutation.mockReturnValue({ isPending: true });
    render(
      <TrainingCertificatePanel
        enrollmentId="enrollment-1"
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "Issuing…" })).toBeDisabled();
  });
  it("explains when no final assessment is required", () => {
    mocks.query.mockReturnValue({
      data: {
        ...data,
        requirements: {
          ...data.requirements,
          finalAssessmentRequired: false,
          finalAssessmentPassed: null,
        },
      },
    });
    render(
      <TrainingCertificatePanel
        enrollmentId="enrollment-1"
        onClose={() => {}}
      />,
    );
    expect(
      screen.getByText("Final assessment not required"),
    ).toBeInTheDocument();
  });
});
