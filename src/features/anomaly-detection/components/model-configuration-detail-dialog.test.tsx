import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ModelConfigurationDetailDialog } from "./model-configuration-detail-dialog";

const configuration = {
  id: "00000000-0000-4000-8000-000000000001",
  modelName: "security-anomaly",
  algorithm: "rule-based-threshold",
  version: "1.1.0",
  provider: "ollama",
  modelPath: null,
  parameters: {
    ollamaModel: "qwen3:4b",
    rules: [
      {
        id: "failed-login-burst",
        name: "Repeated failed logins",
        eventType: "authentication.failed",
        threshold: 4,
        windowSeconds: 300,
        groupBy: "sourceIp" as const,
        severity: "high" as const,
        enabled: true,
      },
    ],
  },
  active: true,
  createdAt: "2026-09-11T08:30:00.000Z",
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

describe("ModelConfigurationDetailDialog", () => {
  it("shows model metadata and its immutable detection rules", () => {
    render(
      <ModelConfigurationDetailDialog
        configuration={configuration}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(screen.getByText("security-anomaly 1.1.0")).toBeInTheDocument();
    expect(screen.getByText("Repeated failed logins")).toBeInTheDocument();
    expect(
      screen.getByText("authentication.failed", { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText("300 seconds")).toBeInTheDocument();
  });

  it("closes through the secondary action", async () => {
    const onClose = vi.fn();
    render(
      <ModelConfigurationDetailDialog
        configuration={configuration}
        onClose={onClose}
      />,
    );
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
