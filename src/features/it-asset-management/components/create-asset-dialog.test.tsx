import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { mutateAsyncMock, successMock, optionsMock } = vi.hoisted(() => ({
  mutateAsyncMock: vi.fn(),
  successMock: vi.fn(),
  optionsMock: vi.fn(),
}));

vi.mock("../hooks/use-create-asset", () => ({
  useCreateAsset: () => ({ mutateAsync: mutateAsyncMock, isPending: false }),
}));
vi.mock("../hooks/use-asset-create-options", () => ({
  useAssetCreateOptions: optionsMock,
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: successMock }),
}));

import { CreateAssetDialog } from "./create-asset-dialog";

const departmentId = "00000000-0000-4000-8000-000000000010";
const ownerUserId = "00000000-0000-4000-8000-000000000020";

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
    optionsMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        departments: [{ id: departmentId, code: "IT", name: "Công nghệ thông tin" }],
        owners: [{ id: ownerUserId, fullName: "Nguyễn Văn A", employeeCode: "EMP-001" }],
        truncated: { departments: false, owners: false },
      },
    });
  });

  it("loads options only while the dialog is open and validates required fields", async () => {
    const user = userEvent.setup();
    render(<CreateAssetDialog />);
    expect(optionsMock).toHaveBeenLastCalledWith(false);

    await user.click(screen.getByRole("button", { name: "Add asset" }));
    expect(optionsMock).toHaveBeenLastCalledWith(true);
    await user.click(screen.getByRole("button", { name: "Create asset" }));

    expect(await screen.findByText("Asset code is required")).toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("submits normalized data with the selected department and owner", async () => {
    const user = userEvent.setup();
    render(<CreateAssetDialog />);
    await user.click(screen.getByRole("button", { name: "Add asset" }));
    await user.type(screen.getByLabelText("Asset code"), " ast-002 ");
    await user.type(screen.getByLabelText("Asset name"), " Application Server ");
    await user.type(screen.getByLabelText("Asset type"), "server");
    await user.type(screen.getByLabelText("IP address"), "192.168.1.20");
    await user.selectOptions(screen.getByLabelText("Department"), departmentId);
    await user.selectOptions(screen.getByLabelText("Owner"), ownerUserId);
    await user.click(screen.getByRole("button", { name: "Create asset" }));

    await waitFor(() =>
      expect(mutateAsyncMock).toHaveBeenCalledWith(
        expect.objectContaining({
          assetCode: "AST-002",
          name: "Application Server",
          assetType: "server",
          ipAddress: "192.168.1.20",
          departmentId,
          ownerUserId,
        }),
      ),
    );
    expect(successMock).toHaveBeenCalledWith(
      "Asset created",
      "AST-002 – Application Server",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("allows creating an unassigned asset when options cannot be loaded", async () => {
    optionsMock.mockReturnValue({ isPending: false, isError: true, data: undefined });
    const user = userEvent.setup();
    render(<CreateAssetDialog />);
    await user.click(screen.getByRole("button", { name: "Add asset" }));

    expect(screen.getByRole("alert")).toHaveTextContent("can still create an unassigned asset");
    expect(screen.getByLabelText("Department")).toBeEnabled();
    expect(screen.getByLabelText("Owner")).toBeEnabled();
  });
});
