"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login, verifyMfaChallenge } from "../api/login";
import { requestMfaRecovery } from "../api/mfa-recovery";
import { loginSchema, type LoginInput } from "../schemas/login-schema";
import { OtpCodeInput } from "./otp-code-input";
import {
  canAccessPanel,
  defaultPanelPath,
  panelFromPath,
} from "@/config/navigation";

export function LoginForm({
  returnUrl = "/dashboard",
}: {
  returnUrl?: string;
}) {
  const [message, setMessage] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaPending, setMfaPending] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [recoveryRequested, setRecoveryRequested] = useState(false);
  const [recoveryPending, setRecoveryPending] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setMessage(undefined);
    try {
      const result = await login(values);
      if ("mfaRequired" in result) {
        setMfaRequired(true);
        return;
      }
      await finishLogin();
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to sign in. Please try again.",
      );
    }
  }

  async function finishLogin(): Promise<void> {
    const response = await fetch("/api/auth/session", { cache: "no-store" });
    if (!response.ok)
      throw new Error("Unable to verify your session. Please try again.");
    const payload = (await response.json().catch(() => undefined)) as
      { data?: { user?: { roles?: Array<{ code: string }> } } } | undefined;
    const roles = payload?.data?.user?.roles ?? [];
    const roleCodes = roles.map((role) => role.code);
    const defaultPanel = defaultPanelPath(roleCodes);
    const requestedPanel = panelFromPath(returnUrl);
    const destination =
      returnUrl === "/dashboard" ||
      (requestedPanel !== null && !canAccessPanel(roleCodes, requestedPanel))
        ? defaultPanel
        : returnUrl;
    window.location.assign(destination);
  }

  async function submitMfa(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setMessage(undefined);
    if (!/^(?:\d{6}|[A-Za-z0-9]{4}(?:-[A-Za-z0-9]{4}){2})$/.test(mfaCode)) {
      setMessage("Enter a 6-digit authentication code or recovery code.");
      return;
    }
    setMfaPending(true);
    try {
      await verifyMfaChallenge(mfaCode);
      await finishLogin();
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to verify your identity.",
      );
    } finally {
      setMfaPending(false);
    }
  }

  if (mfaRequired) {
    if (recoveryRequested) {
      return (
        <div className="space-y-5 text-center" role="status">
          <span className="bg-brand-soft text-brand mx-auto grid size-14 place-items-center rounded-full">
            <ShieldCheck
              className="size-7"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </span>
          <div>
            <h3 className="text-xl font-semibold">Recovery request sent</h3>
            <p className="text-muted mt-2 text-sm leading-6">
              An administrator will verify your request. You will receive an
              email after it is approved or rejected.
            </p>
          </div>
          <Alert>
            For your security, this verification session can no longer be used.
          </Alert>
          <Button
            className="w-full"
            type="button"
            onClick={() => {
              setRecoveryRequested(false);
              setMfaRequired(false);
              setUseRecoveryCode(false);
              setMfaCode("");
              setMessage(undefined);
              reset({ email: "", password: "" });
            }}
          >
            Back to sign in
          </Button>
        </div>
      );
    }
    return (
      <form
        className="space-y-5"
        noValidate
        onSubmit={(event) => void submitMfa(event)}
      >
        <div className="text-center">
          <span className="bg-brand-soft text-brand mx-auto grid size-14 place-items-center rounded-full">
            <ShieldCheck
              className="size-7"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </span>
          <h3 className="mt-4 text-xl font-semibold">Verify your identity</h3>
          <p className="text-muted mt-2 text-sm leading-6">
            Enter the 6-digit code from your authenticator app, or use a
            recovery code.
          </p>
        </div>
        {message ? <Alert>{message}</Alert> : null}
        {useRecoveryCode ? (
          <FormField id="mfa-code" label="Recovery code">
            <Input
              id="mfa-code"
              autoFocus
              autoComplete="off"
              maxLength={14}
              value={mfaCode}
              onChange={(event) =>
                setMfaCode(
                  event.target.value
                    .replace(/[^A-Za-z0-9-]/g, "")
                    .slice(0, 14)
                    .toUpperCase(),
                )
              }
            />
          </FormField>
        ) : (
          <div>
            <h4 className="mb-4 text-center text-lg font-semibold">
              Enter your code
            </h4>
            <OtpCodeInput id="mfa-code" value={mfaCode} onChange={setMfaCode} />
          </div>
        )}
        <Button className="w-full" disabled={mfaPending} type="submit">
          {mfaPending ? "Verifying..." : "Verify and sign in"}
        </Button>
        <button
          type="button"
          className="text-brand mx-auto block min-h-10 text-sm font-medium hover:underline"
          onClick={() => {
            setUseRecoveryCode((value) => !value);
            setMfaCode("");
            setMessage(undefined);
          }}
        >
          {useRecoveryCode ? "Use authenticator code" : "Use a recovery code"}
        </button>
        <button
          type="button"
          className="text-brand mx-auto block min-h-10 text-sm font-medium underline-offset-4 hover:underline disabled:opacity-50"
          disabled={mfaPending || recoveryPending}
          onClick={async () => {
            setMessage(undefined);
            setRecoveryPending(true);
            try {
              await requestMfaRecovery();
              setRecoveryRequested(true);
            } catch (error: unknown) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Unable to send the recovery request.",
              );
            } finally {
              setRecoveryPending(false);
            }
          }}
        >
          {recoveryPending
            ? "Sending request..."
            : "Lost access to your authenticator?"}
        </button>
        <button
          type="button"
          className="text-muted hover:text-foreground focus-visible:outline-brand mx-auto flex min-h-11 items-center gap-2 text-sm font-medium focus-visible:outline-2"
          onClick={() => {
            setMfaRequired(false);
            setMfaCode("");
            setMessage(undefined);
          }}
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to sign in
        </button>
      </form>
    );
  }

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
      {message ? <Alert>{message}</Alert> : null}
      <FormField id="email" label="Email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="name@company.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
      </FormField>
      <FormField
        id="password"
        label="Password"
        error={errors.password?.message}
      >
        <div className="relative">
          <Input
            id="password"
            className="pr-12"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="text-muted hover:text-foreground focus-visible:outline-brand absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 focus-visible:outline-2 focus-visible:outline-offset-2"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? (
              <EyeOff className="size-5" aria-hidden="true" />
            ) : (
              <Eye className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </FormField>
      <div className="flex justify-end">
        <Link
          className="text-brand text-sm font-medium underline-offset-4 hover:underline"
          href="/forgot-password"
        >
          Forgot password?
        </Link>
      </div>
      <Button className="w-full" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
