import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ModelConfigurationDetailDialog } from "./model-configuration-detail-dialog";

const configuration = {
  id: "00000000-0000-4000-8000-000000000001",
  modelName: "security-anomaly",
  modelType: "isolation-forest",
  version: "1.1.0",
  status: "deployed" as const,
  featureDefinition: null,
  parameters: null,
  dataset: {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Security events",
    version: "2.0",
  },
  latestEvaluation: {
    id: "22222222-2222-4222-8222-222222222222",
    precision: 0.91,
    recall: 0.87,
    f1Score: 0.89,
    prAuc: 0.93,
    falsePositiveRate: 0.04,
    alertsPerDay: 12.5,
    detectionLatencyMs: 35.2,
    notes: "Validated against the holdout set.",
    evaluatedAt: "2026-09-11T09:30:00.000Z",
  },
  deployedAt: "2026-09-11T10:30:00.000Z",
  retiredAt: null,
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
  it("shows model metadata and latest evaluation metrics", () => {
    render(
      <ModelConfigurationDetailDialog
        configuration={configuration}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(screen.getByText("security-anomaly 1.1.0")).toBeInTheDocument();
    expect(screen.getByText("Security events 2.0")).toBeInTheDocument();
    expect(screen.getByText("91.0%")).toBeInTheDocument();
    expect(
      screen.getByText("Validated against the holdout set."),
    ).toBeInTheDocument();
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
