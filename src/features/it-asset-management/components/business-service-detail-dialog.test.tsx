import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { ApiError } from "@/lib/api/api-error";
const mocks = vi.hoisted(() => ({
  detail: vi.fn(),
  assets: vi.fn(),
  refetch: vi.fn(),
}));
vi.mock("../hooks/use-business-services", () => ({
  useBusinessService: mocks.detail,
  useBusinessServiceAssets: mocks.assets,
}));
import { BusinessServiceDetailDialog } from "./business-service-detail-dialog";
const id = "00000000-0000-4000-8000-000000000001";
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
describe("Business service detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.detail.mockReturnValue({
      isSuccess: true,
      data: {
        name: "Support",
        description: "Customer service",
        status: "inactive",
        owner: null,
        linkedAssetsCount: 1,
        createdAt: "2026-10-01T00:00:00Z",
        updatedAt: "2026-10-02T00:00:00Z",
      },
    });
    mocks.assets.mockReturnValue({
      data: {
        items: [
          {
            id,
            assetCode: "AST-1",
            name: "Database",
            assetType: "DATABASE",
            status: "archived",
          },
        ],
        pagination: { page: 1, limit: 10, total: 11, totalPages: 2 },
      },
    });
  });
  it("shows metadata and archived links without changing risk scope", async () => {
    const onClose = vi.fn();
    render(
      <BusinessServiceDetailDialog serviceId={id} enabled onClose={onClose} />,
    );
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
    expect(screen.getByText("Archived")).toBeInTheDocument();
    expect(screen.getByText("01/10/2026, 07:00")).toBeInTheDocument();
    expect(
      screen.getByText(/does not update any existing Risk scope/),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(mocks.assets).toHaveBeenLastCalledWith(id, 2, true);
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });
  it("does not load links before detail is authorized", () => {
    mocks.detail.mockReturnValue({
      isError: true,
      error: new ApiError("Missing", 404, "NOT_FOUND"),
    });
    render(
      <BusinessServiceDetailDialog serviceId={id} enabled onClose={vi.fn()} />,
    );
    expect(screen.getByText("Business service not found")).toBeInTheDocument();
    expect(mocks.assets).toHaveBeenCalledWith(id, 1, false);
  });
  it("supports link loading, error and empty independently of detail", () => {
    mocks.assets.mockReturnValue({ isPending: true });
    const { rerender } = render(
      <BusinessServiceDetailDialog serviceId={id} enabled onClose={vi.fn()} />,
    );
    expect(screen.getByText("Customer service")).toBeInTheDocument();
    mocks.assets.mockReturnValue({
      isError: true,
      error: new Error(),
      refetch: mocks.refetch,
    });
    rerender(
      <BusinessServiceDetailDialog serviceId={id} enabled onClose={vi.fn()} />,
    );
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
    mocks.assets.mockReturnValue({
      data: { items: [], pagination: { page: 1, totalPages: 0 } },
    });
    rerender(
      <BusinessServiceDetailDialog serviceId={id} enabled onClose={vi.fn()} />,
    );
    expect(
      screen.getByText("No linked assets on this page"),
    ).toBeInTheDocument();
  });
});
