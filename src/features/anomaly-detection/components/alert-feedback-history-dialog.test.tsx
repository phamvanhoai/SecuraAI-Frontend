import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AlertFeedbackHistoryDialog } from "./alert-feedback-history-dialog";

const useFeedbackMock = vi.hoisted(() => vi.fn());
vi.mock("../hooks/use-ai-alerts", () => ({
  useAiAlertFeedback: useFeedbackMock,
}));

const alert = {
  id: "11111111-1111-4111-8111-111111111111",
  alertCode: "AI-2026-001",
  anomalyScore: 0.92,
  title: "Unusual authentication activity",
  description: "Multiple failed sign-ins were detected.",
  status: "new" as const,
  detectedAt: "2026-09-11T03:00:00.000Z",
  asset: null,
  logSource: {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Windows Authentication",
    sourceType: "authentication",
  },
  model: {
    id: "33333333-3333-4333-8333-333333333333",
    name: "anomaly-detector",
    version: "1.0.0",
    provider: "ollama",
  },
  event: {
    id: "44444444-4444-4444-8444-444444444444",
    eventType: "authentication.failed",
    eventTime: "2026-09-11T02:59:00.000Z",
  },
  createdAt: "2026-09-11T03:00:01.000Z",
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

describe("AlertFeedbackHistoryDialog", () => {
  it("shows backend feedback records", () => {
    useFeedbackMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        items: [
          {
            id: "55555555-5555-4555-8555-555555555555",
            alertId: alert.id,
            reviewedByUserId: "66666666-6666-4666-8666-666666666666",
            feedbackLabel: "needs_review",
            comment: "Verify the source manually",
            createdAt: "2026-09-13T03:00:00.000Z",
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
      refetch: vi.fn(),
    });

    render(<AlertFeedbackHistoryDialog alert={alert} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(screen.getByText("Needs further review")).toBeInTheDocument();
    expect(screen.getByText("Verify the source manually")).toBeInTheDocument();
    expect(
      screen.getByText("66666666-6666-4666-8666-666666666666"),
    ).toBeInTheDocument();
  });

  it("shows an empty state and closes", async () => {
    const onClose = vi.fn();
    useFeedbackMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        items: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      },
      refetch: vi.fn(),
    });
    render(<AlertFeedbackHistoryDialog alert={alert} onClose={onClose} />);
    expect(screen.getByText("No feedback submitted")).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
