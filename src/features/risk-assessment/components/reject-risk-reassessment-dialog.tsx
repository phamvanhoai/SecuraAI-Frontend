"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useRejectRiskReassessment } from "../hooks/use-risk-reassessment-review";
import {
  rejectRiskReassessmentFormSchema,
  type RejectRiskReassessmentForm,
  type RiskReassessmentReviewItem,
} from "../schemas/risk-reassessment-review-schema";

export function RejectRiskReassessmentDialog({
  request,
  onClose,
}: {
  request: RiskReassessmentReviewItem | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const mutation = useRejectRiskReassessment();
  const toast = useToast();
  const form = useForm<RejectRiskReassessmentForm>({
    resolver: zodResolver(rejectRiskReassessmentFormSchema),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (request) {
      form.reset({ reason: "" });
      ref.current?.showModal();
    } else ref.current?.close();
  }, [form, request]);

  const submit = async (values: RejectRiskReassessmentForm) => {
    if (!request) return;
    try {
      await mutation.mutateAsync({ requestId: request.id, values });
      toast.success(
        "Reassessment request rejected",
        `${request.risk.riskCode} remains unchanged. The decision reason was retained for audit.`,
      );
      onClose();
    } catch {
      // The normalized API error remains visible in the dialog.
    }
  };

  return (
    <Dialog
      dialogRef={ref}
      title={
        request?.status === "under_review"
          ? "Close without reassessment"
          : "Reject reassessment request"
      }
      onClose={onClose}
    >
      {request ? (
        <form
          className="space-y-5"
          noValidate
          onSubmit={form.handleSubmit(submit)}
        >
          <Alert>
            {request.risk.riskCode} — {request.risk.title}. This decision will
            close the request without changing residual risk or its treatment
            plan.
          </Alert>
          {mutation.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Unable to reject this request."}
            </Alert>
          ) : null}
          <FormField
            id="reassessment-rejection-reason"
            label="Decision rationale"
            error={form.formState.errors.reason?.message}
          >
            <Textarea
              id="reassessment-rejection-reason"
              autoFocus
              className="min-h-32"
              maxLength={2000}
              placeholder="Explain why this incident does not require the linked risk to be reassessed."
              {...form.register("reason")}
            />
            <p className="text-muted text-xs">
              The Security Officer can read this reason and submit a new request
              with additional evidence.
            </p>
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Rejecting…" : "Reject request"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
