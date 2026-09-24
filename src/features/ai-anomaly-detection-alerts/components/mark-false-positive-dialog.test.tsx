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
import { MarkFalsePositiveDialog } from "./mark-false-positive-dialog";

const mocks = vi.hoisted(() => ({ mutateAsync: vi.fn(), success: vi.fn() }));
vi.mock("../hooks/use-ai-alerts", () => ({
  useMarkAiAlertFalsePositive: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
}));

const alert = {
  id: "11111111-1111-4111-8111-111111111111",
  alertCode: "AI-2026-001",
  anomalyScore: 0.92,
  riskScore: null,
  riskLevel: null,
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
  mocks.mutateAsync.mockResolvedValue({ changed: true });
});
afterEach(cleanup);

describe("MarkFalsePositiveDialog", () => {
  it("requires confirmation and sends only the optional reason", async () => {
    const onClose = vi.fn();
    render(<MarkFalsePositiveDialog alert={alert} onClose={onClose} />);
    const user = userEvent.setup();
    expect(
      screen.getByText(/does not retrain the AI model/i),
    ).toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    await user.type(
      screen.getByLabelText("Reason (optional)"),
      "  Expected scanner traffic  ",
    );
    await user.click(
      screen.getByRole("button", { name: "Mark false positive" }),
    );
    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        comment: "Expected scanner traffic",
      }),
    );
    expect(onClose).toHaveBeenCalledOnce();
    expect(mocks.success).toHaveBeenCalledWith(
      "Alert marked as false positive",
      expect.stringContaining(alert.alertCode),
    );
  });

  it("keeps the dialog open and shows a persistent error on failure", async () => {
    mocks.mutateAsync.mockRejectedValue(
      new Error("Alert cannot be marked false positive in its current status"),
    );
    const onClose = vi.fn();
    render(<MarkFalsePositiveDialog alert={alert} onClose={onClose} />);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Mark false positive" }));
    expect(
      await screen.findByText(
        "Alert cannot be marked false positive in its current status",
      ),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
