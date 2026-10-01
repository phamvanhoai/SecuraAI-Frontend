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
import { useMarkAiAlertFurtherInvestigation } from "../hooks/use-ai-alerts";
import {
  markFurtherInvestigationSchema,
  type AiAlert,
  type MarkFurtherInvestigationInput,
  type MarkFurtherInvestigationRequest,
} from "../schemas/ai-alert-schema";

export function MarkFurtherInvestigationDialog({
  alert,
  onClose,
}: {
  alert: AiAlert | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const mutation = useMarkAiAlertFurtherInvestigation(alert?.id ?? null);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<
    MarkFurtherInvestigationInput,
    unknown,
    MarkFurtherInvestigationRequest
  >({
    resolver: zodResolver(markFurtherInvestigationSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (alert && !dialog.open) dialog.showModal();
    if (!alert && dialog.open) dialog.close();
  }, [alert]);

  const resetAndClose = (): void => {
    reset({ reason: "" });
    setMessage(undefined);
    onClose();
  };
  const close = (): void => {
    if (!mutation.isPending) resetAndClose();
  };

  const submit = async (
    values: MarkFurtherInvestigationRequest,
  ): Promise<void> => {
    if (!alert) return;
    setMessage(undefined);
    try {
      const result = await mutation.mutateAsync(values);
      resetAndClose();
      toast.success(
        result.changed
          ? "Further investigation requested"
          : "Further investigation already requested",
        `${alert.alertCode} remains assigned to you for additional investigation.`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update this alert. Try again.",
      );
    }
  };

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={close}
      title="Mark as needing further investigation"
    >
      {alert ? (
        <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
          <div>
            <p className="font-medium">{alert.title}</p>
            <p className="text-muted mt-1 text-sm">{alert.alertCode}</p>
          </div>
          <p className="text-muted text-sm leading-6">
            Keep this alert open and assigned to you while more evidence is
            collected. You can still confirm or dismiss it after investigation.
          </p>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          <FormField
            error={errors.reason?.message}
            id="further-investigation-reason"
            label="Investigation reason"
          >
            <Textarea
              aria-describedby={
                errors.reason
                  ? "further-investigation-reason-error"
                  : "further-investigation-reason-help"
              }
              id="further-investigation-reason"
              maxLength={2000}
              rows={4}
              {...register("reason")}
            />
            <p
              className="text-muted text-xs"
              id="further-investigation-reason-help"
            >
              State what evidence, correlation, or validation is still needed.
            </p>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button
              disabled={mutation.isPending}
              onClick={close}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending
                ? "Updating…"
                : "Need further investigation"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
