"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { UserMinus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAccountAvailability } from "../hooks/use-account-availability";
import {
  accountAvailabilityBodySchema,
  type AccountAvailabilityAction,
  type AccountAvailabilityInput,
} from "../schemas/account-availability-schema";
import type { UserListResponse } from "../schemas/user-schema";

type ManagedUser = UserListResponse["items"][number];

export function AccountAvailabilityDialog({
  user,
  canDeactivate,
  canRemove,
  onClose,
}: {
  user: ManagedUser | null;
  canDeactivate: boolean;
  canRemove: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mutation = useAccountAvailability();
  const toast = useToast();
  const [action, setAction] = useState<AccountAvailabilityAction | null>(null);
  const [message, setMessage] = useState<string>();
  const { register, reset, handleSubmit, formState: { errors } } = useForm<AccountAvailabilityInput>({
    resolver: zodResolver(accountAvailabilityBodySchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (user && !dialog.open) dialog.showModal();
    if (!user && dialog.open) dialog.close();
  }, [user]);

  function close(): void {
    if (mutation.isPending) return;
    setMessage(undefined);
    setAction(null);
    reset({ reason: "" });
    onClose();
  }

  async function submit(body: AccountAvailabilityInput): Promise<void> {
    if (!user || !action || mutation.isPending) return;
    setMessage(undefined);
    try {
      const result = await mutation.mutateAsync({ userId: user.id, action, body });
      close();
      if (!result.changed) {
        toast.info("Account already deactivated", "The user list has been refreshed.");
      } else {
        toast.success(
          action === "deactivate" ? "Account deactivated" : "Account removed",
          action === "deactivate"
            ? `${user.fullName} can no longer sign in. Existing sessions were revoked.`
            : `${user.fullName} was removed from the user list. Historical records remain intact.`,
        );
      }
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Unable to change the account. Reload and try again.");
    }
  }

  return (
    <Dialog
      title="Deactivate or remove user"
      dialogRef={dialogRef}
      className="max-h-[calc(100dvh-2rem)] w-[min(34rem,calc(100%-2rem))] overflow-y-auto"
      onClose={close}
      onCancel={(event) => { event.preventDefault(); close(); }}
    >
      {user ? (
        <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)} aria-busy={mutation.isPending}>
          <div className="bg-neutral-soft rounded-lg p-3">
            <p className="font-semibold break-words">{user.fullName}</p>
            <p className="text-muted mt-1 text-sm [overflow-wrap:anywhere]">{user.email}</p>
          </div>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">Choose an action</legend>
            {canDeactivate && user.status !== "disabled" ? (
              <label className="border-border flex cursor-pointer gap-3 rounded-lg border p-3">
                <input type="radio" name="account-action" checked={action === "deactivate"}
                  onChange={() => setAction("deactivate")} disabled={mutation.isPending} />
                <span><span className="block text-sm font-semibold">Deactivate</span>
                  <span className="text-muted block text-xs">Blocks sign-in and revokes sessions. Profile stays visible.</span></span>
              </label>
            ) : null}
            {canRemove ? (
              <label className="border-border flex cursor-pointer gap-3 rounded-lg border p-3">
                <input type="radio" name="account-action" checked={action === "remove"}
                  onChange={() => setAction("remove")} disabled={mutation.isPending} />
                <span><span className="text-danger block text-sm font-semibold">Remove (soft delete)</span>
                  <span className="text-muted block text-xs">Hides the account from the user list and blocks sign-in. Historical records remain.</span></span>
              </label>
            ) : null}
          </fieldset>
          {action === "remove" ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              This action is not reversible from User Management. Confirm the correct person before continuing.
            </Alert>
          ) : null}
          <FormField id="account-availability-reason" label="Reason (required)" error={errors.reason?.message}>
            <Textarea id="account-availability-reason" rows={4} autoFocus disabled={mutation.isPending}
              aria-invalid={Boolean(errors.reason)}
              aria-describedby={`account-availability-reason-help${errors.reason ? " account-availability-reason-error" : ""}`}
              {...register("reason")} />
            <p id="account-availability-reason-help" className="text-muted text-xs">
              10–1,000 characters. The reason is stored in the audit log.
            </p>
          </FormField>
          {message ? <Alert className="border-danger/25 bg-danger-soft text-danger">{message}</Alert> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" disabled={mutation.isPending} onClick={close}>Cancel</Button>
            <Button type="submit" variant="danger" disabled={!action || mutation.isPending}
              className="dark:text-background">
              {action === "remove" ? <Trash2 className="size-4" strokeWidth={1.8} aria-hidden="true" />
                : <UserMinus className="size-4" strokeWidth={1.8} aria-hidden="true" />}
              {mutation.isPending ? "Processing…" : action === "remove" ? "Remove user" : "Deactivate user"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
