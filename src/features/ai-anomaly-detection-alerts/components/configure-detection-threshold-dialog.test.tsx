import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  threshold: {
    isPending: false,
    isError: false,
    data: {
      modelVersionId: "11111111-1111-4111-8111-111111111111",
      modelName: "secura-organizational-behavior",
      version: "1.0.0",
      status: "deployed" as const,
      threshold: 0.8,
      deployedAt: "2026-09-30T00:00:00.000Z",
    },
    refetch: vi.fn(),
  },
  mutateAsync: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("../hooks/use-alert-thresholds", () => ({
  useDetectionThreshold: () => state.threshold,
  useConfigureDetectionThreshold: () => ({
    mutateAsync: state.mutateAsync,
    isPending: false,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: state.toastSuccess }),
}));

import { ConfigureDetectionThresholdDialog } from "./configure-detection-threshold-dialog";

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
beforeEach(() => {
  state.mutateAsync.mockReset();
  state.toastSuccess.mockReset();
});

describe("ConfigureDetectionThresholdDialog", () => {
  it("shows the deployed model and current threshold", async () => {
    render(<ConfigureDetectionThresholdDialog open onClose={vi.fn()} />);

    expect(screen.getByText("secura-organizational-behavior 1.0.0")).toBeInTheDocument();
    expect(screen.getByText("Current threshold: 80%")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText("Anomaly score threshold (%)")).toHaveValue(80);
    });
  });

  it("updates the model threshold as a normalized score", async () => {
    state.mutateAsync.mockResolvedValue({
      ...state.threshold.data,
      threshold: 0.75,
    });
    const onClose = vi.fn();
    render(<ConfigureDetectionThresholdDialog open onClose={onClose} />);
    const user = userEvent.setup();
    const input = screen.getByLabelText("Anomaly score threshold (%)");

    await user.clear(input);
    await user.type(input, "75");
    await user.click(screen.getByRole("button", { name: "Save threshold" }));

    await waitFor(() => {
      expect(state.mutateAsync).toHaveBeenCalledWith({ threshold: 0.75 });
    });
    expect(state.toastSuccess).toHaveBeenCalledWith(
      "Detection threshold updated",
      expect.stringContaining("75%"),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("rejects thresholds below the backend boundary", async () => {
    render(<ConfigureDetectionThresholdDialog open onClose={vi.fn()} />);
    const user = userEvent.setup();
    const input = screen.getByLabelText("Anomaly score threshold (%)");

    await user.clear(input);
    await user.type(input, "40");
    await user.click(screen.getByRole("button", { name: "Save threshold" }));

    expect(await screen.findByText("Threshold must be at least 50%.")).toBeInTheDocument();
    expect(state.mutateAsync).not.toHaveBeenCalled();
  });
});
