"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/api-error";
import {
  confirmPasswordReset,
  requestPasswordReset,
  verifyPasswordResetCode,
} from "../api/password-reset";
import {
  confirmPasswordResetSchema,
  requestPasswordResetSchema,
  type ConfirmPasswordResetInput,
  type RequestPasswordResetInput,
} from "../schemas/password-reset-schema";

type Step = "email" | "otp" | "password" | "success";

function passwordResetError(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.status === 429)
    return "Too many attempts. Wait a few minutes before trying again.";
  if (error.status === 503)
    return "The password reset service is temporarily unavailable. Please try again later.";
  if (error.status === 400)
    return "The reset code is invalid, expired, or already used. Request a new code and try again.";
  return error.message;
}

const STEPS: Step[] = ["email", "otp", "password", "success"];
const RESEND_COOLDOWN_SECONDS = 60;

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "your email";
  return `${localPart.slice(0, 1)}${"*".repeat(Math.min(Math.max(localPart.length - 1, 3), 8))}@${domain}`;
}

export function RecoveryCard({ step }: { step: Step }) {
  const router = useRouter();
  const toast = useToast();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") ?? "";
  const emailFromUrl = searchParams.get("email") ?? "";
  const [otp, setOtp] = useState(
    tokenFromUrl.padEnd(6, " ").slice(0, 6).split(""),
  );
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(
    step === "otp" ? RESEND_COOLDOWN_SECONDS : 0,
  );
  const currentStepIndex = STEPS.indexOf(step);
  const content = {
    email: [
      "Forgot password",
      "Enter your email address to receive a password reset code.",
    ],
    otp: [
      "Verify OTP",
      "Enter the 6-digit verification code sent to your email.",
    ],
    password: [
      "Reset password",
      "Create a new password to finish the process.",
    ],
    success: [
      "Password reset complete",
      "Your password has been updated successfully.",
    ],
  } as const;
  const Icon =
    step === "success"
      ? Check
      : step === "email"
        ? Mail
        : step === "otp"
          ? ShieldCheck
          : KeyRound;

  useEffect(() => {
    if (step !== "otp" || resendCooldown <= 0) return;
    const timer = window.setTimeout(
      () => setResendCooldown((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [resendCooldown, step]);

  async function submitEmail(values: RequestPasswordResetInput): Promise<void> {
    setMessage(undefined);
    setPending(true);
    try {
      await requestPasswordReset(values);
      router.push(`/otp?email=${encodeURIComponent(values.email)}`);
    } catch (error: unknown) {
      setMessage(
        passwordResetError(error, "Unable to request a password reset."),
      );
    } finally {
      setPending(false);
    }
  }

  async function submitOtp(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const code = otp.join("").trim();
    if (!/^\d{6}$/.test(code)) {
      setMessage("Enter the 6-digit verification code.");
      return;
    }
    setMessage(undefined);
    setPending(true);
    try {
      await verifyPasswordResetCode({ token: code });
      router.push(`/reset-password?token=${code}`);
    } catch (error: unknown) {
      setMessage(
        passwordResetError(error, "Unable to verify the password reset code."),
      );
    } finally {
      setPending(false);
    }
  }

  async function resendOtp(): Promise<void> {
    if (resendPending || resendCooldown > 0) return;
    const parsed = requestPasswordResetSchema.safeParse({
      email: emailFromUrl,
    });
    if (!parsed.success) {
      setMessage("Return to the previous step and enter your email again.");
      return;
    }

    setMessage(undefined);
    setResendPending(true);
    try {
      await requestPasswordReset(parsed.data);
      setOtp(Array.from({ length: 6 }, () => ""));
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      toast.success(
        "New code sent",
        `Check ${maskEmail(parsed.data.email)} for the latest verification code.`,
      );
    } catch (error: unknown) {
      setMessage(
        passwordResetError(error, "Unable to resend the verification code."),
      );
    } finally {
      setResendPending(false);
    }
  }

  async function submitPassword(
    values: ConfirmPasswordResetInput,
  ): Promise<void> {
    setMessage(undefined);
    setPending(true);
    try {
      await confirmPasswordReset(values);
      router.push("/reset-password-success");
    } catch (error: unknown) {
      setMessage(passwordResetError(error, "Unable to reset the password."));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="w-full max-w-[30rem]">
      {/* Back link */}
      <Link
        href={step === "email" ? "/login" : "/forgot-password"}
        className="text-muted hover:text-foreground focus-visible:outline-brand mb-5 inline-flex min-h-10 items-center gap-1.5 rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={1.8} />
        {step === "email" ? "Back to sign in" : "Back"}
      </Link>

      <div className="border-border bg-surface overflow-hidden rounded-xl border">
        {/* Top accent bar */}
        <div
          className={`h-1 w-full ${step === "success" ? "bg-success" : "bg-brand"}`}
          aria-hidden="true"
        />

        <div className="p-6 sm:p-8">
          {/* Step progress */}
          {step !== "success" ? (
            <div className="mb-6 flex items-center gap-1.5" aria-hidden="true">
              {STEPS.slice(0, 3).map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= currentStepIndex ? "bg-brand" : "bg-neutral-soft"
                  }`}
                />
              ))}
            </div>
          ) : null}

          {/* Header */}
          <div className="mb-6 text-center">
            <span
              className={`mx-auto mb-4 grid size-14 place-items-center rounded-2xl border ${
                step === "success"
                  ? "bg-success-soft border-success/15 text-success"
                  : "bg-brand-soft border-brand/12 text-brand"
              }`}
            >
              <Icon aria-hidden="true" className="size-7" strokeWidth={1.6} />
            </span>
            <h1 className="text-[1.375rem] font-semibold tracking-[-0.03em]">
              {content[step][0]}
            </h1>
            <p className="text-muted mx-auto mt-1.5 max-w-xs text-sm leading-6">
              {content[step][1]}
            </p>
          </div>

          {/* Error alert */}
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger mt-5">
              {message}
            </Alert>
          ) : null}

          {/* Step content */}
          {step === "email" ? (
            <EmailForm pending={pending} onSubmit={submitEmail} />
          ) : null}
          {step === "otp" ? (
            <OtpForm
              otp={otp}
              email={emailFromUrl}
              resendCooldown={resendCooldown}
              resendPending={resendPending}
              verifyPending={pending}
              setOtp={setOtp}
              onResend={resendOtp}
              onSubmit={submitOtp}
            />
          ) : null}
          {step === "password" ? (
            <PasswordForm
              token={tokenFromUrl}
              pending={pending}
              onSubmit={submitPassword}
            />
          ) : null}
          {step === "success" ? (
            <div className="space-y-4">
              <div className="bg-success-soft text-success rounded-lg p-4 text-center text-sm">
                Your account is now secure. You can sign in with your new
                password.
              </div>
              <Link
                href="/login"
                className="bg-brand text-brand-contrast focus-visible:outline-brand grid min-h-11 place-items-center rounded-lg text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Sign in
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function EmailForm({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (values: RequestPasswordResetInput) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
  });
  return (
    <form
      className="mt-6 space-y-4"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <label className="block text-sm font-medium">
        Email
        <Input
          className="mt-2"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "recovery-email-error" : undefined}
          type="email"
          autoComplete="email"
          inputMode="email"
          {...register("email")}
        />
        {errors.email ? (
          <span
            id="recovery-email-error"
            className="text-danger mt-1 block text-sm"
            role="alert"
          >
            {errors.email.message}
          </span>
        ) : null}
      </label>
      <Button className="mt-2 w-full" disabled={pending} type="submit">
        {pending ? (
          <>
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
            Sending…
          </>
        ) : (
          "Send reset code"
        )}
      </Button>
    </form>
  );
}

function OtpForm({
  otp,
  email,
  resendCooldown,
  resendPending,
  verifyPending,
  setOtp,
  onResend,
  onSubmit,
}: {
  otp: string[];
  email: string;
  resendCooldown: number;
  resendPending: boolean;
  verifyPending: boolean;
  setOtp: (value: string[]) => void;
  onResend: () => Promise<void>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  function updateDigit(index: number, value: string): void {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = otp.map((item, itemIndex) =>
      itemIndex === index ? digit : item,
    );
    setOtp(next);
    if (digit && index < next.length - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ): void {
    if (event.key === "Backspace" && !otp[index] && index > 0)
      inputRefs.current[index - 1]?.focus();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>): void {
    const digits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!digits) return;
    event.preventDefault();
    const next = Array.from({ length: 6 }, (_, index) => digits[index] ?? "");
    setOtp(next);
    inputRefs.current[Math.min(digits.length, 6) - 1]?.focus();
  }

  return (
    <form className="mt-5" onSubmit={onSubmit}>
      <div className="grid grid-cols-6 gap-2 sm:gap-3">
        {otp.map((value, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            aria-label={`OTP digit ${index + 1}`}
            className={`border-border focus:border-brand focus:ring-brand/15 h-13 min-w-0 rounded-lg border text-center text-xl font-semibold transition-colors outline-none focus:ring-3 ${
              value.trim()
                ? "bg-brand-soft text-brand border-brand/30"
                : "bg-surface"
            }`}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={value.trim()}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
          />
        ))}
      </div>
      <Button className="mt-5 w-full" disabled={verifyPending} type="submit">
        {verifyPending ? (
          <>
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
            Verifying code…
          </>
        ) : (
          "Verify and continue"
        )}
      </Button>
      <div className="border-border mt-5 border-t pt-5 text-center">
        <p className="text-muted text-sm">
          Didn&apos;t receive the code{email ? ` at ${maskEmail(email)}` : ""}?
        </p>
        <Button
          className="mt-3 w-full sm:w-auto"
          disabled={
            resendPending || verifyPending || resendCooldown > 0 || !email
          }
          type="button"
          variant="secondary"
          onClick={() => void onResend()}
        >
          {resendPending ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                className="size-4 animate-spin motion-reduce:animate-none"
              />
              Sending new code…
            </>
          ) : resendCooldown > 0 ? (
            `Resend code in 00:${String(resendCooldown).padStart(2, "0")}`
          ) : (
            "Resend code"
          )}
        </Button>
        {!email ? (
          <p className="text-warning mt-2 text-xs" role="status">
            Return to the previous step to enter your email again.
          </p>
        ) : null}
      </div>
    </form>
  );
}

function PasswordForm({
  token,
  pending,
  onSubmit,
}: {
  token: string;
  pending: boolean;
  onSubmit: (values: ConfirmPasswordResetInput) => Promise<void>;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfirmPasswordResetInput>({
    resolver: zodResolver(confirmPasswordResetSchema),
    defaultValues: { token, newPassword: "", confirmPassword: "" },
    mode: "onBlur",
    reValidateMode: "onChange",
  });
  return (
    <form
      autoComplete="off"
      className="mt-6 space-y-4"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <input type="hidden" {...register("token")} />
      {errors.token ? (
        <Alert className="border-danger/25 bg-danger-soft text-danger">
          {errors.token.message} Request a new code to continue.
        </Alert>
      ) : null}
      <div>
        <label className="block text-sm font-medium" htmlFor="new-password">
          New password
        </label>
        <div className="relative mt-2">
          <Input
            id="new-password"
            className="pr-12"
            type={showPassword ? "text" : "password"}
            autoComplete="off"
            data-1p-ignore="true"
            data-lpignore="true"
            aria-invalid={Boolean(errors.newPassword)}
            aria-describedby={
              errors.newPassword ? "new-password-error" : "new-password-help"
            }
            {...register("newPassword")}
          />
          <button
            aria-label={
              showPassword ? "Hide new password" : "Show new password"
            }
            aria-pressed={showPassword}
            className="text-muted hover:text-foreground absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-lg"
            type="button"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="size-5" />
            ) : (
              <Eye aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
        {errors.newPassword ? (
          <span
            id="new-password-error"
            className="text-danger mt-1 block text-sm"
            role="alert"
          >
            {errors.newPassword.message}
          </span>
        ) : (
          <span
            id="new-password-help"
            className="text-muted mt-1 block text-sm"
          >
            Use 8–128 characters with at least one uppercase letter and one
            special character.
          </span>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="confirm-password">
          Confirm new password
        </label>
        <div className="relative mt-2">
          <Input
            id="confirm-password"
            className="pr-12"
            type={showConfirmation ? "text" : "password"}
            autoComplete="off"
            data-1p-ignore="true"
            data-lpignore="true"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword ? "confirm-password-error" : undefined
            }
            {...register("confirmPassword")}
          />
          <button
            aria-label={
              showConfirmation
                ? "Hide password confirmation"
                : "Show password confirmation"
            }
            aria-pressed={showConfirmation}
            className="text-muted hover:text-foreground absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-lg"
            type="button"
            onClick={() => setShowConfirmation((value) => !value)}
          >
            {showConfirmation ? (
              <EyeOff aria-hidden="true" className="size-5" />
            ) : (
              <Eye aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
        {errors.confirmPassword ? (
          <span
            id="confirm-password-error"
            className="text-danger mt-1 block text-sm"
            role="alert"
          >
            {errors.confirmPassword.message}
          </span>
        ) : null}
      </div>
      <Button className="mt-2 w-full" disabled={pending} type="submit">
        {pending ? (
          <>
            <LoaderCircle
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
            Resetting…
          </>
        ) : (
          "Reset password"
        )}
      </Button>
    </form>
  );
}
