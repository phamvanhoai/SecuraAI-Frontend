import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { mutateAsyncMock, successMock } = vi.hoisted(() => ({
  mutateAsyncMock: vi.fn(),
  successMock: vi.fn(),
}));

vi.mock("../hooks/use-classify-asset-criticality", () => ({
  useClassifyAssetCriticality: () => ({ mutateAsync: mutateAsyncMock, isPending: false }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: successMock }),
}));

import { ClassifyAssetCriticalityDialog } from "./classify-asset-criticality-dialog";

const asset = {
  id: "00000000-0000-4000-8000-000000000001",
  assetCode: "AST-001",
  name: "Database Server",
  assetType: "server",
  criticality: "medium" as const,
  status: "active" as const,
  location: "Server Room",
  department: null,
  owner: null,
  updatedAt: "2026-09-10T08:30:00.000Z",
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

describe("ClassifyAssetCriticalityDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsyncMock.mockResolvedValue({
      assetId: asset.id,
      previousCriticality: "medium",
      criticality: "critical",
      score: 4.55,
      changed: true,
      classifiedAt: "2026-09-10T10:00:00.000Z",
    });
  });

  it("submits four scores and a mandatory reason", async () => {
    const user = userEvent.setup();
    render(<ClassifyAssetCriticalityDialog asset={asset} onClose={vi.fn()} />);

    await user.clear(screen.getByLabelText("Confidentiality impact"));
    await user.type(screen.getByLabelText("Confidentiality impact"), "5");
    await user.clear(screen.getByLabelText("Integrity impact"));
    await user.type(screen.getByLabelText("Integrity impact"), "4");
    await user.clear(screen.getByLabelText("Availability impact"));
    await user.type(screen.getByLabelText("Availability impact"), "5");
    await user.clear(screen.getByLabelText("Business impact"));
    await user.type(screen.getByLabelText("Business impact"), "4");
    await user.type(screen.getByLabelText("Classification reason"), "Production database");
    await user.click(screen.getByRole("button", { name: "Classify" }));

    await waitFor(() =>
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        confidentialityImpact: 5,
        integrityImpact: 4,
        availabilityImpact: 5,
        businessImpact: 4,
        reason: "Production database",
      }),
    );
    expect(successMock).toHaveBeenCalledWith(
      "Criticality classified",
      "AST-001: Critical – score 4.55",
    );
  });

  it("does not allow classification for a disposed asset", () => {
    render(
      <ClassifyAssetCriticalityDialog
        asset={{ ...asset, status: "disposed" }}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Classify" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Disposed assets cannot be classified.");
  });
});
