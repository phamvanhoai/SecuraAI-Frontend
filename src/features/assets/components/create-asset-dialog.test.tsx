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

const { mutateAsyncMock, successMock } = vi.hoisted(() => ({
  mutateAsyncMock: vi.fn(),
  successMock: vi.fn(),
}));

vi.mock("../hooks/use-create-asset", () => ({
  useCreateAsset: () => ({ mutateAsync: mutateAsyncMock, isPending: false }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: successMock }),
}));

import { CreateAssetDialog } from "./create-asset-dialog";

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
    },
  });
});

afterEach(cleanup);

describe("CreateAssetDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsyncMock.mockResolvedValue({
      assetCode: "AST-002",
      name: "Application Server",
    });
  });

  it("validates required fields before calling the API", async () => {
    const user = userEvent.setup();
    render(<CreateAssetDialog />);
    await user.click(screen.getByRole("button", { name: "Thêm tài sản" }));
    await user.click(screen.getByRole("button", { name: "Tạo tài sản" }));

    expect(
      await screen.findByText("Mã tài sản là bắt buộc"),
    ).toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("submits normalized data, closes and reports success", async () => {
    const user = userEvent.setup();
    render(<CreateAssetDialog />);
    await user.click(screen.getByRole("button", { name: "Thêm tài sản" }));
    await user.type(screen.getByLabelText("Mã tài sản"), " ast-002 ");
    await user.type(
      screen.getByLabelText("Tên tài sản"),
      " Application Server ",
    );
    await user.type(screen.getByLabelText("Loại tài sản"), "server");
    await user.type(screen.getByLabelText("Địa chỉ IP"), "192.168.1.20");
    await user.click(screen.getByRole("button", { name: "Tạo tài sản" }));

    await waitFor(() =>
      expect(mutateAsyncMock).toHaveBeenCalledWith(
        expect.objectContaining({
          assetCode: "AST-002",
          name: "Application Server",
          assetType: "server",
          criticality: "medium",
          ipAddress: "192.168.1.20",
        }),
      ),
    );
    expect(successMock).toHaveBeenCalledWith(
      "Đã tạo tài sản",
      "AST-002 – Application Server",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
