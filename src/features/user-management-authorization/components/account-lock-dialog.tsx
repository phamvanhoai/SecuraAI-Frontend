"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole, UnlockKeyhole } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAccountLock } from "../hooks/use-account-lock";
import { accountLockError, type ManagedUser } from "../lib/account-lock";
import {
  accountLockBodySchema,
  type AccountLockAction,
  type AccountLockInput,
} from "../schemas/account-lock-schema";

export type AccountLockSelection = {
  user: ManagedUser;
  action: AccountLockAction;
};

export function AccountLockDialog({
  selection,
  onClose,
}: {
  selection: AccountLockSelection | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mutation = useAccountLock();
  const toast = useToast();
  const [message, setMessage] = useState<string>();
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountLockInput>({
    resolver: zodResolver(accountLockBodySchema),
    defaultValues: { reason: "" },
  });
  useEffect(() => {
    reset({ reason: "" });
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selection && !dialog.open) dialog.showModal();
    if (!selection && dialog.open) dialog.close();
  }, [selection, reset]);

  const locking = selection?.action === "lock";
  const label = locking ? "Lock account" : "Unlock account";
  const Icon = locking ? LockKeyhole : UnlockKeyhole;

  function close(): void {
    setMessage(undefined);
    onClose();
  }

  async function submit(input: AccountLockInput): Promise<void> {
    if (!selection || mutation.isPending) return;
    setMessage(undefined);
    try {
      const result = await mutation.mutateAsync({
        userId: selection.user.id,
        action: selection.action,
        input,
      });
      close();
      if (!result.changed) {
        toast.info(
          locking ? "Account already locked" : "Account already unlocked",
          "The user list has been refreshed.",
        );
      } else {
        toast.success(
          locking ? "Account locked" : "Account unlocked",
          locking
            ? `${selection.user.fullName} can no longer sign in. Existing sessions have been revoked.`
            : `${selection.user.fullName} must sign in again. Previous sessions remain revoked.`,
        );
      }
    } catch (error: unknown) {
      setMessage(accountLockError(error));
    }
  }

  return (
    <Dialog
      title={label}
      dialogRef={dialogRef}
      className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
      onClose={close}
      onCancel={(event) => {
        event.preventDefault();
        if (!mutation.isPending) close();
      }}
    >
      {selection ? (
        <form
          className="space-y-5"
          noValidate
          onSubmit={handleSubmit(submit)}
          aria-busy={mutation.isPending}
        >
          <div className="bg-neutral-soft rounded-lg p-3">
            <p className="font-semibold break-words">
              {selection.user.fullName}
            </p>
            <p className="text-muted mt-1 text-sm [overflow-wrap:anywhere]">
              {selection.user.email}
            </p>
          </div>
          <FormField
            id="account-lock-reason"
            label="Reason (required)"
            error={errors.reason?.message}
          >
            <Textarea
              id="account-lock-reason"
              rows={4}
              autoFocus
              disabled={mutation.isPending}
              aria-invalid={Boolean(errors.reason)}
              aria-describedby={`account-lock-reason-help${errors.reason ? " account-lock-reason-error" : ""}`}
              {...register("reason")}
            />
            <p id="account-lock-reason-help" className="text-muted text-xs">
              10–1,000 characters. The reason is recorded in the audit log.
            </p>
          </FormField>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              disabled={mutation.isPending}
              onClick={close}
            >
              Cancel
            </Button>
            <Button
              variant={locking ? "danger" : "primary"}
              className={locking ? "dark:text-background" : ""}
              type="submit"
              disabled={mutation.isPending}
            >
              <Icon className="size-4" strokeWidth={1.8} aria-hidden="true" />
              {mutation.isPending
                ? locking
                  ? "Locking…"
                  : "Unlocking…"
                : label}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
