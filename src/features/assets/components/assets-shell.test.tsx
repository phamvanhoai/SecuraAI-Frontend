import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { pushMock, useAssetsMock, createMutationMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  useAssetsMock: vi.fn(),
  createMutationMock: { mutateAsync: vi.fn(), isPending: false },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("../hooks/use-assets", () => ({ useAssets: useAssetsMock }));
vi.mock("../hooks/use-create-asset", () => ({
  useCreateAsset: () => createMutationMock,
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}));

import { AssetsShell } from "./assets-shell";

afterEach(cleanup);

describe("AssetsShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(screen.getAllByText("Chưa gán")).toHaveLength(2);
    expect(screen.getByText("1 tài sản phù hợp")).toBeInTheDocument();
  });

  it("writes search and filters to the URL", async () => {
    const user = userEvent.setup();
    render(<AssetsShell />);
    const filters = within(
      screen.getByRole("form", { name: "Bộ lọc tài sản" }),
    );
    await user.type(
      filters.getByPlaceholderText("Tên, mã, hostname hoặc vị trí"),
      "database",
    );
    await user.selectOptions(
      filters.getByLabelText("Mức quan trọng"),
      "critical",
    );
    await user.selectOptions(filters.getByLabelText("Trạng thái"), "active");
    await user.click(filters.getByRole("button", { name: "Lọc" }));

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
      "Không thể tải danh sách tài sản",
    );
    expect(screen.queryByText("Database Server")).not.toBeInTheDocument();
  });
});
