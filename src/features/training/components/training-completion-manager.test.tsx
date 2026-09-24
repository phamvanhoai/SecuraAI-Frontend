import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TrainingCompletionManager } from "./training-completion-manager";

const mocks = vi.hoisted(() => ({
  campaigns: vi.fn(),
  detail: vi.fn(),
  session: vi.fn(),
}));

vi.mock("../hooks/use-completion", () => ({
  useCompletionCampaigns: mocks.campaigns,
  useCompletionCampaign: mocks.detail,
  useWithdrawEnrollment: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));
vi.mock("../hooks/use-certificate", () => ({
  useCertificateIssuancePending: () => false,
}));
vi.mock("./training-certificate-panel", () => ({
  TrainingCertificatePanel: () => null,
}));
vi.mock("@/features/authentication-account", () => ({ useSessionUser: mocks.session }));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: vi.fn() }),
}));

describe("training completion tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      },
    });
    mocks.session.mockReturnValue({
      data: { permissions: ["training-completion.read"] },
    });
    mocks.campaigns.mockReturnValue({
      data: {
        items: [
          {
            id: "campaign-1",
            title: "September awareness",
            courseTitle: "Recognize phishing",
            startDate: "2026-09-01T00:00:00.000Z",
            dueDate: "2026-09-30T00:00:00.000Z",
            status: "active",
            assigned: 1,
            completed: 0,
            inProgress: 1,
            notStarted: 0,
            overdue: 0,
            completionRate: 0,
            averageProgress: 50,
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
      isPending: false,
      isError: false,
    });
    mocks.detail.mockReturnValue({
      data: {
        campaign: {
          id: "campaign-1",
          title: "September awareness",
          courseTitle: "Recognize phishing",
          startDate: "2026-09-01T00:00:00.000Z",
          dueDate: "2026-09-30T00:00:00.000Z",
          requiredLessonCount: 2,
          hasFinalAssessment: true,
        },
        summary: {
          assigned: 1,
          completed: 0,
          inProgress: 1,
          notStarted: 0,
          overdue: 0,
          withdrawn: 0,
          completionRate: 0,
          averageProgress: 50,
        },
        items: [
          {
            id: "enrollment-1",
            user: {
              id: "user-1",
              name: "Alex Morgan",
              email: "alex@example.com",
              employeeCode: "EMP-001",
            },
            status: "in_progress",
            progressPercent: 50,
            requiredLessons: { completed: 1, total: 2 },
            finalAssessment: {
              required: true,
              passed: false,
              latestScore: 60,
              lastSubmittedAt: "2026-09-15T00:00:00.000Z",
            },
            startedAt: "2026-09-10T00:00:00.000Z",
            completedAt: null,
            lastAccessedAt: "2026-09-15T00:00:00.000Z",
            certificateNumber: null,
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
      isPending: false,
      isError: false,
    });
  });

  afterEach(cleanup);

  it("shows detailed learning progress and applies the status filter on submit", async () => {
    render(<TrainingCompletionManager />);
    fireEvent.click(screen.getByRole("button", { name: "View employees" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("1/2")).toBeVisible();
    expect(within(dialog).getByText("Not passed")).toBeVisible();
    expect(within(dialog).getByText("Latest: 60%")).toBeVisible();

    fireEvent.change(
      within(dialog).getByLabelText("Filter completion status"),
      {
        target: { value: "completed" },
      },
    );
    expect(mocks.detail).toHaveBeenLastCalledWith("campaign-1", 1, "", "all");

    fireEvent.click(within(dialog).getByRole("button", { name: "Search" }));
    await waitFor(() =>
      expect(mocks.detail).toHaveBeenLastCalledWith(
        "campaign-1",
        1,
        "",
        "completed",
      ),
    );
  });
});
