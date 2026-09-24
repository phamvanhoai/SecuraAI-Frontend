import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  replace: vi.fn(),
  success: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success }),
}));

vi.mock("../hooks/use-change-password", () => ({
  useChangePassword: () => ({
    mutateAsync: mocks.mutateAsync,
    isPending: false,
  }),
}));
vi.mock("../hooks/use-session-user", () => ({
  useSessionUser: () => ({ data: { mustChangePassword: false } }),
}));

import { ChangePasswordForm } from "./change-password-form";

describe("ChangePasswordForm", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("exposes labeled fields without generated-password suggestions and shows the backend policy", () => {
    render(<ChangePasswordForm />);

    expect(screen.getByLabelText("Current password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    expect(screen.getByLabelText("New password")).toHaveAttribute(
      "autocomplete",
      "off",
    );
    expect(screen.getByLabelText("Confirm new password")).toHaveAttribute(
      "autocomplete",
      "off",
    );
    expect(
      screen.getByText(
        /at least one uppercase letter and one special character/i,
      ),
    ).toBeInTheDocument();
  });

  it("shows success feedback and returns to the dashboard after changing the password", async () => {
    const user = userEvent.setup();
    mocks.mutateAsync.mockResolvedValue(undefined);
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText("Current password"), "OldPassword1!");
    await user.type(screen.getByLabelText("New password"), "NewPassword2@");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "NewPassword2@",
    );
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(mocks.success).toHaveBeenCalledWith(
      "Password changed successfully",
      "Please sign out and sign in again with your new password.",
    );
    expect(mocks.replace).toHaveBeenCalledWith("/dashboard");
  });

  it("shows field-level errors and does not submit an invalid password", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);

    await user.type(screen.getByLabelText("Current password"), "OldPassword1!");
    await user.type(screen.getByLabelText("New password"), "weakpass");
    await user.type(screen.getByLabelText("Confirm new password"), "different");
    await user.click(screen.getByRole("button", { name: "Change password" }));

    expect(
      await screen.findAllByText(
        "Password must contain at least one uppercase letter.",
      ),
    ).toHaveLength(2);
    expect(mocks.mutateAsync).not.toHaveBeenCalled();
  });

  it("reveals a password through an accessible toggle", async () => {
    const user = userEvent.setup();
    render(<ChangePasswordForm />);
    const currentPassword = screen.getByLabelText("Current password");

    const toggle = screen
      .getAllByRole("button", { name: "Show password" })
      .at(0);
    expect(toggle).toBeDefined();
    if (!toggle) return;
    await user.click(toggle);

    expect(currentPassword).toHaveAttribute("type", "text");
    expect(
      screen.getAllByRole("button", { name: "Hide password" }).at(0),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
