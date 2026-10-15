import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  requestPasswordReset: vi.fn(),
  confirmPasswordReset: vi.fn(),
  token: "",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () =>
    new URLSearchParams(mocks.token ? { token: mocks.token } : undefined),
}));
vi.mock("../api/password-reset", () => ({
  requestPasswordReset: mocks.requestPasswordReset,
  confirmPasswordReset: mocks.confirmPasswordReset,
}));

import { RecoveryCard } from "./recovery-card";

describe("RecoveryCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.token = "";
  });
  afterEach(cleanup);

  it("normalizes an email before continuing to OTP verification", async () => {
    const user = userEvent.setup();
    mocks.requestPasswordReset.mockResolvedValue({ message: "Accepted" });
    render(<RecoveryCard step="email" />);

    await user.type(screen.getByLabelText("Email"), "  User@Example.COM ");
    await user.click(screen.getByRole("button", { name: "Send reset code" }));

    await waitFor(() =>
      expect(mocks.requestPasswordReset).toHaveBeenCalledWith({
        email: "user@example.com",
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith("/otp?email=user%40example.com");
  });

  it("accepts a pasted six-digit reset code", async () => {
    const user = userEvent.setup();
    render(<RecoveryCard step="otp" />);

    const firstDigit = screen.getByLabelText("OTP digit 1");
    await user.click(firstDigit);
    await user.paste("123456");
    await user.click(
      screen.getByRole("button", { name: "Verify and continue" }),
    );

    expect(mocks.push).toHaveBeenCalledWith("/reset-password?token=123456");
  });

  it("shows a recoverable error when the reset URL has no code", async () => {
    const user = userEvent.setup();
    render(<RecoveryCard step="password" />);

    await user.type(screen.getByLabelText("New password"), "NewPassword2@");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "NewPassword2@",
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(
      await screen.findByText(/request a new code to continue/i),
    ).toBeInTheDocument();
    expect(mocks.confirmPasswordReset).not.toHaveBeenCalled();
  });

  it("submits the exact V2 confirmation contract", async () => {
    const user = userEvent.setup();
    mocks.token = "123456";
    mocks.confirmPasswordReset.mockResolvedValue({ message: "Reset" });
    render(<RecoveryCard step="password" />);

    expect(screen.getByLabelText("New password")).toHaveAttribute(
      "autocomplete",
      "off",
    );
    await user.type(screen.getByLabelText("New password"), "NewPassword2@");
    await user.type(
      screen.getByLabelText("Confirm new password"),
      "NewPassword2@",
    );
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() =>
      expect(mocks.confirmPasswordReset).toHaveBeenCalledWith({
        token: "123456",
        newPassword: "NewPassword2@",
        confirmPassword: "NewPassword2@",
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith("/reset-password-success");
  });
});
