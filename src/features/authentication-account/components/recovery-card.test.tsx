import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/api-error";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  requestPasswordReset: vi.fn(),
  verifyPasswordResetCode: vi.fn(),
  confirmPasswordReset: vi.fn(),
  token: "",
  email: "",
  toastSuccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
  useSearchParams: () =>
    new URLSearchParams({
      ...(mocks.token ? { token: mocks.token } : {}),
      ...(mocks.email ? { email: mocks.email } : {}),
    }),
}));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.toastSuccess }),
}));
vi.mock("../api/password-reset", () => ({
  requestPasswordReset: mocks.requestPasswordReset,
  verifyPasswordResetCode: mocks.verifyPasswordResetCode,
  confirmPasswordReset: mocks.confirmPasswordReset,
}));

import { RecoveryCard } from "./recovery-card";

describe("RecoveryCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.token = "";
    mocks.email = "";
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

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
    mocks.verifyPasswordResetCode.mockResolvedValue({ message: "Valid" });
    render(<RecoveryCard step="otp" />);

    const firstDigit = screen.getByLabelText("OTP digit 1");
    await user.click(firstDigit);
    await user.paste("123456");
    await user.click(
      screen.getByRole("button", { name: "Verify and continue" }),
    );

    expect(mocks.push).toHaveBeenCalledWith("/reset-password?token=123456");
  });

  it("keeps a replaced reset code on the OTP step", async () => {
    const user = userEvent.setup();
    mocks.verifyPasswordResetCode.mockRejectedValue(
      new ApiError(
        "Password reset token is invalid or expired",
        400,
        "BAD_REQUEST",
      ),
    );
    render(<RecoveryCard step="otp" />);

    await user.click(screen.getByLabelText("OTP digit 1"));
    await user.paste("123456");
    await user.click(
      screen.getByRole("button", { name: "Verify and continue" }),
    );

    expect(
      await screen.findByText(/invalid, expired, or already used/i),
    ).toBeVisible();
    expect(mocks.push).not.toHaveBeenCalledWith("/reset-password?token=123456");
  });

  it("resends a reset code after the cooldown", async () => {
    vi.useFakeTimers();
    mocks.email = "user@example.com";
    mocks.requestPasswordReset.mockResolvedValue({ message: "Accepted" });
    render(<RecoveryCard step="otp" />);

    expect(
      screen.getByRole("button", { name: "Resend code in 00:60" }),
    ).toBeDisabled();

    for (let second = 0; second < 60; second += 1) {
      await act(() => vi.advanceTimersByTimeAsync(1000));
    }
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
    });

    expect(mocks.requestPasswordReset).toHaveBeenCalledWith({
      email: "user@example.com",
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith(
      "New code sent",
      "Check u***@example.com for the latest verification code.",
    );
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
