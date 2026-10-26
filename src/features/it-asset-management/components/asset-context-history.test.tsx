import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ query: vi.fn(), retry: vi.fn() }));
vi.mock("../hooks/use-asset-context-history", () => ({ useAssetContextHistory: mocks.query }));
import { AssetContextHistory } from "./asset-context-history";
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe("context history", () => {
  it("shows loading and contextual retry", async () => {
    mocks.query.mockReturnValue({ isPending: true });
    const view = render(<AssetContextHistory assetId="asset" />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading context history");
    mocks.query.mockReturnValue({ isPending: false, isError: true, refetch: mocks.retry });
    view.rerender(<AssetContextHistory assetId="asset" />);
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(mocks.retry).toHaveBeenCalled();
  });
  it("shows saved names, before/after snapshots and pagination", async () => {
    mocks.query.mockReturnValue({ isPending: false, isError: false, data: {
      items: [{ id: "event", actor: { fullName: "Demo officer" }, occurredAt: "2026-10-26T10:00:00Z",
        before: { businessService: { id: "old", name: "Old service" }, dependencies: [], eventSources: [] },
        after: { businessService: { id: "new", name: "New service" }, dependencies: [{ id: "dep", assetCode: "AST-B", name: "Original database name" }], eventSources: [{ id: "source", name: "Original source name" }] },
      }], pagination: { totalPages: 2, total: 11 },
    } });
    render(<AssetContextHistory assetId="asset" />);
    expect(screen.getByText(/Demo officer/)).toBeInTheDocument();
    await userEvent.click(screen.getByText("View changes"));
    expect(screen.getByText("Old service")).toBeVisible();
    expect(screen.getByText("New service")).toBeVisible();
    expect(screen.getByText(/AST-B/)).toHaveTextContent("Original database name");
    expect(screen.getByText("Original source name")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(mocks.query).toHaveBeenLastCalledWith("asset", 2);
  });
});
