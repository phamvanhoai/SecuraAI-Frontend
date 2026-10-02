import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ save: vi.fn(), success: vi.fn(), detail: { isPending: false, isError: false, data: { assetCode: "AST-01", name: "App", status: "active", businessService: null, dependencies: [{ asset: { id: "00000000-0000-4000-8000-000000000002", assetCode: "AST-02", name: "Database", status: "archived" } }], eventSources: [] } } }));
const assetId = "00000000-0000-4000-8000-000000000001";
const dependencyId = "00000000-0000-4000-8000-000000000002";
vi.mock("../hooks/use-asset-detail", () => ({ useAssetDetail: () => mocks.detail }));
vi.mock("../hooks/use-asset-create-options", () => ({ useAssetCreateOptions: () => ({ isPending: false, isError: false, data: { businessServices: [], assets: [], eventSources: [] } }) }));
vi.mock("../hooks/use-link-asset-context", () => ({ useLinkAssetContext: () => ({ isPending: false, mutateAsync: mocks.save }) }));
vi.mock("@/components/feedback/toast", () => ({ useToast: () => ({ success: mocks.success }) }));
import { LinkAssetContextDialog } from "./link-asset-context-dialog";
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value(this: HTMLDialogElement) { this.setAttribute("open", ""); } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute("open"); } });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe("LinkAssetContextDialog existing links", () => {
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
