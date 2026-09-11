import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AiAlertDetailDialog } from "./ai-alert-detail-dialog";

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

describe("AiAlertDetailDialog", () => {
  it("shows backend alert, event, source, and model details", () => {
    render(<AiAlertDetailDialog alert={alert} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(screen.getByText(alert.title)).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.getByText("authentication.failed")).toBeInTheDocument();
    expect(screen.getByText("Windows Authentication")).toBeInTheDocument();
    expect(screen.getByText("anomaly-detector 1.0.0")).toBeInTheDocument();
  });

  it("closes through the secondary action", async () => {
    const onClose = vi.fn();
    render(<AiAlertDetailDialog alert={alert} onClose={onClose} />);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
