import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { mutateAsyncMock, successMock, optionsMock } = vi.hoisted(() => ({
  mutateAsyncMock: vi.fn(),
  successMock: vi.fn(),
  optionsMock: vi.fn(),
}));
vi.mock("../hooks/use-assign-asset-owner", () => ({
  useAssignAssetOwner: () => ({ mutateAsync: mutateAsyncMock, isPending: false }),
}));
vi.mock("../hooks/use-asset-create-options", () => ({
  useAssetCreateOptions: optionsMock,
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: successMock, info: vi.fn() }),
}));

import { AssignAssetOwnerDialog } from "./assign-asset-owner-dialog";

const assetId = "00000000-0000-4000-8000-000000000001";
const ownerUserId = "00000000-0000-4000-8000-000000000002";
const asset = {
  id: assetId,
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

describe("AssignAssetOwnerDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    optionsMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        departments: [],
        owners: [{ id: ownerUserId, fullName: "Nguyễn Văn A", employeeCode: "EMP-001" }],
        truncated: { departments: false, owners: false },
      },
    });
    mutateAsyncMock.mockResolvedValue({
      assetId,
      previousOwner: null,
      owner: { id: ownerUserId, fullName: "Nguyễn Văn A" },
      changed: true,
      assignedAt: "2026-09-10T10:00:00.000Z",
    });
  });

  it("submits an owner and mandatory reason", async () => {
    const user = userEvent.setup();
    render(<AssignAssetOwnerDialog asset={asset} onClose={vi.fn()} />);
    await user.selectOptions(screen.getByLabelText("New owner"), ownerUserId);
    await user.type(screen.getByLabelText("Reason for change"), "Bàn giao vận hành máy chủ");
    await user.click(screen.getByRole("button", { name: "Save owner" }));

    await waitFor(() =>
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        ownerUserId,
        reason: "Bàn giao vận hành máy chủ",
      }),
    );
    expect(successMock).toHaveBeenCalledWith("Owner updated", "AST-001: Nguyễn Văn A");
  });

  it("blocks assignment for a disposed asset", () => {
    render(
      <AssignAssetOwnerDialog asset={{ ...asset, status: "disposed" }} onClose={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Save owner" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Disposed assets cannot be assigned an owner.");
  });
});
