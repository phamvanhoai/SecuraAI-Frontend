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
const mocks = vi.hoisted(() => ({ mutate: vi.fn(), success: vi.fn() }));
vi.mock("../hooks/use-create-business-service", () => ({
  useCreateBusinessService: () => ({ isPending: false }),
  useBusinessServiceOwners: () => ({ data: { items: [] } }),
}));
vi.mock("../hooks/use-update-business-service", () => ({
  useUpdateBusinessService: () => ({
    mutateAsync: mocks.mutate,
    isPending: false,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
}));
import { CreateBusinessServiceDialog } from "./create-business-service-dialog";
const id = "00000000-0000-4000-8000-000000000001";
const service = {
  id,
  name: "Support",
  description: "Business service operational purpose",
  status: "active" as const,
  owner: {
    id,
    fullName: "Former owner",
    email: "former.owner@example.test",
    inactive: true,
  },
  linkedAssetsCount: 3,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-07T00:00:00.000Z",
};
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
describe("Edit service metadata form", () => {
  beforeEach(() => vi.clearAllMocks());
  it.each([
    ["Service name (required)", 100],
    ["Description (optional)", 2000],
  ] as const)("preserves overlong %s and blocks saving until corrected", async (label, maximum) => {
    const user = userEvent.setup();
    render(<CreateBusinessServiceDialog editingService={service} onCreated={vi.fn()} />);
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
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(mocks.mutate).not.toHaveBeenCalled();
    await user.clear(field);
    await user.paste("A".repeat(maximum));
    await waitFor(() => expect(screen.queryByText(message)).not.toBeInTheDocument());
    mocks.mutate.mockResolvedValue({ id, name: "Saved service" });
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledOnce());
  });
  it("loads metadata and keeps inactive owner without silently unassigning", async () => {
    mocks.mutate.mockResolvedValue(service);
    render(
      <CreateBusinessServiceDialog
        editingService={service}
        onCreated={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Service name (required)")).toHaveValue(
      "Support",
    );
    expect(screen.getByText(/Inactive — retained/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await userEvent.type(
      screen.getByLabelText("Description (optional)"),
      " updated",
    );
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(mocks.mutate).toHaveBeenCalledWith({
      name: "Support",
      description: "Business service operational purpose updated",
      ownerUserId: id,
      expectedUpdatedAt: service.updatedAt,
    });
  });
  it("freezes loaded version despite background refresh; stale blocks further saves", async () => {
    mocks.mutate.mockRejectedValue(
      new ApiError("Stale", 409, "CONFLICT", {
        error: { code: "BUSINESS_SERVICE_STALE" },
      }),
    );
    const { rerender } = render(
      <CreateBusinessServiceDialog
        editingService={service}
        onCreated={vi.fn()}
      />,
    );
    await userEvent.type(
      screen.getByLabelText("Service name (required)"),
      " Edited",
    );
    rerender(
      <CreateBusinessServiceDialog
        editingService={{ ...service, updatedAt: "2026-10-08T00:00:00.000Z" }}
        onCreated={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(mocks.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ expectedUpdatedAt: service.updatedAt }),
    );
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    expect(screen.getByText(/Close Edit and reopen/)).toBeInTheDocument();
  });
  it("unassigns only after explicit choice and allows description clearing", async () => {
    mocks.mutate.mockResolvedValue(service);
    render(
      <CreateBusinessServiceDialog
        editingService={service}
        onCreated={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Unassigned" }));
    await userEvent.clear(screen.getByLabelText("Description (optional)"));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(mocks.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ ownerUserId: null, description: "" }),
    );
  });
});
