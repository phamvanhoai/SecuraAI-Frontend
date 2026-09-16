"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Copy, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/api-error";
import { enableMfa, setupMfa } from "../api/mfa-setup";
import { useSessionUser } from "../hooks/use-session-user";
import { OtpCodeInput } from "./otp-code-input";

type SetupDetails = Awaited<ReturnType<typeof setupMfa>>;

function backendCode(error: ApiError): string | undefined {
  const details = error.details;
  if (!details || typeof details !== "object" || !("error" in details))
    return undefined;
  const value = details.error;
  return value &&
    typeof value === "object" &&
    "code" in value &&
    typeof value.code === "string"
    ? value.code
    : undefined;
}

export function MfaSetupCard() {
  const session = useSessionUser();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [setup, setSetup] = useState<SetupDetails>();
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>();
  const [message, setMessage] = useState<string>();
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function refreshSession() {
    await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
  }
  function handleError(error: unknown, fallback: string) {
    if (
      error instanceof ApiError &&
      backendCode(error) === "MFA_ALREADY_ENABLED"
    ) {
      setSetup(undefined);
      void refreshSession();
      setMessage("MFA is already enabled for this account.");
      return;
    }
    if (error instanceof ApiError && error.status === 401) {
      window.location.replace("/login?sessionExpired=1");
      return;
    }
    setMessage(error instanceof Error ? error.message : fallback);
  }
  async function start() {
    setPending(true);
    setMessage(undefined);
    try {
      setSetup(await setupMfa(password));
      setPassword("");
    } catch (error) {
      handleError(error, "Unable to start MFA setup.");
    } finally {
      setPending(false);
    }
  }
  async function verify() {
    if (!/^\d{6}$/.test(code)) {
      setMessage("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setPending(true);
    setMessage(undefined);
    try {
      const result = await enableMfa(code);
      setRecoveryCodes(result.recoveryCodes);
      setSetup(undefined);
      setCode("");
      await refreshSession();
    } catch (error) {
      handleError(error, "Unable to verify the authentication code.");
    } finally {
      setPending(false);
    }
  }
  if (recoveryCodes)
    return (
      <RecoveryCodes
        codes={recoveryCodes}
        onDone={() => window.location.replace("/dashboard")}
      />
    );
  if (session.data?.mfaEnabled && !setup)
    return (
      <div className="p-5 text-center">
        <p className="font-semibold">MFA is already enabled.</p>
        <Button
          className="mt-4"
          type="button"
          onClick={() => window.location.replace("/dashboard")}
        >
          Back to dashboard
        </Button>
      </div>
    );

  return (
    <div className="space-y-5 p-5">
      {message ? <Alert>{message}</Alert> : null}
      {!setup ? (
        <>
          <FormField id="mfa-current-password" label="Current password">
            <PasswordInput
              id="mfa-current-password"
              value={password}
              visible={showPassword}
              onChange={setPassword}
              onToggle={() => setShowPassword((value) => !value)}
            />
          </FormField>
          <Button
            disabled={pending || !password}
            type="button"
            onClick={() => void start()}
          >
            {pending ? "Preparing..." : "Set up authenticator"}
          </Button>
        </>
      ) : (
        <>
          <Alert className="border-warning/25 bg-warning-soft text-warning">
            {setup.warning}
          </Alert>
          <div className="text-center">
            <Image
              className="border-border mx-auto rounded-lg border"
              src={setup.qrCodeDataUrl}
              alt="QR code for authenticator setup"
              width={208}
              height={208}
              unoptimized
            />
            <p className="text-muted mt-3 text-sm">
              Scan the QR code, or enter this setup key manually:
            </p>
            <code className="bg-neutral-soft mt-2 inline-block rounded-md px-3 py-2 text-sm font-semibold break-all">
              {setup.manualKey}
            </code>
          </div>
          <div>
            <h3 className="mb-4 text-center text-lg font-semibold">
              Enter your code
            </h3>
            <OtpCodeInput id="mfa-setup-code" value={code} onChange={setCode} />
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              type="button"
              disabled={pending}
              onClick={() => {
                setSetup(undefined);
                setCode("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={() => void verify()}
            >
              {pending ? "Verifying..." : "Verify and enable MFA"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function RecoveryCodes({
  codes,
  onDone,
}: {
  codes: string[];
  onDone: () => void;
}) {
  const toast = useToast();
  async function copy() {
    await navigator.clipboard.writeText(codes.join("\n"));
    toast.success("Recovery codes copied");
  }
  return (
    <div className="space-y-5 p-5">
      <Alert className="border-warning/25 bg-warning-soft text-warning">
        Save these recovery codes now. Each code works once and they will not be
        shown again.
      </Alert>
      <div className="bg-neutral-soft grid gap-2 rounded-lg p-4 sm:grid-cols-2">
        {codes.map((item) => (
          <code className="text-center text-sm font-semibold" key={item}>
            {item}
          </code>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" type="button" onClick={() => void copy()}>
          <Copy className="size-4" aria-hidden="true" />
          Copy codes
        </Button>
        <Button type="button" onClick={onDone}>
          <CheckCircle2 className="size-4" aria-hidden="true" />I have saved
          these codes — continue to dashboard
        </Button>
      </div>
    </div>
  );
}

function PasswordInput({
  id,
  value,
  visible,
  onChange,
  onToggle,
}: {
  id: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        className="pr-12"
        type={visible ? "text" : "password"}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="text-muted hover:bg-neutral-soft focus-visible:outline-brand absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-md focus-visible:outline-2"
        onClick={onToggle}
      >
        {visible ? (
          <EyeOff className="size-5" aria-hidden="true" />
        ) : (
          <Eye className="size-5" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
