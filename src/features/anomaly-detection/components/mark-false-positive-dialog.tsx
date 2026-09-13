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
import { useMarkAiAlertFalsePositive } from "../hooks/use-ai-alerts";
import {
  markFalsePositiveSchema,
  type AiAlert,
  type MarkFalsePositiveInput,
  type MarkFalsePositiveRequest,
} from "../schemas/ai-alert-schema";

export function MarkFalsePositiveDialog({
  alert,
  onClose,
}: {
  alert: AiAlert | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const mutation = useMarkAiAlertFalsePositive(alert?.id ?? null);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MarkFalsePositiveInput, unknown, MarkFalsePositiveRequest>({
    resolver: zodResolver(markFalsePositiveSchema),
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

  const submit = async (values: MarkFalsePositiveRequest): Promise<void> => {
    if (!alert) return;
    setMessage(undefined);
    try {
      const result = await mutation.mutateAsync(values);
      resetAndClose();
      toast.success(
        result.changed
          ? "Alert marked as false positive"
          : "Already marked as false positive",
        `${alert.alertCode} is classified as a false positive.`,
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
      title="Mark false positive"
    >
      {alert ? (
        <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
          <p className="font-medium">{alert.title}</p>
          <p className="text-muted text-sm">{alert.alertCode}</p>
          <p className="text-muted text-sm leading-6">
            This changes the alert status to false positive and records your
            review. It does not retrain the AI model.
          </p>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          <FormField
            id="false-positive-comment"
            label="Reason (optional)"
            error={errors.comment?.message}
          >
            <Textarea
              id="false-positive-comment"
              rows={4}
              maxLength={2000}
              aria-describedby={
                errors.comment
                  ? "false-positive-comment-error"
                  : "false-positive-comment-help"
              }
              {...register("comment")}
            />
            <p id="false-positive-comment-help" className="text-muted text-xs">
              Explain why this alert is incorrect to help future analysis.
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
            <Button
              disabled={mutation.isPending}
              type="submit"
              variant="danger"
            >
              {mutation.isPending ? "Marking…" : "Mark false positive"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
