"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { History, MessageSquareText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, type DefaultValues } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useEvaluateAiAlertReliability } from "../hooks/use-ai-alerts";
import {
  evaluateAiAlertReliabilitySchema,
  type AiAlert,
  type EvaluateAiAlertReliabilityInput,
  type EvaluateAiAlertReliabilityRequest,
} from "../schemas/ai-alert-schema";
import { AlertFeedbackHistoryPanel } from "./alert-feedback-history-panel";

const defaults: DefaultValues<EvaluateAiAlertReliabilityInput> = {
  comment: "",
};
type FeedbackTab = "evaluate" | "history";

export function EvaluateAlertReliabilityDialog({
  alert,
  initialTab = "evaluate",
  onClose,
}: {
  alert: AiAlert | null;
  initialTab?: FeedbackTab;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const [tab, setTab] = useState<FeedbackTab>(initialTab);
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
  }, [alert, initialTab]);

  const close = (): void => {
    reset(defaults);
    setMessage(undefined);
    setTab("evaluate");
    onClose();
  };

  const submit = async (
    values: EvaluateAiAlertReliabilityRequest,
  ): Promise<void> => {
    if (!alert) return;
    setMessage(undefined);
    try {
      await mutation.mutateAsync(values);
      reset(defaults);
      setTab("history");
      toast.success(
        "Alert feedback recorded",
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

  const tabs = [
    {
      id: "evaluate" as const,
      label: "Record feedback",
      icon: MessageSquareText,
    },
    { id: "history" as const, label: "Feedback history", icon: History },
  ];

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(72rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={close}
      title="Alert feedback"
    >
      {alert ? (
        <div className="space-y-5">
          <div className="border-border bg-neutral-soft rounded-lg border p-4">
            <p className="font-medium">{alert.title}</p>
            <p className="text-muted mt-1 text-sm">{alert.alertCode}</p>
          </div>
          <div
            aria-label="Alert reliability views"
            className="border-border bg-surface inline-flex w-full items-center gap-1 rounded-xl border p-1 shadow-xs sm:w-auto"
            role="tablist"
          >
            {tabs.map((item) => {
              const Icon = item.icon;
              const selected = tab === item.id;
              return (
                <button
                  aria-selected={selected}
                  className={cn(
                    "inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors sm:flex-none",
                    selected
                      ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                      : "text-muted hover:bg-neutral-soft hover:text-foreground",
                  )}
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  role="tab"
                  type="button"
                >
                  <Icon
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.8}
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="h-[26rem] overflow-y-auto pr-1 sm:h-[30rem]">
            {tab === "evaluate" ? (
              <form
                className="space-y-4"
                noValidate
                onSubmit={handleSubmit(submit)}
                role="tabpanel"
              >
                <p className="text-muted text-sm leading-6">
                  Record whether this alert represents a real incident. This
                  feedback does not change the alert status.
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
                    <option value="confirmed_incident">
                      Confirmed incident
                    </option>
                    <option value="false_positive">False positive</option>
                    <option value="needs_review">Needs further review</option>
                  </Select>
                </FormField>
                <FormField
                  error={errors.comment?.message}
                  id="feedback-comment"
                  label="Feedback reason (optional)"
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
            ) : (
              <div role="tabpanel">
                <AlertFeedbackHistoryPanel alertId={alert.id} />
              </div>
            )}
          </div>
          {tab === "history" ? (
            <div className="border-border flex justify-end border-t pt-4">
              <Button onClick={close} variant="secondary">
                Close
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}
