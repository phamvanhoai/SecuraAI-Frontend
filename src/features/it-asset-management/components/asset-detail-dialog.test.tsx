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
        dependencies: [{ id: "dependency-1", type: null, description: null, asset: { id: "dependency-asset-1", assetCode: "AST-DB", name: "Database", status: "archived" } }],
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
    expect(screen.getByText("Created at")).toBeInTheDocument();
    expect(screen.queryByText("Archived at")).not.toBeInTheDocument();
    expect(screen.getByText("Dependency · Status: Archived")).toBeInTheDocument();
    expect(screen.getByText("CTRL-01 — MFA")).toBeInTheDocument();
  });

  it("closes the dialog and clears the selected asset", async () => {
    const onClose = vi.fn();
    useAssetDetailMock.mockReturnValue({ isPending: true, isError: false, data: undefined });
    render(<AssetDetailDialog assetId="00000000-0000-4000-8000-000000000001" onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
  it.each([true, false])("shows archive metadata and honest legacy fallback (%s)", (hasMetadata) => {
    useAssetDetailMock.mockReturnValue({ isPending: false, isError: false, data: {
      assetCode: "AST-OLD", name: "Archived server", assetType: "SERVER", criticality: "low", dataClassification: "internal", status: "archived", description: null,
      owner: null, createdBy: null, businessService: null, classification: null,
      createdAt: "2026-10-02T00:00:00Z", updatedAt: "2026-10-02T00:00:00Z", archivedAt: "2026-10-02T00:00:00Z",
      archivedBy: hasMetadata ? { fullName: "Archiving Officer" } : null,
      archiveReason: hasMetadata ? "Replaced by managed infrastructure" : null,
      dependencies: [], controls: [], eventSources: [], risks: [], incidents: [],
    } });
    render(<AssetDetailDialog assetId="00000000-0000-4000-8000-000000000001" onClose={vi.fn()} />);
    expect(screen.getByText("Archived by")).toBeVisible();
    expect(screen.getByText("Archive reason")).toBeVisible();
    if (hasMetadata) {
      expect(screen.getByText("Archiving Officer")).toBeVisible();
      expect(screen.getByText("Replaced by managed infrastructure")).toBeVisible();
    } else expect(screen.getAllByText("Not recorded")).toHaveLength(2);
  });
  it("shows the saved classification evidence and assessor", () => {
    useAssetDetailMock.mockReturnValue({ isPending: false, isError: false, data: {
      assetCode: "AST-001", name: "Public service", assetType: "SERVER", criticality: "critical", dataClassification: "public", status: "active", description: null, owner: null, createdBy: null, businessService: null,
      createdAt: "2026-10-02T00:00:00Z", updatedAt: "2026-10-02T00:00:00Z", dependencies: [], controls: [], eventSources: [], risks: [], incidents: [],
      classification: { confidentialityImpact: 1, integrityImpact: 1, availabilityImpact: 5, businessImpact: 1, rationale: "An outage stops the essential public service.", methodVersion: "SECURAAI-ASSET-IMPACT-v1", assessedAt: "2026-10-02T00:00:00Z", assessedBy: { fullName: "Security Officer" } },
    } });
    render(<AssetDetailDialog assetId="00000000-0000-4000-8000-000000000001" onClose={vi.fn()} />);
    expect(screen.getByText(/SECURAAI-ASSET-IMPACT-v1/)).toBeVisible();
    expect(screen.getByText("An outage stops the essential public service.")).toBeVisible();
    expect(screen.getByText(/C: 1 · I: 1 · A: 5 · Business: 1/)).toBeVisible();
    expect(screen.getByText(/Assessed by Security Officer/)).toBeVisible();
  });
});
