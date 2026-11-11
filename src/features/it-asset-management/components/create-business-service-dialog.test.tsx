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
import { ApiError } from "@/lib/api/api-error";
const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  reset: vi.fn(),
  owners: vi.fn(),
  success: vi.fn(),
  pending: false,
}));
vi.mock("../hooks/use-create-business-service", () => ({
  useCreateBusinessService: () => ({
    mutateAsync: mocks.mutate,
    reset: mocks.reset,
    isPending: mocks.pending,
  }),
  useBusinessServiceOwners: mocks.owners,
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
}));
import { CreateBusinessServiceDialog } from "./create-business-service-dialog";
vi.mock("../hooks/use-update-business-service", () => ({
  useUpdateBusinessService: () => ({ isPending: false }),
}));
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
    },
  });
});
afterEach(cleanup);
describe("Create Business Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pending = false;
    mocks.owners.mockReturnValue({
      data: {
        items: [
          {
            id,
            fullName: "Employee Owner",
            email: "employee.owner@example.test",
            role: "EMPLOYEE",
          },
        ],
      },
    });
  });
  const open = async () =>
    userEvent.click(
      screen.getByRole("button", { name: "Create business service" }),
    );
  it.each([
    ["Service name (required)", 100],
    ["Description (optional)", 2000],
  ] as const)("preserves overlong %s and blocks saving until corrected", async (label, maximum) => {
    const user = userEvent.setup();
    render(<CreateBusinessServiceDialog onCreated={vi.fn()} />);
    await open();
    const field = screen.getByLabelText(label);
    if (label !== "Service name (required)") {
      await user.clear(screen.getByLabelText("Service name (required)"));
      await user.type(screen.getByLabelText("Service name (required)"), "Updated support service");
    }
    await user.clear(field);
    await user.click(field);
    await user.paste("A".repeat(maximum + 1));
    expect(field).toHaveValue("A".repeat(maximum + 1));
    const message = `Use at most ${maximum.toLocaleString("en-US")} characters.`;
    expect(await screen.findByText(message)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Create service" }));
    expect(mocks.mutate).not.toHaveBeenCalled();
    await user.clear(field);
    await user.paste("A".repeat(maximum));
    await waitFor(() => expect(screen.queryByText(message)).not.toBeInTheDocument());
    mocks.mutate.mockResolvedValue({ id, name: "Saved service" });
    await user.click(screen.getByRole("button", { name: "Create service" }));
    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledOnce());
  });
  it("requires name with inline validation and no API call", async () => {
    render(<CreateBusinessServiceDialog onCreated={vi.fn()} />);
    await open();
    await userEvent.click(
      screen.getByRole("button", { name: "Create service" }),
    );
    expect(screen.getByText("Enter at least 3 characters.")).toBeInTheDocument();
    expect(mocks.mutate).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Service name (required)")).toHaveFocus();
  });
  it("creates with normalized name and unassigned owner then confirms success", async () => {
    mocks.mutate.mockResolvedValue({ id, name: "Support Service" });
    const onCreated = vi.fn();
    render(<CreateBusinessServiceDialog onCreated={onCreated} />);
    await open();
    await userEvent.type(
      screen.getByLabelText("Service name (required)"),
      " Support  Service ",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Create service" }),
    );
    expect(mocks.mutate).toHaveBeenCalledWith({
      name: "Support Service",
      description: "",
      ownerUserId: null,
    });
    expect(onCreated).toHaveBeenCalled();
    expect(mocks.success).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("selects an explicit owner; searching does not silently replace it", async () => {
    mocks.mutate.mockResolvedValue({ id, name: "Support" });
    render(<CreateBusinessServiceDialog onCreated={vi.fn()} />);
    await open();
    expect(
      screen.getByText(/employee\.owner@example\.test/),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("radio", { name: /Employee Owner/ }),
    );
    await userEvent.type(
      screen.getByLabelText("Find responsible owner (optional)"),
      "Other",
    );
    await userEvent.type(
      screen.getByLabelText("Service name (required)"),
      "Support",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Create service" }),
    );
    expect(mocks.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ ownerUserId: id }),
    );
  });
  it("retains fields and shows duplicate error next to name", async () => {
    mocks.mutate.mockRejectedValue(new ApiError("Duplicate", 409, "CONFLICT"));
    render(<CreateBusinessServiceDialog onCreated={vi.fn()} />);
    await open();
    await userEvent.type(
      screen.getByLabelText("Service name (required)"),
      "Support",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Create service" }),
    );
    expect(
      screen.getByText(
        "This service name already exists. Use a different name.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Service name (required)")).toHaveValue(
      "Support",
    );
  });
  it("guards dirty cancel with discard confirmation", async () => {
    render(<CreateBusinessServiceDialog onCreated={vi.fn()} />);
    await open();
    await userEvent.type(
      screen.getByLabelText("Service name (required)"),
      "Support",
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.getByRole("button", { name: "Keep editing" }),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Discard changes" }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
  it("keeps creation available when optional owner lookup fails", async () => {
    mocks.owners.mockReturnValue({ isError: true });
    render(<CreateBusinessServiceDialog onCreated={vi.fn()} />);
    await open();
    expect(
      screen.getByRole("button", { name: "Create service" }),
    ).toBeEnabled();
    expect(screen.getByText(/Unable to load owners/)).toBeInTheDocument();
  });
});
