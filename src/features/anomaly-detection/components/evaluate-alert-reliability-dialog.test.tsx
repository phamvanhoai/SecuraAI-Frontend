import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { EvaluateAlertReliabilityDialog } from "./evaluate-alert-reliability-dialog";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  success: vi.fn(),
}));

vi.mock("../hooks/use-ai-alerts", () => ({
  useEvaluateAiAlertReliability: () => ({
    isPending: false,
    mutateAsync: mocks.mutateAsync,
  }),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
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

beforeEach(() => {
  mocks.mutateAsync.mockReset();
  mocks.success.mockReset();
  mocks.mutateAsync.mockResolvedValue({});
});

afterEach(cleanup);

describe("EvaluateAlertReliabilityDialog", () => {
  it("requires an assessment", async () => {
    render(<EvaluateAlertReliabilityDialog alert={alert} onClose={vi.fn()} />);

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Submit feedback" }));

    expect(
      await screen.findByText("Select a reliability assessment."),
    ).toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it("submits the backend contract and confirms success", async () => {
    const onClose = vi.fn();
    render(<EvaluateAlertReliabilityDialog alert={alert} onClose={onClose} />);
    const user = userEvent.setup();

    await user.selectOptions(
      screen.getByLabelText("Assessment"),
      "false_positive",
    );
    await user.type(
      screen.getByLabelText("Comment (optional)"),
      "Expected scanner traffic",
    );
    await user.click(screen.getByRole("button", { name: "Submit feedback" }));

    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        feedbackLabel: "false_positive",
        comment: "Expected scanner traffic",
      }),
    );
    expect(onClose).toHaveBeenCalledOnce();
    expect(mocks.success).toHaveBeenCalledWith(
      "Reliability feedback submitted",
      "Your assessment for AI-2026-001 was recorded.",
    );
  });
});
