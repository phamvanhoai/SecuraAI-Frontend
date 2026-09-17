import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TrainingWorkspace } from "./training-workspace";
const mocks = vi.hoisted(() => ({ session: vi.fn() }));
vi.mock("@/features/auth", () => ({ useSessionUser: mocks.session }));
vi.mock("./training-courses-manager", () => ({
  TrainingCoursesManager: ({
    onAssessments,
  }: {
    onAssessments?: () => void;
  }) => (
    <>
      <h1>Courses content</h1>
      {onAssessments ? (
        <button onClick={onAssessments}>My assessments</button>
      ) : null}
    </>
  ),
}));
vi.mock("./training-completion-manager", () => ({
  TrainingCompletionManager: () => <h1>Progress content</h1>,
}));
vi.mock("./my-assessments-manager", () => ({
  MyAssessmentsManager: ({ onBack }: { onBack?: () => void }) => (
    <>
      <h1>Assessment content</h1>
      {onBack ? <button onClick={onBack}>Back to training</button> : null}
    </>
  ),
}));
describe("TrainingWorkspace entry flow", () => {
  beforeEach(() =>
    mocks.session.mockReturnValue({
      data: {
        permissions: ["training-courses.read", "training-completion.read"],
      },
    }),
  );
  afterEach(cleanup);
  it("starts with one course list, without duplicate navigation or campaign lists", () => {
    render(<TrainingWorkspace />);
    expect(screen.getByText("Courses content")).toBeVisible();
    expect(screen.queryByText("Progress content")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Training sections" }),
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
  it("keeps employees on their assigned assessments", () => {
    mocks.session.mockReturnValue({
      data: { permissions: ["training-assessments.take"] },
    });
    render(<TrainingWorkspace />);
    expect(screen.getByText("Assessment content")).toBeVisible();
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
