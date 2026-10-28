import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api/api-error";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ save: vi.fn(), success: vi.fn(), detail: { isPending: false, isError: false, data: { assetCode: "AST-01", name: "App", status: "active", businessService: null, dependencies: [{ asset: { id: "00000000-0000-4000-8000-000000000002", assetCode: "AST-02", name: "Database", status: "archived" } }], eventSources: [] } } }));
const assetId = "00000000-0000-4000-8000-000000000001";
const dependencyId = "00000000-0000-4000-8000-000000000002";
vi.mock("../hooks/use-asset-detail", () => ({ useAssetDetail: () => mocks.detail }));
vi.mock("../hooks/use-asset-create-options", () => ({ useAssetCreateOptions: () => ({ isPending: false, isError: false, data: { businessServices: [], assets: [], eventSources: [] } }) }));
vi.mock("../hooks/use-link-asset-context", () => ({ useLinkAssetContext: () => ({ isPending: false, mutateAsync: mocks.save }) }));
vi.mock("@/components/feedback/toast", () => ({ useToast: () => ({ success: mocks.success }) }));
import { LinkAssetContextDialog } from "./link-asset-context-dialog";
vi.mock("../hooks/use-asset-context-history", () => ({ useAssetContextHistory: () => ({ data: { items: [], pagination: { total: 0, totalPages: 0 } }, isPending: false, isError: false }) }));
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value(this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute("open"); } });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe("LinkAssetContextDialog existing links", () => {
  it("shows the circular path beside Dependencies and preserves selections", async () => {
    mocks.save.mockRejectedValueOnce(new ApiError("Remove the dependency causing the loop.", 422, "VALIDATION_FAILED", {
      error: { code: "ASSET_DEPENDENCY_CYCLE", details: { path: ["AST-01 — App", "AST-02 — Database", "AST-01 — App"] } },
    }));
    render(<LinkAssetContextDialog assetId={assetId} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Save links" }));
    expect(await screen.findByText(/Circular dependency: AST-01 — App → AST-02 — Database → AST-01 — App/)).toBeVisible();
    expect(screen.getByRole("checkbox", { name: /Database/ })).toBeChecked();
  });
  it("keeps history readable when the asset is archived", async () => {
    mocks.detail.data.status = "archived";
    try {
      render(<LinkAssetContextDialog assetId={assetId} onClose={vi.fn()} />);
      expect(screen.getByRole("button", { name: "Save links" })).toBeDisabled();
      await userEvent.click(screen.getByRole("tab", { name: "History (0)" }));
      expect(screen.getByText("No context history recorded.")).toBeVisible();
      expect(mocks.save).not.toHaveBeenCalled();
    } finally {
      mocks.detail.data.status = "active";
    }
  });
  it("retains edits after a failed save", async () => {
    mocks.save.mockRejectedValueOnce(new Error("Asset context changed concurrently. Reload and try again."));
    render(<LinkAssetContextDialog assetId={assetId} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("checkbox", { name: /Database/ }));
    await userEvent.click(screen.getByRole("button", { name: "Save links" }));
    expect(await screen.findByText(/Asset context changed concurrently/)).toBeVisible();
    await userEvent.click(screen.getByRole("tab", { name: "History (0)" }));
    await userEvent.click(screen.getByRole("tab", { name: "Link Asset Context" }));
    expect(screen.getByRole("checkbox", { name: /Database/ })).not.toBeChecked();
  });
  it("supports keyboard tabs without losing unsaved link selections", async () => {
    const user = userEvent.setup();
    render(<LinkAssetContextDialog assetId={assetId} onClose={vi.fn()} />);
    await user.click(screen.getByRole("checkbox", { name: /Database/ }));
    const links = screen.getByRole("tab", { name: "Link Asset Context" });
    links.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "History (0)" })).toHaveFocus();
    expect(screen.getByText("No context history recorded.")).toBeInTheDocument();
    await user.keyboard("{Home}");
    expect(links).toHaveFocus();
    expect(screen.getByRole("checkbox", { name: /Database/ })).not.toBeChecked();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("shows and preserves an archived dependency absent from active options", async () => {
    const user = userEvent.setup();
    mocks.save.mockResolvedValue({});
    render(<LinkAssetContextDialog assetId={assetId} onClose={vi.fn()} />);
    expect(screen.getByRole("checkbox", { name: /Database/ })).toBeChecked();
    expect(screen.getByText(/archived — existing link/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save links" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith({ businessServiceId: null, dependencyIds: [dependencyId], eventSourceIds: [] }));
  });
  it("removes an archived link only after explicit unchecking", async () => {
    const user = userEvent.setup();
    mocks.save.mockResolvedValue({});
    render(<LinkAssetContextDialog assetId={assetId} onClose={vi.fn()} />);
    await user.click(screen.getByRole("checkbox", { name: /Database/ }));
    await user.click(screen.getByRole("button", { name: "Save links" }));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith({ businessServiceId: null, dependencyIds: [], eventSourceIds: [] }));
  });
});
