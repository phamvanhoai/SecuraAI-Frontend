"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useConfirmAiAlertAsIncident } from "../hooks/use-ai-alerts";
import {
  confirmAiAlertSchema,
  type AiAlert,
  type ConfirmAiAlertInput,
  type ConfirmAiAlertRequest,
} from "../schemas/ai-alert-schema";

export function ConfirmAlertIncidentDialog({
  alert,
  onClose,
}: {
  alert: AiAlert | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const mutation = useConfirmAiAlertAsIncident(alert?.id ?? null);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConfirmAiAlertInput, unknown, ConfirmAiAlertRequest>({
    resolver: zodResolver(confirmAiAlertSchema),
    defaultValues: { comment: "" },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (alert && !dialog.open) dialog.showModal();
    if (!alert && dialog.open) dialog.close();
  }, [alert]);

  const resetAndClose = (): void => {
    reset({ comment: "" });
    setMessage(undefined);
    onClose();
  };
  const close = (): void => {
    if (!mutation.isPending) resetAndClose();
  };

  const submit = async (values: ConfirmAiAlertRequest): Promise<void> => {
    if (!alert) return;
    setMessage(undefined);
    try {
      const result = await mutation.mutateAsync(values);
      resetAndClose();
      toast.success(
        result.incident.created
          ? "Incident draft created"
          : "Linked incident already exists",
        `${result.incident.code} is linked to ${alert.alertCode}.`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to confirm this alert. Try again.",
      );
    }
  };

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={close}
      title="Confirm alert as incident"
    >
      {alert ? (
        <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
          <div>
            <p className="font-medium">{alert.title}</p>
            <p className="text-muted mt-1 text-sm">{alert.alertCode}</p>
          </div>
          <p className="text-muted text-sm leading-6">
            This confirms the alert, records your review, and automatically
            creates a linked incident draft for investigation.
          </p>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          <FormField
            id="confirm-incident-comment"
            label="Review comment (optional)"
            error={errors.comment?.message}
          >
            <Textarea
              id="confirm-incident-comment"
              rows={4}
              maxLength={2000}
              aria-describedby={
                errors.comment
                  ? "confirm-incident-comment-error"
                  : "confirm-incident-comment-help"
              }
              {...register("comment")}
            />
            <p
              id="confirm-incident-comment-help"
              className="text-muted text-xs"
            >
              Add evidence that supports this decision.
            </p>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button
              disabled={mutation.isPending}
              onClick={close}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? "Confirming…" : "Confirm incident"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
