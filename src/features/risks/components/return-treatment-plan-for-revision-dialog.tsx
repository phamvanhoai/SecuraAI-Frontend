"use client";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/api-error";
import { useReturnTreatmentPlanForRevision } from "../hooks/use-return-treatment-plan-for-revision";
import type { RiskDetail } from "../schemas/risk-detail-schema";
import type { ReturnTreatmentPlanForRevisionRequest } from "../schemas/return-treatment-plan-for-revision-schema";

type Plan = RiskDetail["treatmentPlans"][number];
type RevisionScope = ReturnTreatmentPlanForRevisionRequest["revisionScope"];

function errorCode(error: ApiError): string | undefined {
  if (typeof error.details !== "object" || error.details === null) return undefined;
  const details = error.details as { error?: { code?: unknown } };
  return typeof details.error?.code === "string" ? details.error.code : undefined;
}

const messages: Readonly<Record<string, string>> = {
  SELF_REVIEW_NOT_ALLOWED: "You cannot return a submission that you submitted.",
  NOT_CURRENT_APPROVER: "You are not an eligible approver for the current workflow step.",
  APPROVAL_ALREADY_RECORDED: "You have already made a decision for this workflow step.",
  APPROVAL_REQUEST_NOT_PENDING: "This approval request has already been completed.",
  SUBMISSION_NOT_PENDING_APPROVAL: "The assessment and plan are no longer awaiting approval.",
  APPROVAL_SNAPSHOT_MISSING: "This legacy request must be resubmitted before revision can be requested.",
  SUBMISSION_CHANGED_AFTER_SUBMISSION:
    "The submitted data changed. Reload and review the latest version before making a decision.",
  APPROVAL_TEMPORARILY_UNAVAILABLE: "The request timed out. Please try again.",
};

export function ReturnTreatmentPlanForRevisionDialog({
  plan,
  riskCode,
  onClose,
}: {
  plan: Plan | null;
  riskCode: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [scope, setScope] = useState<RevisionScope>("both");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string>();
  const mutation = useReturnTreatmentPlanForRevision();
  const toast = useToast();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (plan && !dialog.open) dialog.showModal();
    if (!plan && dialog.open) dialog.close();
    setScope("both");
    setReason("");
    setMessage(undefined);
  }, [plan]);

  const close = (): void => {
    if (!mutation.isPending) onClose();
  };
  const submit = async (): Promise<void> => {
    if (!plan?.approval) return;
    const normalizedReason = reason.normalize("NFKC").replace(/\s+/gu, " ").trim();
    if (normalizedReason.length < 10) {
      setMessage("Revision reason must contain at least 10 characters.");
      return;
    }
    setMessage(undefined);
    try {
      await mutation.mutateAsync({
        id: plan.id,
        input: {
          approvalRequestId: plan.approval.id,
          revisionScope: scope,
          reason: normalizedReason,
        },
      });
      toast.success(
        "Returned for revision",
        `${riskCode} and its treatment plan can now be revised and resubmitted.`,
      );
      onClose();
    } catch (error: unknown) {
      const code = error instanceof ApiError ? errorCode(error) : undefined;
      setMessage(
        (code ? messages[code] : undefined) ??
          (error instanceof Error ? error.message : "Unable to return this submission for revision."),
      );
    }
  };

  return (
    <Dialog
      title="Return Risk Assessment and Treatment Plan for Revision"
      dialogRef={ref}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={close}
    >
      {plan?.approval ? (
        <div className="space-y-4">
          <Alert>
            This ends the current approval request and returns both records for editing. The decision and reason remain in the approval history.
          </Alert>
          <div className="rounded-xl border border-border p-4">
            <p className="text-muted text-xs uppercase">Submission</p>
            <p className="mt-1 font-medium">{riskCode}</p>
            <p className="text-muted mt-1 text-sm">
              {plan.strategy} treatment plan · Step {plan.approval.currentStep}
            </p>
          </div>
          <label className="block space-y-2" htmlFor="revision-scope">
            <span className="text-sm font-medium">What needs revision?</span>
            <select
              id="revision-scope"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
              value={scope}
              onChange={(event) => setScope(event.target.value as RevisionScope)}
            >
              <option value="both">Risk assessment and treatment plan</option>
              <option value="risk_assessment">Risk assessment</option>
              <option value="treatment_plan">Treatment plan</option>
            </select>
          </label>
          <label className="block space-y-2" htmlFor="revision-reason">
            <span className="text-sm font-medium">Revision reason</span>
            <Textarea
              id="revision-reason"
              maxLength={1000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Explain what must be corrected before resubmission."
            />
            <span className="text-muted block text-xs">{reason.length}/1000 characters · Minimum 10</span>
          </label>
          {message ? <Alert className="border-danger/25 bg-danger-soft text-danger">{message}</Alert> : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" disabled={mutation.isPending} onClick={close}>Keep reviewing</Button>
            <Button variant="danger" disabled={mutation.isPending} onClick={submit}>
              {mutation.isPending ? "Returning..." : "Return for revision"}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
