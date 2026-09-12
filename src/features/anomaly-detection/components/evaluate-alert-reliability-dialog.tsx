"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, type DefaultValues } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEvaluateAiAlertReliability } from "../hooks/use-ai-alerts";
import {
  evaluateAiAlertReliabilitySchema,
  type AiAlert,
  type EvaluateAiAlertReliabilityInput,
  type EvaluateAiAlertReliabilityRequest,
} from "../schemas/ai-alert-schema";

const defaults: DefaultValues<EvaluateAiAlertReliabilityInput> = {
  comment: "",
};

export function EvaluateAlertReliabilityDialog({
  alert,
  onClose,
}: {
  alert: AiAlert | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const mutation = useEvaluateAiAlertReliability(alert?.id ?? null);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<
    EvaluateAiAlertReliabilityInput,
    unknown,
    EvaluateAiAlertReliabilityRequest
  >({
    resolver: zodResolver(evaluateAiAlertReliabilitySchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (alert && !dialog.open) dialog.showModal();
    if (!alert && dialog.open) dialog.close();
  }, [alert]);

  const close = (): void => {
    reset(defaults);
    setMessage(undefined);
    onClose();
  };

  const submit = async (
    values: EvaluateAiAlertReliabilityRequest,
  ): Promise<void> => {
    if (!alert) return;
    setMessage(undefined);
    try {
      await mutation.mutateAsync(values);
      close();
      toast.success(
        "Reliability feedback submitted",
        `Your assessment for ${alert.alertCode} was recorded.`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit feedback. Please try again.",
      );
    }
  };

  return (
    <Dialog
      className="w-[min(36rem,calc(100%-2rem))]"
      dialogRef={dialogRef}
      onClose={close}
      title="Evaluate alert reliability"
    >
      {alert ? (
        <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
          <div>
            <p className="font-medium">{alert.title}</p>
            <p className="text-muted mt-1 text-sm">{alert.alertCode}</p>
          </div>
          <p className="text-muted text-sm leading-6">
            Record whether this alert represents a real incident. This feedback
            does not change the alert status.
          </p>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          <FormField
            error={errors.feedbackLabel?.message}
            id="feedback-label"
            label="Assessment"
          >
            <Select
              aria-describedby={
                errors.feedbackLabel ? "feedback-label-error" : undefined
              }
              id="feedback-label"
              {...register("feedbackLabel")}
            >
              <option value="">Select an assessment</option>
              <option value="confirmed_incident">Confirmed incident</option>
              <option value="false_positive">False positive</option>
              <option value="needs_review">Needs further review</option>
            </Select>
          </FormField>
          <FormField
            error={errors.comment?.message}
            id="feedback-comment"
            label="Comment (optional)"
          >
            <Textarea
              aria-describedby={
                errors.comment
                  ? "feedback-comment-error"
                  : "feedback-comment-help"
              }
              id="feedback-comment"
              maxLength={2000}
              rows={5}
              {...register("comment")}
            />
            <p className="text-muted text-xs" id="feedback-comment-help">
              Add evidence or context that may help future analysis.
            </p>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button onClick={close} variant="secondary">
              Cancel
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? "Submitting…" : "Submit feedback"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
