"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, ShieldX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useSessionUser } from "@/features/authentication-account";
import { useMarkAiAlertFalsePositive } from "../hooks/use-ai-alerts";
import {
  markFalsePositiveSchema,
  type AiAlert,
  type MarkFalsePositiveInput,
  type MarkFalsePositiveRequest,
} from "../schemas/ai-alert-schema";
import { FeedbackRecordContext } from "./feedback-record-context";
import { AlertDecisionContext } from "./alert-decision-context";

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
  const session = useSessionUser();
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
      className="max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={close}
      title="Dismiss alert as false positive"
    >
      {alert ? (
        <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
          <AlertDecisionContext alert={alert} />
          <div className="border-danger/25 bg-danger-soft/40 flex items-start gap-3 rounded-lg border p-4">
            <ShieldX
              aria-hidden="true"
              className="text-danger mt-0.5 size-5 shrink-0"
              strokeWidth={1.8}
            />
            <div>
              <h3 className="text-sm font-semibold">False-positive outcome</h3>
              <p className="text-muted mt-1 text-sm leading-6">
                This completes triage, dismisses the alert, and records the
                reason. It does not retrain the AI model automatically.
              </p>
            </div>
          </div>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          <FeedbackRecordContext alert={alert} analyst={session.data} />
          <FormField
            id="false-positive-comment"
            label="Feedback reason (optional)"
            error={errors.comment?.message}
          >
            <Textarea
              aria-invalid={Boolean(errors.comment)}
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
          <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button
              disabled={mutation.isPending}
              onClick={close}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={mutation.isPending}
              type="submit"
              variant="danger"
            >
              {mutation.isPending ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                  Dismissing…
                </>
              ) : (
                "Dismiss as false positive"
              )}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
