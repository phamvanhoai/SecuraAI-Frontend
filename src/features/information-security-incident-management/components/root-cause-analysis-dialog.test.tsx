import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { RootCauseAnalysisDialog } from "./root-cause-analysis-dialog";
import { incidentSchema } from "../schemas/report-incident-schema";
const mocks = vi.hoisted(() => ({
  current: vi.fn(),
  history: vi.fn(),
  mutateAsync: vi.fn(),
  reset: vi.fn(),
  refetch: vi.fn(),
  success: vi.fn(),
}));
vi.mock("../hooks/use-incident-analysis", () => ({
  useIncidentAnalysis: mocks.current,
  useAnalysisHistory: mocks.history,
  useSaveIncidentAnalysis: () => ({
    mutateAsync: mocks.mutateAsync,
    reset: mocks.reset,
    isPending: false,
    isError: false,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
}));
const id = "00000000-0000-4000-8000-000000000010";
const values = {
  rootCause: "Verified authentication control gap.",
  lessonsLearned: "Review privileged access exceptions.",
  improvementActions: "Remove obsolete access and enforce MFA.",
};
const analysis = {
  ...values,
  id,
  analyzedAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  createdAt: "2026-01-01T00:00:00Z",
  analyzedBy: { id, name: "Officer" },
};
const incident = incidentSchema.parse({
  id,
  incidentCode: "INC-TEST",
  title: "Suspicious access",
  description: null,
  category: null,
  severity: "medium",
  status: "lessons_learned",
  occurredAt: null,
  detectedAt: null,
  confirmedAt: null,
  closedAt: null,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  classified: true,
  classificationCount: 0,
  lastClassification: null,
  currentAssignment: null,
  createdBy: null,
  relatedCounts: { actions: 0, assets: 0, controls: 0, evidence: 0, risks: 0 },
});
beforeEach(() => {
  cleanup();
  vi.clearAllMocks();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  mocks.current.mockReturnValue({
    data: { analysis: null, canEdit: true, editRestriction: null },
    isPending: false,
    isError: false,
    refetch: mocks.refetch,
  });
  mocks.history.mockReturnValue({
    data: {
      items: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    },
    isPending: false,
    isError: false,
    refetch: mocks.refetch,
  });
  mocks.mutateAsync.mockResolvedValue(analysis);
});
it("retains entered findings across keyboard tabs and shows saved history without F5", async () => {
  const user = userEvent.setup();
  render(<RootCauseAnalysisDialog incident={incident} onClose={vi.fn()} />);
  await user.click(screen.getByLabelText("Identified root cause"));
  await user.paste(values.rootCause);
  await user.click(screen.getByLabelText("Lessons learned"));
  await user.paste(values.lessonsLearned);
  await user.click(screen.getByLabelText("Recommended improvements"));
  await user.paste(values.improvementActions);
  await user.click(screen.getByRole("tab", { name: "History" }));
  expect(screen.getByText(/No analysis history/)).toBeVisible();
  await user.keyboard("{ArrowLeft}");
  expect(screen.getByLabelText("Identified root cause")).toHaveValue(
    values.rootCause,
  );
  mocks.mutateAsync.mockImplementation(async () => {
    mocks.history.mockReturnValue({
      data: {
        items: [
          {
            id,
            findings: values,
            savedBy: { id, name: "Officer" },
            savedAt: analysis.analyzedAt,
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
      isPending: false,
      isError: false,
    });
    return analysis;
  });
  await user.click(screen.getByRole("button", { name: "Save findings" }));
  await waitFor(() =>
    expect(mocks.mutateAsync).toHaveBeenCalledWith({
      id,
      values,
      expectedUpdatedAt: null,
    }),
  );
  await waitFor(() =>
    expect(screen.getByRole("tab", { name: "History" })).toHaveAttribute(
      "aria-selected",
      "true",
    ),
  );
  expect(
    within(screen.getByRole("tabpanel")).getByText(values.rootCause),
  ).toBeVisible();
});
it("hydrates saved findings and uses the saved concurrency token", async () => {
  mocks.current.mockReturnValue({
    data: { analysis, canEdit: true, editRestriction: null },
    isPending: false,
    isError: false,
  });
  const user = userEvent.setup();
  render(
    <RootCauseAnalysisDialog
      incident={{ ...incident, status: "closed" }}
      onClose={vi.fn()}
    />,
  );
  expect(screen.getByLabelText("Identified root cause")).toHaveValue(
    values.rootCause,
  );
  await user.click(screen.getByRole("button", { name: "Save findings" }));
  await waitFor(() =>
    expect(mocks.mutateAsync).toHaveBeenCalledWith({
      id,
      values,
      expectedUpdatedAt: analysis.updatedAt,
    }),
  );
});
it("keeps ineligible incidents read-only with actionable history errors", async () => {
  mocks.current.mockReturnValue({
    data: {
      analysis: null,
      canEdit: false,
      editRestriction: "Incident not ready",
    },
    isPending: false,
    isError: false,
  });
  mocks.history.mockReturnValue({
    isPending: false,
    isError: true,
    refetch: mocks.refetch,
  });
  const user = userEvent.setup();
  render(
    <RootCauseAnalysisDialog
      incident={{ ...incident, status: "open" }}
      onClose={vi.fn()}
    />,
  );
  expect(
    screen.queryByRole("button", { name: "Save findings" }),
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText("Identified root cause")).toHaveAttribute(
    "readonly",
  );
  await user.click(screen.getByRole("tab", { name: "History" }));
  await user.click(screen.getByRole("button", { name: "Try again" }));
  expect(mocks.refetch).toHaveBeenCalled();
});
it("does not discard unsaved findings when dismissal is cancelled", async () => {
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
  const close = vi.fn();
  const user = userEvent.setup();
  render(<RootCauseAnalysisDialog incident={incident} onClose={close} />);
  await user.type(
    screen.getByLabelText("Identified root cause"),
    "Unfinished investigation notes",
  );
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(close).not.toHaveBeenCalled();
  expect(confirm).toHaveBeenCalled();
  confirm.mockRestore();
});
