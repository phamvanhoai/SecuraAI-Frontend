import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TrainingWorkspace } from "./training-workspace";
const mocks = vi.hoisted(() => ({ session: vi.fn() }));
vi.mock("@/features/authentication-account", () => ({ useSessionUser: mocks.session }));
vi.mock("./training-courses-manager", () => ({
  TrainingCoursesManager: ({
    onAssessments,
    headerActions,
  }: {
    onAssessments?: () => void;
    headerActions?: import("react").ReactNode;
  }) => (
    <>
      <h1>Courses content</h1>
      {headerActions}
      {onAssessments ? (
        <button onClick={onAssessments}>My assessments</button>
      ) : null}
    </>
  ),
}));
vi.mock("./training-completion-manager", () => ({
  TrainingCompletionManager: ({
    headerActions,
  }: {
    headerActions?: import("react").ReactNode;
  }) => (
    <>
      <h1>Progress content</h1>
      {headerActions}
    </>
  ),
}));
vi.mock("./my-assessments-manager", () => ({
  MyAssessmentsManager: ({ onBack }: { onBack?: () => void }) => (
    <>
      <h1>Assessment content</h1>
      {onBack ? <button onClick={onBack}>Back to training</button> : null}
    </>
  ),
}));
vi.mock("./my-learning-manager", () => ({
  MyLearningManager: () => <h1>Assigned training content</h1>,
}));
vi.mock("./my-certificates-manager", () => ({
  MyCertificatesManager: () => <h1>My certificates content</h1>,
}));
vi.mock("./issued-certificates-manager", () => ({
  IssuedCertificatesManager: ({
    sectionNavigation,
  }: {
    sectionNavigation?: import("react").ReactNode;
  }) => (
    <>
      <h1>Issued certificates content</h1>
      {sectionNavigation}
    </>
  ),
}));
vi.mock("./department-report-manager", () => ({
  DepartmentReportManager: ({
    sectionNavigation,
  }: {
    sectionNavigation?: import("react").ReactNode;
  }) => (
    <>
      <h1>Department report content</h1>
      {sectionNavigation}
    </>
  ),
}));
describe("TrainingWorkspace entry flow", () => {
  it("switches Executive readers to the department report without route navigation", () => {
    mocks.session.mockReturnValue({
      data: {
        permissions: [
          "training-completion.read",
          "training-department-reports.read",
        ],
      },
    });
    render(<TrainingWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "Department report" }));
    expect(screen.getByText("Department report content")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Department report" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
  beforeEach(() =>
    mocks.session.mockReturnValue({
      data: {
        permissions: ["training-courses.read", "training-completion.read"],
      },
    }),
  );
  afterEach(cleanup);
  it("starts with one course list and keeps its primary section tab visible", () => {
    render(<TrainingWorkspace />);
    expect(screen.getByText("Courses content")).toBeVisible();
    expect(screen.queryByText("Progress content")).not.toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Training sections" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Courses" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.queryByRole("button", { name: "Department report" }),
    ).not.toBeInTheDocument();
  });
  it("gives completion-only readers direct progress access without course management", () => {
    mocks.session.mockReturnValue({
      data: { permissions: ["training-completion.read"] },
    });
    render(<TrainingWorkspace />);
    expect(screen.getByText("Progress content")).toBeVisible();
    expect(screen.queryByText("Courses content")).not.toBeInTheDocument();
  });
  it("takes employees to their assigned training", () => {
    mocks.session.mockReturnValue({
      data: { permissions: ["training-assessments.take"] },
    });
    render(<TrainingWorkspace />);
    expect(screen.getByText("Assigned training content")).toBeVisible();
  });
  it("takes certificate-only users to their certificates", () => {
    mocks.session.mockReturnValue({
      data: { permissions: ["training-certificates.read-own"] },
    });
    render(<TrainingWorkspace />);
    expect(screen.getByText("My certificates content")).toBeVisible();
  });
  it("lets Security Officers open issued certificates from training", () => {
    mocks.session.mockReturnValue({
      data: {
        permissions: [
          "training-courses.read",
          "training-certificates.read-issued",
        ],
      },
    });
    render(<TrainingWorkspace />);
    fireEvent.click(
      screen.getByRole("button", { name: "Issued certificates" }),
    );
    expect(screen.getByText("Issued certificates content")).toBeVisible();
  });
  it("preserves assessment access for users who also manage courses", () => {
    mocks.session.mockReturnValue({
      data: {
        permissions: ["training-courses.read", "training-assessments.take"],
      },
    });
    render(<TrainingWorkspace />);
    fireEvent.click(screen.getByRole("button", { name: "My assessments" }));
    expect(screen.getByText("Assessment content")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Back to training" }));
    expect(screen.getByText("Courses content")).toBeVisible();
  });
});
