import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api/api-error";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  save: vi.fn(),
  success: vi.fn(),
  detail: {
    isPending: false,
    isError: false,
    data: {
      assetCode: "AST-01",
      name: "App",
      status: "active",
      businessService: null,
      dependencies: [
        {
          asset: {
            id: "00000000-0000-4000-8000-000000000002",
            assetCode: "AST-02",
            name: "Database",
            status: "archived",
          },
        },
      ],
      eventSources: [],
    },
  },
}));
const assetId = "00000000-0000-4000-8000-000000000001";
const dependencyId = "00000000-0000-4000-8000-000000000002";
vi.mock("../hooks/use-asset-detail", () => ({
  useAssetDetail: () => mocks.detail,
}));
vi.mock("../hooks/use-asset-create-options", () => ({
  useAssetCreateOptions: () => ({
    isPending: false,
    isError: false,
    data: { businessServices: [], assets: [], eventSources: [] },
  }),
}));
vi.mock("../hooks/use-link-asset-context", () => ({
  useLinkAssetContext: () => ({ isPending: false, mutateAsync: mocks.save }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
}));
vi.mock("../hooks/use-assets", () => ({
  useAssets: (
    query: { q?: string; page: number; limit: number },
    enabled: boolean,
  ) => {
    searchMock(query, enabled);
    return {
      isPending: false,
      isFetching: false,
      isError: false,
      data: {
        items: [
          { id: assetId, assetCode: "AST-01", name: "App", status: "active" },
          {
            id: "00000000-0000-4000-8000-000000000003",
            assetCode: "AST-03",
            name: query.q ? "Remote matching server" : "Other server",
            status: "active",
          },
        ],
        pagination: { totalPages: 2 },
      },
    };
  },
}));
vi.mock("@/features/event-ingestion", () => ({
  useEventSources: (query: { q?: string }, options: { enabled: boolean }) => {
    sourceSearchMock(query, options);
    return {
      isPending: false,
      isFetching: false,
      isError: false,
      data: {
        items: [
          {
            id: "00000000-0000-4000-8000-000000000004",
            name: query.q ? "Remote SIEM" : "Newest SIEM",
            sourceType: "WAZUH",
            status: "ACTIVE",
          },
        ],
      },
    };
  },
}));
const sourceSearchMock = vi.hoisted(() => vi.fn());
const searchMock = vi.hoisted(() => vi.fn());
import { LinkAssetContextDialog } from "./link-asset-context-dialog";
vi.mock("../hooks/use-asset-context-history", () => ({
  useAssetContextHistory: () => ({
    data: { items: [], pagination: { total: 0, totalPages: 0 } },
    isPending: false,
    isError: false,
  }),
}));
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
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe("LinkAssetContextDialog existing links", () => {
  it("searches bounded backend results and preserves selections across searches and save without pagination", async () => {
    const user = userEvent.setup();
    mocks.save.mockResolvedValue({});
    render(<LinkAssetContextDialog assetId={assetId} onClose={vi.fn()} />);
    expect(
      screen.queryByRole("list", { name: "Dependency search results" }),
    ).toBeInTheDocument();
    expect(searchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
      true,
    );
    expect(
      screen.queryByRole("button", { name: "Next results" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("Search dependencies"));
    expect(
      screen.queryByRole("checkbox", { name: /AST-01/ }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("checkbox", { name: /Other server/ }));
    await user.type(screen.getByLabelText("Search dependencies"), "remote");
    await waitFor(() =>
      expect(searchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          q: "remote",
          page: 1,
          limit: 10,
          status: "active",
        }),
        true,
      ),
    );
    expect(
      screen.getByRole("checkbox", { name: /Other server/ }),
    ).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Database/ })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Save links" }));
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith({
        businessServiceId: null,
        dependencyIds: [dependencyId, "00000000-0000-4000-8000-000000000003"],
        eventSourceIds: [],
      }),
    );
  });
  it("loads latest event sources, searches and preserves chosen sources", async () => {
    const user = userEvent.setup();
    mocks.save.mockResolvedValue({});
    render(<LinkAssetContextDialog assetId={assetId} onClose={vi.fn()} />);
    expect(sourceSearchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 10,
        status: "ACTIVE",
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
      { enabled: true },
    );
    await user.click(screen.getByRole("checkbox", { name: /Newest SIEM/ }));
    await user.type(screen.getByLabelText("Search event sources"), "remote");
    await waitFor(() =>
      expect(sourceSearchMock).toHaveBeenCalledWith(
        expect.objectContaining({ q: "remote", limit: 10 }),
        { enabled: true },
      ),
    );
    expect(screen.getByRole("checkbox", { name: /Newest SIEM/ })).toBeChecked();
    await user.click(screen.getByRole("tab", { name: "History (0)" }));
    await user.click(screen.getByRole("tab", { name: "Link Asset Context" }));
    expect(screen.getByRole("checkbox", { name: /Newest SIEM/ })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Save links" }));
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith({
        businessServiceId: null,
        dependencyIds: [dependencyId],
        eventSourceIds: ["00000000-0000-4000-8000-000000000004"],
      }),
    );
  });
  it("shows the circular path beside Dependencies and preserves selections", async () => {
    mocks.save.mockRejectedValueOnce(
      new ApiError(
        "Remove the dependency causing the loop.",
        422,
        "VALIDATION_FAILED",
        {
          error: {
            code: "ASSET_DEPENDENCY_CYCLE",
            details: {
              path: ["AST-01 — App", "AST-02 — Database", "AST-01 — App"],
            },
          },
        },
      ),
    );
    render(<LinkAssetContextDialog assetId={assetId} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Save links" }));
    expect(
      await screen.findByText(
        /Circular dependency: AST-01 — App → AST-02 — Database → AST-01 — App/,
      ),
    ).toBeVisible();
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
    mocks.save.mockRejectedValueOnce(
      new Error("Asset context changed concurrently. Reload and try again."),
    );
    render(<LinkAssetContextDialog assetId={assetId} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("checkbox", { name: /Database/ }));
    await userEvent.click(screen.getByRole("button", { name: "Save links" }));
    expect(
      await screen.findByText(/Asset context changed concurrently/),
    ).toBeVisible();
    await userEvent.click(screen.getByRole("tab", { name: "History (0)" }));
    await userEvent.click(
      screen.getByRole("tab", { name: "Link Asset Context" }),
    );
    expect(
      screen.queryByRole("checkbox", { name: /Database/ }),
    ).not.toBeInTheDocument();
  });
  it("supports keyboard tabs without losing unsaved link selections", async () => {
    const user = userEvent.setup();
    render(<LinkAssetContextDialog assetId={assetId} onClose={vi.fn()} />);
    await user.click(screen.getByRole("checkbox", { name: /Database/ }));
    const links = screen.getByRole("tab", { name: "Link Asset Context" });
    links.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "History (0)" })).toHaveFocus();
    expect(
      screen.getByText("No context history recorded."),
    ).toBeInTheDocument();
    await user.keyboard("{Home}");
    expect(links).toHaveFocus();
    expect(
      screen.queryByRole("checkbox", { name: /Database/ }),
    ).not.toBeInTheDocument();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("shows and preserves an archived dependency absent from active options", async () => {
    const user = userEvent.setup();
    mocks.save.mockResolvedValue({});
    render(<LinkAssetContextDialog assetId={assetId} onClose={vi.fn()} />);
    expect(screen.getByRole("checkbox", { name: /Database/ })).toBeChecked();
    expect(screen.getByText(/archived - existing link/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save links" }));
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith({
        businessServiceId: null,
        dependencyIds: [dependencyId],
        eventSourceIds: [],
      }),
    );
  });
  it("removes an archived link only after explicit unchecking", async () => {
    const user = userEvent.setup();
    mocks.save.mockResolvedValue({});
    render(<LinkAssetContextDialog assetId={assetId} onClose={vi.fn()} />);
    await user.click(screen.getByRole("checkbox", { name: /Database/ }));
    await user.click(screen.getByRole("button", { name: "Save links" }));
    await waitFor(() =>
      expect(mocks.save).toHaveBeenCalledWith({
        businessServiceId: null,
        dependencyIds: [],
        eventSourceIds: [],
      }),
    );
  });
});
