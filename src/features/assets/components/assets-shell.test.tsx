import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock, useAssetsMock, createMutationMock, useSessionUserMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  useAssetsMock: vi.fn(),
  createMutationMock: { mutateAsync: vi.fn(), isPending: false },
  useSessionUserMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("../hooks/use-assets", () => ({ useAssets: useAssetsMock }));
vi.mock("../hooks/use-export-assets", () => ({
  useExportAssets: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("../hooks/use-asset-history", () => ({
  useAssetHistory: () => ({ isPending: false, isError: false, data: undefined }),
}));
vi.mock("../hooks/use-asset-detail", () => ({
  useAssetDetail: () => ({ isPending: false, isError: false, data: undefined }),
}));
vi.mock("../hooks/use-update-asset", () => ({
  useUpdateAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("../hooks/use-delete-asset", () => ({
  useDeleteAsset: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("../hooks/use-classify-asset-criticality", () => ({
  useClassifyAssetCriticality: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("../hooks/use-assign-asset-owner", () => ({
  useAssignAssetOwner: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock("../hooks/use-create-asset", () => ({
  useCreateAsset: () => createMutationMock,
}));
vi.mock("../hooks/use-asset-create-options", () => ({
  useAssetCreateOptions: () => ({
    isPending: false,
    isError: false,
    data: {
      departments: [],
      owners: [],
      truncated: { departments: false, owners: false },
    },
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}));
vi.mock("@/features/auth", () => ({
  useSessionUser: useSessionUserMock,
}));

import { AssetsShell } from "./assets-shell";

async function openActions(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(
    screen.getByRole("button", { name: "Actions for AST-001" }),
  );
}

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

describe("AssetsShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionUserMock.mockReturnValue({
      isPending: false,
      data: {
        permissions: [
          "assets.read",
          "assets.create",
          "assets.update",
          "assets.delete",
          "assets.classify",
          "assets.assign-owner",
          "assets.history.read",
        ],
      },
    });
    useAssetsMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        items: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            assetCode: "AST-001",
            name: "Database Server",
            assetType: "server",
            criticality: "medium",
            status: "active",
            location: null,
            department: null,
            owner: null,
            updatedAt: "2026-09-10T00:00:00.000Z",
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    });
  });

  it("renders backend assets and honest nullable relations", () => {
    render(<AssetsShell />);
    expect(screen.getByText("Database Server")).toBeInTheDocument();
    expect(screen.getByText("AST-001")).toBeInTheDocument();
    expect(screen.getAllByText("Unassigned")).toHaveLength(2);
    expect(screen.getByText("1 matching assets")).toBeInTheDocument();
  });

  it("writes search and filters to the URL", async () => {
    const user = userEvent.setup();
    render(<AssetsShell />);
    const filters = within(
      screen.getByRole("form", { name: "Asset filters" }),
    );
    await user.type(
      filters.getByPlaceholderText("Name, code, hostname, or location"),
      "database",
    );
    await user.selectOptions(
      filters.getByLabelText("Criticality"),
      "critical",
    );
    await user.selectOptions(filters.getByLabelText("Status"), "active");
    await user.click(filters.getByRole("button", { name: "Filter" }));

    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining("q=database"),
    );
    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining("criticality=critical"),
    );
    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining("status=active"),
    );
  });

  it("shows a recoverable error without fake rows", () => {
    useAssetsMock.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
    });
    render(<AssetsShell />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to load asset list",
    );
    expect(screen.queryByText("Database Server")).not.toBeInTheDocument();
  });

  it("opens asset details from a table row", async () => {
    const user = userEvent.setup();
    render(<AssetsShell />);

    await openActions(user);
    await user.click(screen.getByRole("menuitem", { name: "View details" }));

    expect(screen.getByRole("dialog")).toHaveAttribute("open");
  });

  it("opens the edit form from a table row", async () => {
    const user = userEvent.setup();
    render(<AssetsShell />);

    await openActions(user);
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));

    expect(screen.getByRole("dialog", { name: "Edit IT Asset" })).toHaveAttribute("open");
  });

  it("opens a confirmation dialog before deleting", async () => {
    const user = userEvent.setup();
    render(<AssetsShell />);

    await openActions(user);
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));

    expect(screen.getByRole("dialog", { name: "Delete Asset" })).toHaveAttribute("open");
    expect(screen.getByRole("button", { name: "Delete Asset" })).toBeDisabled();
  });

  it("shows read-only actions for Employee and Executive permissions", () => {
    useSessionUserMock.mockReturnValue({
      isPending: false,
      data: { permissions: ["assets.read"] },
    });
    render(<AssetsShell />);

    expect(screen.queryByRole("button", { name: "Add asset" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Actions for AST-001" })).toBeInTheDocument();
  });

  it("does not load or show the asset list without assets.read", () => {
    useSessionUserMock.mockReturnValue({ isPending: false, data: { permissions: [] } });
    render(<AssetsShell />);

    expect(screen.getByRole("alert")).toHaveTextContent("do not have permission");
    expect(useAssetsMock).toHaveBeenCalledWith(expect.any(Object), false);
  });

  it("opens criticality classification for Security Officer", async () => {
    const user = userEvent.setup();
    render(<AssetsShell />);

    await openActions(user);
    await user.click(screen.getByRole("menuitem", { name: "Classify criticality" }));

    expect(
      screen.getByRole("dialog", { name: "Classify Asset Criticality" }),
    ).toHaveAttribute("open");
  });

  it("opens owner assignment for Security Officer", async () => {
    const user = userEvent.setup();
    render(<AssetsShell />);

    await openActions(user);
    await user.click(screen.getByRole("menuitem", { name: "Assign owner" }));

    expect(
      screen.getByRole("dialog", { name: "Assign Asset Owner" }),
    ).toHaveAttribute("open");
  });

  it("opens asset change history when permitted", async () => {
    const user = userEvent.setup();
    render(<AssetsShell />);

    await openActions(user);
    await user.click(screen.getByRole("menuitem", { name: "Change history" }));

    expect(screen.getByRole("dialog", { name: "Asset Change History" })).toHaveAttribute("open");
  });

  it("shows only permitted actions after opening the menu", async () => {
    useSessionUserMock.mockReturnValue({
      isPending: false,
      data: { permissions: ["assets.read"] },
    });
    const user = userEvent.setup();
    render(<AssetsShell />);

    await openActions(user);
    expect(screen.getByRole("menuitem", { name: "View details" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Delete" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Classify criticality" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Assign owner" })).not.toBeInTheDocument();
  });
});
