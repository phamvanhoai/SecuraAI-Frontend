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
  it("shows V2 ownership and linked security context", () => {
    useAssetDetailMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        id: "00000000-0000-4000-8000-000000000001",
        assetCode: "AST-001",
        name: "Frontend Test Server",
        assetType: "server",
        criticality: "medium",
        dataClassification: "confidential",
        status: "active",
        archivedAt: null,
        description: "Test server",
        owner: { id: "00000000-0000-4000-8000-000000000002", fullName: "Asset Owner", inactive: false },
        createdBy: null,
        businessService: { id: "00000000-0000-4000-8000-000000000003", name: "Payment Service", inactive: false },
        dependencies: [],
        controls: [{ id: "00000000-0000-4000-8000-000000000004", code: "CTRL-01", name: "MFA", implementationStatus: "implemented" }],
        eventSources: [],
        risks: [],
        incidents: [],
        createdAt: "2026-09-10T08:00:00.000Z",
        updatedAt: "2026-09-10T08:30:00.000Z",
      },
    });

    render(<AssetDetailDialog assetId="00000000-0000-4000-8000-000000000001" onClose={vi.fn()} />);

    expect(screen.getByText("Asset Owner")).toBeInTheDocument();
    expect(screen.getByText("Payment Service")).toBeInTheDocument();
    expect(screen.getByText("CTRL-01 — MFA")).toBeInTheDocument();
  });

  it("closes the dialog and clears the selected asset", async () => {
    const onClose = vi.fn();
    useAssetDetailMock.mockReturnValue({ isPending: true, isError: false, data: undefined });
    render(<AssetDetailDialog assetId="00000000-0000-4000-8000-000000000001" onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
