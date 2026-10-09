import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MarkFurtherInvestigationDialog } from "./mark-further-investigation-dialog";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  success: vi.fn(),
}));

vi.mock("../hooks/use-ai-alerts", () => ({
  useMarkAiAlertFurtherInvestigation: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
}));
vi.mock("@/features/authentication-account", () => ({
  useSessionUser: () => ({
    data: { fullName: "Security Analyst", email: "analyst@secura.test" },
  }),
}));

const alert = {
  id: "c82662ff-8cb7-4e97-b5f6-b0b1d9cb54c8",
  alertCode: "ALT-C82662FF",
  anomalyScore: 0.92,
  riskScore: null,
  riskLevel: "high",
  title: "Privileged login failure",
  description: "Unexpected privileged authentication activity.",
  status: "reviewing" as const,
  detectedAt: "2026-10-01T00:00:00.000Z",
  asset: null,
  logSource: {
    id: "c82662ff-8cb7-4e97-b5f6-b0b1d9cb54c9",
    name: "Wazuh",
    sourceType: "wazuh",
  },
  model: {
    id: "c82662ff-8cb7-4e97-b5f6-b0b1d9cb54ca",
    name: "Secura behavior model",
    version: "1.0.0",
    provider: "SecuraAI",
  },
  event: {
    id: "c82662ff-8cb7-4e97-b5f6-b0b1d9cb54cb",
    eventType: "login_failure",
    eventTime: "2026-10-01T00:00:00.000Z",
  },
  createdAt: "2026-10-01T00:00:00.000Z",
};

describe("MarkFurtherInvestigationDialog", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mutateAsync.mockResolvedValue({ changed: true });
    HTMLDialogElement.prototype.showModal = vi.fn(function (
      this: HTMLDialogElement,
    ) {
      this.setAttribute("open", "");
    });
    HTMLDialogElement.prototype.close = vi.fn(function (
      this: HTMLDialogElement,
    ) {
      this.removeAttribute("open");
    });
  });

  it("submits a trimmed investigation reason", async () => {
    const user = userEvent.setup();
    render(<MarkFurtherInvestigationDialog alert={alert} onClose={vi.fn()} />);
    await user.type(
      screen.getByLabelText("Feedback reason"),
      "  Correlate this activity with endpoint telemetry.  ",
    );
    await user.click(
      screen.getByRole("button", { name: "Need further investigation" }),
    );
    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        reason: "Correlate this activity with endpoint telemetry.",
      }),
    );
  });

  it("requires a meaningful reason", async () => {
    const user = userEvent.setup();
    render(<MarkFurtherInvestigationDialog alert={alert} onClose={vi.fn()} />);
    await user.type(screen.getByLabelText("Feedback reason"), "short");
    await user.click(
      screen.getByRole("button", { name: "Need further investigation" }),
    );
    expect(
      await screen.findByText(
        "Investigation reason must be at least 10 characters.",
      ),
    ).toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });
});
