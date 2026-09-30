import { cleanup, render, screen, waitFor } from "@testing-library/react";
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

const { mutateAsyncMock, successMock, optionsMock } = vi.hoisted(() => ({
  mutateAsyncMock: vi.fn(),
  successMock: vi.fn(),
  optionsMock: vi.fn(),
}));
vi.mock("../hooks/use-create-asset", () => ({
  useCreateAsset: () => ({ mutateAsync: mutateAsyncMock, isPending: false }),
}));
vi.mock("../hooks/use-asset-create-options", () => ({
  useAssetCreateOptions: optionsMock,
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: successMock, error: vi.fn() }),
}));
import { CreateAssetDialog } from "./create-asset-dialog";

const ownerUserId = "00000000-0000-4000-8000-000000000020";
const serviceId = "00000000-0000-4000-8000-000000000030";
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
afterEach(cleanup);

describe("CreateAssetDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutateAsyncMock.mockResolvedValue({
      assetCode: "AST-002",
      name: "Application Server",
    });
    optionsMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        owners: [
          { id: ownerUserId, fullName: "Asset Owner", role: "EMPLOYEE" },
        ],
        businessServices: [{ id: serviceId, name: "Payment Service" }],
        assets: [],
        eventSources: [],
        departments: [],
        truncated: { departments: false, owners: false },
      },
    });
  });
  it("loads options only while open and validates required fields", async () => {
    const user = userEvent.setup();
    render(<CreateAssetDialog />);
    expect(optionsMock).toHaveBeenLastCalledWith(false);
    await user.click(screen.getByRole("button", { name: "Add asset" }));
    expect(optionsMock).toHaveBeenLastCalledWith(true);
    await user.clear(screen.getByLabelText("Asset code"));
    await user.click(screen.getByRole("button", { name: "Create asset" }));
    expect(
      await screen.findByText("Asset code is required"),
    ).toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });
  it("submits normalized business context", async () => {
    const user = userEvent.setup();
    render(<CreateAssetDialog />);
    await user.click(screen.getByRole("button", { name: "Add asset" }));
    await user.type(screen.getByLabelText("Asset code"), " ast-002 ");
    await user.type(
      screen.getByLabelText("Asset name"),
      " Application Server ",
    );
    await user.type(screen.getByLabelText("Asset type"), "server");
    await user.selectOptions(screen.getByLabelText("Asset owner"), ownerUserId);
    await user.selectOptions(
      screen.getByLabelText("Business service"),
      serviceId,
    );
    await user.click(screen.getByRole("button", { name: "Create asset" }));
    await waitFor(() =>
      expect(mutateAsyncMock).toHaveBeenCalledWith(
        expect.objectContaining({
          assetCode: "AST-002",
          name: "Application Server",
          ownerUserId,
          businessServiceId: serviceId,
          criticality: "medium",
          dataClassification: "internal",
          dependencies: [],
          eventSourceIds: [],
        }),
      ),
    );
    expect(successMock).toHaveBeenCalledWith(
      "Asset created",
      "AST-002 – Application Server",
    );
  });
  it("blocks submission when reference data cannot load", async () => {
    optionsMock.mockReturnValue({
      isPending: false,
      isError: true,
      data: undefined,
    });
    const user = userEvent.setup();
    render(<CreateAssetDialog />);
    await user.click(screen.getByRole("button", { name: "Add asset" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Unable to load reference data",
    );
    expect(screen.getByRole("button", { name: "Create asset" })).toBeDisabled();
  });
  it("uses the same wide, scrollable form size as Event & Log Sources", async () => {
    render(<CreateAssetDialog />);
    await userEvent.click(screen.getByRole("button", { name: "Add asset" }));
    expect(screen.getByRole("dialog")).toHaveClass("w-[min(42rem,calc(100%-2rem))]", "max-h-[90dvh]", "overflow-y-auto");
  });
  it("defers dependencies and event sources to the Links workflow", async () => {
    render(<CreateAssetDialog />);
    await userEvent.click(screen.getByRole("button", { name: "Add asset" }));
    expect(screen.queryByLabelText("Dependencies")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Related event sources")).not.toBeInTheDocument();
  });
});
