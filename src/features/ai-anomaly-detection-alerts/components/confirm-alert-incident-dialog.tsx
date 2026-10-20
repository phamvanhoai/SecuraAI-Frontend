"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useSessionUser } from "@/features/authentication-account";
import { useConfirmAiAlertAsIncident } from "../hooks/use-ai-alerts";
import {
  confirmAiAlertSchema,
  type AiAlert,
  type ConfirmAiAlertInput,
  type ConfirmAiAlertRequest,
} from "../schemas/ai-alert-schema";
import { FeedbackRecordContext } from "./feedback-record-context";
import { AlertDecisionContext } from "./alert-decision-context";

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
  const session = useSessionUser();
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
        result.finding.created
          ? "True positive confirmed"
          : "Alert already confirmed",
        result.finding.created
          ? `A security finding was created for ${alert.alertCode}. You can create an incident from Incident Management.`
          : `The security finding for ${alert.alertCode} already exists.`,
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
      className="max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={close}
      title="Confirm alert as true positive"
    >
      {alert ? (
        <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
          <AlertDecisionContext alert={alert} />
          <div className="border-border flex items-start gap-3 rounded-lg border p-4">
            <ShieldCheck
              aria-hidden="true"
              className="text-success mt-0.5 size-5 shrink-0"
              strokeWidth={1.8}
            />
            <div>
              <h3 className="text-sm font-semibold">True-positive outcome</h3>
              <p className="text-muted mt-1 text-sm leading-6">
                This records the alert as a true positive, completes triage, and
                creates a security finding. Creating an incident remains a
                separate action in Incident Management.
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
            id="confirm-incident-comment"
            label="Feedback reason (optional)"
            error={errors.comment?.message}
          >
            <Textarea
              aria-invalid={Boolean(errors.comment)}
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
          <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button
              disabled={mutation.isPending}
              onClick={close}
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="size-4 animate-spin motion-reduce:animate-none"
                  />
                  Confirming…
                </>
              ) : (
                "Confirm true positive"
              )}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
