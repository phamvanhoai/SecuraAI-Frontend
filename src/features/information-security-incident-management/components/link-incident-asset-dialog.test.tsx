import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Incident } from "../schemas/report-incident-schema";
import { LinkIncidentAssetDialog } from "./link-incident-asset-dialog";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  unlinkAsync: vi.fn(),
  success: vi.fn(),
  assetOptions: vi.fn(),
}));

vi.mock("../hooks/use-incidents", () => ({
  useIncidentAssetOptions: (
    _id: string | undefined,
    query: { scope: "linked" | "unlinked" },
  ) => {
    mocks.assetOptions(query);
    const linkedAsset = {
      id: "11111111-1111-4111-8111-111111111111",
      assetCode: "AST-001",
      name: "Production API",
      assetType: "application",
      criticality: "critical",
      linked: true,
    };
    const availableAsset = {
      id: "22222222-2222-4222-8222-222222222222",
      assetCode: "AST-002",
      name: "Database server",
      assetType: "server",
      criticality: "high",
      linked: false,
    };
    return {
      data: {
        assets:
          query.scope === "linked"
            ? [linkedAsset]
            : [
                availableAsset,
                {
                  ...availableAsset,
                  id: "33333333-3333-4333-8333-333333333333",
                  assetCode: "AST-003",
                },
              ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
      isPending: false,
      isError: false,
    };
  },
  useLinkIncidentToAsset: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
    isError: false,
  }),
  useUnlinkIncidentFromAsset: () => ({
    mutateAsync: mocks.unlinkAsync,
    isPending: false,
    isError: false,
  }),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
}));

const timestamp = "2026-10-01T00:00:00.000Z";
const incident: Incident = {
  id: "33333333-3333-4333-8333-333333333333",
  incidentCode: "INC-001",
  title: "Suspicious privileged login",
  description: null,
  category: "account_compromise",
  severity: "high",
  status: "in_progress",
  occurredAt: timestamp,
  detectedAt: timestamp,
  confirmedAt: null,
  closedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  classified: true,
  hasAnalysis: false,
  classificationCount: 1,
  lastClassification: null,
  currentAssignment: null,
  createdBy: null,
  relatedCounts: { actions: 0, assets: 1, controls: 0, evidence: 0, risks: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.removeAttribute("open");
    },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
});

describe("link incident asset dialog", () => {
  it("preserves selections when searching available options", () => {
    render(<LinkIncidentAssetDialog incident={incident} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("checkbox", { name: /AST-002/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Search available assets" }),
    );
    expect(screen.getByRole("checkbox", { name: /AST-002/ })).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Link selected (1)" }),
    ).toBeEnabled();
  });

  it("links multiple selections and retains only failures for retry", async () => {
    const onClose = vi.fn();
    mocks.mutateAsync
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("Unavailable"));
    render(<LinkIncidentAssetDialog incident={incident} onClose={onClose} />);
    const first = screen.getByRole("checkbox", { name: /AST-002/ });
    const second = screen.getByRole("checkbox", { name: /AST-003/ });
    fireEvent.click(first);
    fireEvent.click(second);
    expect(
      screen.getByRole("button", { name: "Link selected (2)" }),
    ).toBeEnabled();
    fireEvent.submit(first.closest("form") as HTMLFormElement);
    await waitFor(() =>
      expect(screen.getByText(/Could not link:/)).toHaveTextContent("AST-003"),
    );
    expect(mocks.mutateAsync).toHaveBeenCalledTimes(2);
    expect(first).not.toBeChecked();
    expect(second).toBeChecked();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("keeps the dialog open and clears the selection after linking", async () => {
    const onClose = vi.fn();
    mocks.mutateAsync.mockResolvedValue({
      asset: { assetCode: "AST-002" },
      incident: { incidentCode: "INC-001" },
    });
    render(<LinkIncidentAssetDialog incident={incident} onClose={onClose} />);
    const option = screen.getByRole("checkbox", { name: /AST-002/ });
    fireEvent.click(option);
    fireEvent.submit(option.closest("form") as HTMLFormElement);
    await waitFor(() => expect(mocks.success).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(option).not.toBeChecked();
  });

  it("shows existing links and only offers assets that are not linked", () => {
    render(<LinkIncidentAssetDialog incident={incident} onClose={vi.fn()} />);

    expect(
      screen.getAllByRole("heading", { name: "Link another asset" })[0],
    ).toBeVisible();
    expect(screen.getByText("Linked assets")).toBeVisible();
    expect(screen.getByText("Production API")).toBeVisible();

    expect(
      screen.queryByRole("checkbox", { name: /AST-001/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: /AST-002/ }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /AST-002/ }));
    expect(
      screen.getByRole("button", { name: "Link selected (1)" }),
    ).toBeEnabled();
  });

  it("requires confirmation before unlinking an asset", async () => {
    mocks.unlinkAsync.mockResolvedValue(undefined);
    render(<LinkIncidentAssetDialog incident={incident} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Unlink" }));
    expect(screen.getByText("Remove this asset link?")).toBeVisible();
    expect(mocks.unlinkAsync).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Remove link" }));
    await waitFor(() =>
      expect(mocks.unlinkAsync).toHaveBeenCalledWith({
        incidentId: incident.id,
        assetId: "11111111-1111-4111-8111-111111111111",
      }),
    );
    expect(mocks.success).toHaveBeenCalledWith(
      "Asset unlinked",
      expect.stringContaining("AST-001"),
    );
  });

  it("sends the asset code or name search to the paginated query", () => {
    render(<LinkIncidentAssetDialog incident={incident} onClose={vi.fn()} />);

    fireEvent.change(
      screen.getByPlaceholderText("Search by asset code or name"),
      {
        target: { value: "VPN Gateway" },
      },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Search available assets" }),
    );

    expect(mocks.assetOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        q: "VPN Gateway",
        scope: "unlinked",
        page: 1,
      }),
    );
  });
});
