"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/api-error";
import { useChangePassword } from "../hooks/use-change-password";
import { useSessionUser } from "../hooks/use-session-user";
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from "../schemas/change-password-schema";

function backendErrorCode(error: ApiError): string | undefined {
  if (typeof error.details !== "object" || error.details === null)
    return undefined;
  if (!("error" in error.details)) return undefined;
  const detail = error.details.error;
  if (typeof detail !== "object" || detail === null || !("code" in detail))
    return undefined;
  return typeof detail.code === "string" ? detail.code : undefined;
}

export function ChangePasswordForm({
  required = false,
}: {
  required?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const mutation = useChangePassword();
  const session = useSessionUser();
  const isRequired = required || session.data?.mustChangePassword === true;
  const [message, setMessage] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ChangePasswordInput): Promise<void> {
    setMessage(undefined);
    try {
      await mutation.mutateAsync(values);
      toast.success(
        "Password changed successfully",
        "Please sign out and sign in again with your new password.",
      );
      router.replace("/dashboard");
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        const code = backendErrorCode(error);
        if (code === "INVALID_CURRENT_PASSWORD") {
          setError(
            "currentPassword",
            { message: "Current password is incorrect." },
            { shouldFocus: true },
          );
          return;
        }
        if (code === "PASSWORD_UNCHANGED") {
          setError(
            "newPassword",
            {
              message:
                "New password must be different from the current password.",
            },
            { shouldFocus: true },
          );
          return;
        }
        if (error.status === 401) {
          window.location.replace("/login?sessionExpired=1");
          return;
        }
        setMessage(error.message);
        return;
      }
      setMessage("Unable to change the password. Please try again.");
    }
  }

  async function logout(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.replace("/login");
  }

  return (
    <form
      className="space-y-5 p-5 sm:p-6"
      autoComplete="off"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      {isRequired ? (
        <Alert className="border-warning/25 bg-warning-soft text-warning">
          You must change the temporary password before continuing to SecuraAI.
        </Alert>
      ) : null}
      {message ? (
        <Alert className="border-danger/25 bg-danger-soft text-danger">
          {message}
        </Alert>
      ) : null}

      <FormField
        id="current-password"
        label="Current password"
        error={errors.currentPassword?.message}
      >
        <PasswordInput
          id="current-password"
          autoComplete="current-password"
          error={Boolean(errors.currentPassword)}
          describedBy={
            errors.currentPassword ? "current-password-error" : undefined
          }
          registration={register("currentPassword")}
        />
      </FormField>

      <div className="pt-5">
        <FormField
          id="new-password"
          label="New password"
          error={errors.newPassword?.message}
        >
          <PasswordInput
            id="new-password"
            autoComplete="off"
            error={Boolean(errors.newPassword)}
            describedBy={
              errors.newPassword
                ? "new-password-help new-password-error"
                : "new-password-help"
            }
            registration={register("newPassword")}
          />
          <p id="new-password-help" className="text-muted text-sm leading-5">
            Use 8–128 characters with at least one uppercase letter and one
            special character.
          </p>
        </FormField>
      </div>

      <FormField
        id="confirm-password"
        label="Confirm new password"
        error={errors.confirmPassword?.message}
      >
        <PasswordInput
          id="confirm-password"
          autoComplete="off"
          error={Boolean(errors.confirmPassword)}
          describedBy={
            errors.confirmPassword ? "confirm-password-error" : undefined
          }
          registration={register("confirmPassword")}
        />
      </FormField>

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        {isRequired ? (
          <Button
            variant="secondary"
            type="button"
            onClick={() => void logout()}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </Button>
        ) : (
          <Link
            href="/profile"
            className="border-border bg-surface text-foreground hover:bg-neutral-soft focus-visible:outline-brand inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Cancel
          </Link>
        )}
        <Button disabled={mutation.isPending} type="submit">
          <KeyRound className="size-4" aria-hidden="true" />
          {mutation.isPending ? "Changing password..." : "Change password"}
        </Button>
      </div>
    </form>
  );
}

function PasswordInput({
  id,
  autoComplete,
  error,
  describedBy,
  registration,
}: {
  id: string;
  autoComplete: "current-password" | "off";
  error: boolean;
  describedBy?: string | undefined;
  registration: UseFormRegisterReturn;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input
        {...registration}
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        className="pr-12"
        aria-invalid={error}
        aria-describedby={describedBy}
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="text-muted hover:bg-neutral-soft hover:text-foreground focus-visible:outline-brand absolute top-1/2 right-0 grid size-11 -translate-y-1/2 place-items-center rounded-md transition-colors focus-visible:outline-2 sm:right-1 sm:size-10"
        onClick={() => setVisible((value) => !value)}
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
