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
  mutateAsync: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
  pending: false,
}));
vi.mock("../hooks/use-account-lock", () => ({
  useAccountLock: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: mocks.pending,
  }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success, info: mocks.info }),
}));
import { AccountLockDialog } from "./account-lock-dialog";

const user = {
  id: "00000000-0000-4000-8000-000000000002",
  fullName: "Employee Test",
  email: "employee@example.test",
  employeeCode: "EMP-001",
  status: "active" as const,
  roles: [],
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
      this.dispatchEvent(new Event("close"));
    },
  });
});
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  mocks.pending = false;
  mocks.mutateAsync.mockResolvedValue({ changed: true });
});

describe("AccountLockDialog", () => {
  it("requires a valid reason before posting", async () => {
    const actor = userEvent.setup();
    const onClose = vi.fn();
    render(
      <AccountLockDialog
        selection={{ user, action: "lock" }}
        onClose={onClose}
      />,
    );
    await actor.click(screen.getByRole("button", { name: "Lock account" }));
    expect(
      await screen.findByText(/at least 10 characters/),
    ).toBeInTheDocument();
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
    await actor.type(
      screen.getByLabelText("Reason (required)"),
      "  Security investigation  ",
    );
    await actor.click(screen.getByRole("button", { name: "Lock account" }));
    await waitFor(() =>
      expect(mocks.mutateAsync).toHaveBeenCalledWith({
        userId: user.id,
        action: "lock",
        input: { reason: "Security investigation" },
      }),
    );
    expect(onClose).toHaveBeenCalledOnce();
    expect(mocks.success).toHaveBeenCalledOnce();
  });

  it("handles unchanged backend status when unlocking", async () => {
    mocks.mutateAsync.mockResolvedValue({ changed: false });
    const actor = userEvent.setup();
    render(
      <AccountLockDialog
        selection={{ user: { ...user, status: "locked" }, action: "unlock" }}
        onClose={vi.fn()}
      />,
    );
    await actor.type(
      screen.getByLabelText("Reason (required)"),
      "Investigation completed",
    );
    await actor.click(screen.getByRole("button", { name: "Unlock account" }));
    await waitFor(() =>
      expect(mocks.info).toHaveBeenCalledWith(
        "Account already unlocked",
        expect.any(String),
      ),
    );
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it("keeps the reason and dialog open when the backend rejects the last manager", async () => {
    mocks.mutateAsync.mockRejectedValue(
      new ApiError("Internal response", 409, "CONFLICT", {
        error: { code: "LAST_ACCOUNT_MANAGER" },
      }),
    );
    const actor = userEvent.setup();
    const onClose = vi.fn();
    render(
      <AccountLockDialog
        selection={{ user, action: "lock" }}
        onClose={onClose}
      />,
    );
    await actor.type(
      screen.getByLabelText("Reason (required)"),
      "Security investigation",
    );
    await actor.click(screen.getByRole("button", { name: "Lock account" }));
    expect(
      await screen.findByText(/last active administrator/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Reason (required)")).toHaveValue(
      "Security investigation",
    );
    expect(onClose).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
  });

  it("blocks duplicate submission, Cancel and Escape while pending", () => {
    mocks.pending = true;
    const onClose = vi.fn();
    render(
      <AccountLockDialog
        selection={{ user, action: "lock" }}
        onClose={onClose}
      />,
    );
    expect(screen.getByRole("button", { name: "Locking…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    screen
      .getByRole("dialog")
      .dispatchEvent(new Event("cancel", { cancelable: true, bubbles: true }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
