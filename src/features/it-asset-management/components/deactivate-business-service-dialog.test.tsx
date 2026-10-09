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
  check: vi.fn(),
  mutate: vi.fn(),
  success: vi.fn(),
  pending: false,
}));
vi.mock("../hooks/use-deactivate-business-service", () => ({
  useBusinessServiceDeactivationCheck: mocks.check,
  useDeactivateBusinessService: () => ({
    mutateAsync: mocks.mutate,
    isPending: mocks.pending,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
}));
import { DeactivateBusinessServiceDialog } from "./deactivate-business-service-dialog";
const id = "00000000-0000-4000-8000-000000000001";
const at = "2026-10-07T00:00:00.000Z";
const service = { id, name: "Support", status: "active", updatedAt: at };
const eligible = {
  service,
  activeAssetsCount: 0,
  unresolvedRisksCount: 0,
  canDeactivate: true,
};
beforeAll(() =>
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true,
    value(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    },
  }),
);
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.pending = false;
  mocks.check.mockReturnValue({ isFetchedAfterMount: true, data: eligible });
  mocks.mutate.mockResolvedValue({ ...service, status: "inactive" });
});
describe("Service Deactivate dialog", () => {
  it("waits for fresh check; no stale cached confirmation", () => {
    mocks.check.mockReturnValue({ isFetchedAfterMount: false, data: eligible });
    render(
      <DeactivateBusinessServiceDialog serviceId={id} onClose={vi.fn()} />,
    );
    expect(
      screen.queryByLabelText("Reason for deactivation (required)"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Deactivate service" }),
    ).not.toBeInTheDocument();
  });
  it.each([
    { ...eligible, activeAssetsCount: 1, canDeactivate: false },
    { ...eligible, unresolvedRisksCount: 1, canDeactivate: false },
    {
      ...eligible,
      service: { ...service, status: "inactive" },
      canDeactivate: false,
    },
  ])("blocks in-use/inactive and offers Close %j", (check) => {
    mocks.check.mockReturnValue({ isFetchedAfterMount: true, data: check });
    render(
      <DeactivateBusinessServiceDialog serviceId={id} onClose={vi.fn()} />,
    );
    expect(
      screen.queryByRole("button", { name: "Deactivate service" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(mocks.mutate).not.toHaveBeenCalled();
  });
  it("requires exact name and reason, uses frozen loaded version, then closes with toast", async () => {
    const close = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <DeactivateBusinessServiceDialog serviceId={id} onClose={close} />,
    );
    const submit = screen.getByRole("button", { name: "Deactivate service" });
    expect(submit).toBeDisabled();
    await user.type(
      screen.getByLabelText("Enter service name to confirm"),
      "support",
    );
    await user.type(
      screen.getByLabelText("Reason for deactivation (required)"),
      " Migrated to replacement service ",
    );
    expect(submit).toBeDisabled();
    await user.clear(screen.getByLabelText("Enter service name to confirm"));
    await user.type(
      screen.getByLabelText("Enter service name to confirm"),
      "Support",
    );
    mocks.check.mockReturnValue({
      isFetchedAfterMount: true,
      data: {
        ...eligible,
        service: { ...service, updatedAt: "2026-10-07T01:00:00Z" },
      },
    });
    rerender(
      <DeactivateBusinessServiceDialog serviceId={id} onClose={close} />,
    );
    await user.click(submit);
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(mocks.mutate).toHaveBeenCalledWith({
      expectedUpdatedAt: at,
      confirmationName: "Support",
      reason: "Migrated to replacement service",
    });
    expect(mocks.success).toHaveBeenCalledWith(
      "Business service deactivated",
      expect.any(String),
    );
  });
  it.each([
    "BUSINESS_SERVICE_STALE",
    "BUSINESS_SERVICE_IN_USE",
    "BUSINESS_SERVICE_INACTIVE",
  ])("preserves reason and blocks further submission on %s", async (code) => {
    mocks.mutate.mockRejectedValue(
      new ApiError("Conflict", 409, "UNKNOWN_ERROR", { error: { code } }),
    );
    render(
      <DeactivateBusinessServiceDialog serviceId={id} onClose={vi.fn()} />,
    );
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("Enter service name to confirm"),
      "Support",
    );
    await user.type(
      screen.getByLabelText("Reason for deactivation (required)"),
      "Retired service",
    );
    await user.click(
      screen.getByRole("button", { name: "Deactivate service" }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Deactivate service" }),
      ).toBeDisabled(),
    );
    expect(
      screen.getByLabelText("Reason for deactivation (required)"),
    ).toHaveValue("Retired service");
    expect(mocks.mutate).toHaveBeenCalledTimes(1);
  });
  it("confirms dirty Cancel instead of losing reason", async () => {
    const close = vi.fn();
    render(<DeactivateBusinessServiceDialog serviceId={id} onClose={close} />);
    const user = userEvent.setup();
    await user.type(
      screen.getByLabelText("Reason for deactivation (required)"),
      "Retired service",
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(close).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(
      screen.getByLabelText("Reason for deactivation (required)"),
    ).toHaveValue("Retired service");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(close).toHaveBeenCalled();
  });
  it("does not permit dismissal or submit while pending", async () => {
    mocks.pending = true;
    render(
      <DeactivateBusinessServiceDialog serviceId={id} onClose={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Deactivating…" }),
    ).toBeDisabled();
  });
});
