import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { useAssetDetailMock, mutateAsyncMock, successMock } = vi.hoisted(() => ({
  useAssetDetailMock: vi.fn(),
  mutateAsyncMock: vi.fn(),
  successMock: vi.fn(),
}));
vi.mock("../hooks/use-asset-detail", () => ({ useAssetDetail: useAssetDetailMock }));
vi.mock("../hooks/use-update-asset", () => ({
  useUpdateAsset: () => ({ mutateAsync: mutateAsyncMock, isPending: false }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: successMock }),
}));

import { EditAssetDialog } from "./edit-asset-dialog";

const asset = {
  id: "00000000-0000-4000-8000-000000000001",
  assetCode: "AST-001",
  name: "Frontend Test Server",
  assetType: "server",
  criticality: "medium" as const,
  status: "active" as const,
  hostname: "fe-test-server",
  ipAddress: "192.168.1.50",
  location: "Server Room",
  description: "Test server",
  department: null,
  owner: null,
  createdAt: "2026-09-10T08:00:00.000Z",
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

describe("EditAssetDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAssetDetailMock.mockReturnValue({ isPending: false, isError: false, data: asset });
    mutateAsyncMock.mockResolvedValue({ ...asset, name: "Updated Server" });
  });

  it("preloads backend data and submits edited values", async () => {
    const user = userEvent.setup();
    render(<EditAssetDialog assetId={asset.id} onClose={vi.fn()} />);
    const name = await screen.findByLabelText("Tên tài sản");
    expect(name).toHaveValue("Frontend Test Server");
    await user.clear(name);
    await user.type(name, "Updated Server");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() =>
      expect(mutateAsyncMock).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Updated Server", ipAddress: "192.168.1.50" }),
      ),
    );
    expect(successMock).toHaveBeenCalledOnce();
  });

  it("prevents editing a disposed asset", () => {
    useAssetDetailMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: { ...asset, status: "disposed" },
    });
    render(<EditAssetDialog assetId={asset.id} onClose={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("không thể chỉnh sửa");
  });
});
