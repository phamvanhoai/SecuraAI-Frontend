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
import { ConfirmAlertIncidentDialog } from "./confirm-alert-incident-dialog";

const mocks = vi.hoisted(() => ({ mutateAsync: vi.fn(), success: vi.fn() }));
vi.mock("../hooks/use-ai-alerts", () => ({
  useConfirmAiAlertAsIncident: () => ({
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
  mocks.mutateAsync.mockResolvedValue({
    changed: true,
    incident: {
      id: "55555555-5555-4555-8555-555555555555",
      code: "INC-11111111-1111-4111-8111-111111111111",
      status: "draft",
      created: true,
    },
  });
});
afterEach(cleanup);

describe("ConfirmAlertIncidentDialog", () => {
  it("waits for confirmation and sends the optional review comment", async () => {
    const onClose = vi.fn();
    render(<ConfirmAlertIncidentDialog alert={alert} onClose={onClose} />);
    const user = userEvent.setup();
    expect(
      screen.getByText(/automatically creates a linked incident draft/i),
    ).toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    await user.type(
      screen.getByLabelText("Review comment (optional)"),
      "  Verified by analyst  ",
    );
    await user.click(screen.getByRole("button", { name: "Confirm incident" }));
    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        comment: "Verified by analyst",
      }),
    );
    expect(onClose).toHaveBeenCalledOnce();
    expect(mocks.success).toHaveBeenCalledWith(
      "Incident draft created",
      expect.stringContaining("INC-11111111-1111-4111-8111-111111111111"),
    );
  });

  it("keeps the dialog open and displays a status conflict", async () => {
    mocks.mutateAsync.mockRejectedValue(
      new Error("Alert cannot be confirmed in its current status"),
    );
    const onClose = vi.fn();
    render(<ConfirmAlertIncidentDialog alert={alert} onClose={onClose} />);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Confirm incident" }));
    expect(
      await screen.findByText(
        "Alert cannot be confirmed in its current status",
      ),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });
});
