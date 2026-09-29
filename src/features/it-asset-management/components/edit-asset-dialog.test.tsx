import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
const { detail, update, options, success } = vi.hoisted(() => ({ detail: vi.fn(), update: vi.fn(), options: vi.fn(), success: vi.fn() }));
vi.mock("../hooks/use-asset-detail", () => ({ useAssetDetail: detail }));
vi.mock("../hooks/use-update-asset", () => ({ useUpdateAsset: () => ({ mutateAsync: update, isPending: false }) }));
vi.mock("../hooks/use-asset-create-options", () => ({ useAssetCreateOptions: options }));
vi.mock("@/components/feedback/toast", () => ({ useToast: () => ({ success, error: vi.fn() }) }));
import { EditAssetDialog } from "./edit-asset-dialog";
const id = "00000000-0000-4000-8000-000000000001";
beforeAll(() => { Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value(this: HTMLDialogElement) { this.setAttribute("open", ""); } }); Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute("open"); } }); });
afterEach(cleanup);
describe("EditAssetDialog", () => {
  beforeEach(() => { vi.clearAllMocks(); detail.mockReturnValue({ isPending: false, isError: false, data: { id, assetCode: "AST-001", name: "Server", assetType: "server", criticality: "medium", dataClassification: "internal", description: null, status: "active", owner: null, businessService: null, dependencies: [], eventSources: [] } }); options.mockReturnValue({ isPending: false, isError: false, data: { owners: [], businessServices: [], assets: [], eventSources: [] } }); update.mockResolvedValue({ assetCode: "AST-001", name: "Updated Server" }); });
  it("preloads and submits the edited asset", async () => { const user = userEvent.setup(); render(<EditAssetDialog assetId={id} onClose={vi.fn()} />); const name = await screen.findByLabelText("Asset name"); expect(name).toHaveValue("Server"); await user.clear(name); await user.type(name, "Updated Server"); await user.click(screen.getByRole("button", { name: "Save changes" })); await waitFor(() => expect(update).toHaveBeenCalledWith(expect.objectContaining({ name: "Updated Server", criticality: "medium", dependencyIds: [], eventSourceIds: [] }))); expect(success).toHaveBeenCalledOnce(); });
});
