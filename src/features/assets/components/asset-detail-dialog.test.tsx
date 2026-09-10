import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const { useAssetDetailMock } = vi.hoisted(() => ({ useAssetDetailMock: vi.fn() }));
vi.mock("../hooks/use-asset-detail", () => ({ useAssetDetail: useAssetDetailMock }));

import { AssetDetailDialog } from "./asset-detail-dialog";

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

describe("AssetDetailDialog", () => {
  it("shows hostname, IP and location returned by the backend", () => {
    useAssetDetailMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        id: "00000000-0000-4000-8000-000000000001",
        assetCode: "AST-001",
        name: "Frontend Test Server",
        assetType: "server",
        criticality: "medium",
        status: "active",
        hostname: "fe-test-server",
        ipAddress: "192.168.1.50",
        location: "Server Room",
        description: "Test server",
        department: null,
        owner: null,
        createdAt: "2026-09-10T08:00:00.000Z",
        updatedAt: "2026-09-10T08:30:00.000Z",
      },
    });

    render(<AssetDetailDialog assetId="00000000-0000-4000-8000-000000000001" onClose={vi.fn()} />);

    expect(screen.getByText("fe-test-server")).toBeInTheDocument();
    expect(screen.getByText("192.168.1.50")).toBeInTheDocument();
    expect(screen.getByText("Server Room")).toBeInTheDocument();
  });

  it("closes the dialog and clears the selected asset", async () => {
    const onClose = vi.fn();
    useAssetDetailMock.mockReturnValue({ isPending: true, isError: false, data: undefined });
    render(<AssetDetailDialog assetId="00000000-0000-4000-8000-000000000001" onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Đóng" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
