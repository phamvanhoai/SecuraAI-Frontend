import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
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
import { ImportAssetsDialog } from "./import-assets-dialog";

const mutateAsync = vi.fn();
const toastSuccess = vi.fn();

vi.mock("../hooks/use-import-assets", () => ({
  useImportAssets: () => ({ mutateAsync, isPending: false }),
}));

vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: toastSuccess }),
}));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
});

beforeEach(() => {
  mutateAsync.mockReset();
  toastSuccess.mockReset();
});

afterEach(cleanup);

describe("ImportAssetsDialog", () => {
  it("shows imported, duplicate, and invalid row counts after import", async () => {
    mutateAsync.mockResolvedValue({
      id: "00000000-0000-4000-8000-000000000001",
      importType: "assets",
      status: "completed",
      totalRows: 4,
      successRows: 2,
      failedRows: 2,
      summary: {
        totalRows: 4,
        importedRows: 2,
        duplicateRows: 1,
        invalidRows: 1,
        message:
          "Import completed: 2 assets imported, 1 duplicate skipped, 1 invalid row.",
      },
      errors: [
        {
          row: 3,
          code: "ASSET_CODE_EXISTS",
          message: "Asset code already exists.",
        },
      ],
      createdAt: "2026-09-14T00:00:00.000Z",
      completedAt: "2026-09-14T00:00:01.000Z",
    });

    const user = userEvent.setup();
    render(<ImportAssetsDialog />);
    await user.click(screen.getByRole("button", { name: "Import Excel" }));

    const file = new File(["content"], "assets.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    fireEvent.change(screen.getByLabelText("Asset Excel file"), {
      target: { files: [file] },
    });
    await user.click(screen.getByRole("button", { name: "Import assets" }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(file));
    expect(screen.getByText("Import summary")).toBeInTheDocument();
    expect(screen.getByText("Total rows").nextElementSibling).toHaveTextContent(
      "4",
    );
    expect(screen.getByText("Imported").nextElementSibling).toHaveTextContent(
      "2",
    );
    expect(screen.getByText("Duplicates").nextElementSibling).toHaveTextContent(
      "1",
    );
    expect(screen.getByText("Invalid").nextElementSibling).toHaveTextContent(
      "1",
    );
    expect(
      screen.getByText("Row 3: Asset code already exists."),
    ).toBeInTheDocument();
    expect(toastSuccess).toHaveBeenCalledWith(
      "Import completed",
      "Import completed: 2 assets imported, 1 duplicate skipped, 1 invalid row.",
    );
    expect(
      screen.queryByRole("button", { name: "Import assets" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
  });
});
