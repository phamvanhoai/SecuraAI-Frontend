import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/api-error";

const { mutateAsyncMock, successMock } = vi.hoisted(() => ({
  mutateAsyncMock: vi.fn(),
  successMock: vi.fn(),
}));
vi.mock("../hooks/use-delete-asset", () => ({
  useDeleteAsset: () => ({ mutateAsync: mutateAsyncMock, isPending: false }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: successMock }),
}));

import { DeleteAssetDialog } from "./delete-asset-dialog";

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
    value(this: HTMLDialogElement) { this.setAttribute("open", ""); },
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

describe("DeleteAssetDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsyncMock.mockResolvedValue(undefined);
  });

  it("requires the exact asset code before deleting", async () => {
    const user = userEvent.setup();
    render(<DeleteAssetDialog asset={asset} onClose={vi.fn()} />);
    const deleteButton = screen.getByRole("button", { name: "Delete Asset" });
    expect(deleteButton).toBeDisabled();

    await user.type(screen.getByLabelText(/Enter code/), "AST-001");
    expect(deleteButton).toBeEnabled();
    await user.click(deleteButton);

    await waitFor(() => expect(mutateAsyncMock).toHaveBeenCalledWith(asset.id));
    expect(successMock).toHaveBeenCalledOnce();
  });

  it("keeps the dialog open and explains active dependency conflicts", async () => {
    const user = userEvent.setup();
    mutateAsyncMock.mockRejectedValue(
      new ApiError("Backend conflict", 409, "CONFLICT"),
    );
    render(<DeleteAssetDialog asset={asset} onClose={vi.fn()} />);
    await user.type(screen.getByLabelText(/Enter code/), "AST-001");
    await user.click(screen.getByRole("button", { name: "Delete Asset" }));

    expect(
      await screen.findByText(/Unable to delete because the asset has active business dependencies./),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
  });
});
