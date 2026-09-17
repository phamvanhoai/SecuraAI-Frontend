"use client";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/api-error";
import { useApproveTreatmentPlan } from "../hooks/use-approve-treatment-plan";
import type { RiskDetail } from "../schemas/risk-detail-schema";

type Plan = RiskDetail["treatmentPlans"][number];

function errorCode(error: ApiError): string | undefined {
  if (typeof error.details !== "object" || error.details === null) return undefined;
  const details = error.details as { error?: { code?: unknown } };
  return typeof details.error?.code === "string" ? details.error.code : undefined;
}

const messages: Readonly<Record<string, string>> = {
  SELF_APPROVAL_NOT_ALLOWED: "You cannot approve a treatment plan that you submitted.",
  NOT_CURRENT_APPROVER: "You are not an eligible approver for the current workflow step.",
  APPROVAL_ALREADY_RECORDED: "You have already approved this workflow step.",
  APPROVAL_REQUEST_NOT_PENDING: "This request has already been completed.",
  TREATMENT_PLAN_NOT_PENDING_APPROVAL: "This plan is no longer awaiting approval.",
  APPROVAL_SNAPSHOT_MISSING: "This legacy request must be resubmitted before it can be approved.",
  TREATMENT_PLAN_CHANGED_AFTER_SUBMISSION:
    "The plan changed after submission. It cannot be approved until it is reviewed and resubmitted.",
  TREATMENT_PLAN_NO_LONGER_VALID:
    "The plan no longer meets the approval requirements.",
  APPROVAL_TEMPORARILY_UNAVAILABLE: "Approval timed out. Please wait a moment and try again.",
};

export function ApproveTreatmentPlanDialog({ plan, riskCode, onClose }: {
  plan: Plan | null;
  riskCode: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<string>();
  const mutation = useApproveTreatmentPlan();
  const toast = useToast();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (plan && !dialog.open) dialog.showModal();
    if (!plan && dialog.open) dialog.close();
    setComment("");
    setMessage(undefined);
  }, [plan]);
  const close = (): void => {
    if (!mutation.isPending) onClose();
  };
  const approve = async (): Promise<void> => {
    if (!plan?.approval) return;
    setMessage(undefined);
    try {
      const result = await mutation.mutateAsync({
        id: plan.id,
        input: {
          approvalRequestId: plan.approval.id,
          ...(comment.trim() ? { comment } : {}),
        },
      });
      toast.success(
        result.approvalStatus === "approved" ? "Treatment plan approved" : "Approval recorded",
        result.approvalStatus === "approved"
          ? `${riskCode} completed its approval workflow.`
          : `Step ${result.currentStep} is now awaiting approval.`,
      );
      onClose();
    } catch (error: unknown) {
      const code = error instanceof ApiError ? errorCode(error) : undefined;
      setMessage(
        (code ? messages[code] : undefined) ??
          (error instanceof Error ? error.message : "Unable to approve this treatment plan."),
      );
    }
  };
  return (
    <Dialog
      title="Approve Risk Treatment Plan"
      dialogRef={ref}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClose={close}
    >
      {plan?.approval ? (
        <div className="space-y-4">
          <Alert>
            Confirm that the submitted plan, assigned actions, owners, and dates are appropriate for the risk.
          </Alert>
          <dl className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
            <div><dt className="text-muted text-xs uppercase">Risk</dt><dd className="mt-1 font-medium">{riskCode}</dd></div>
            <div><dt className="text-muted text-xs uppercase">Workflow step</dt><dd className="mt-1 font-medium">{plan.approval.currentStepName ?? `Step ${plan.approval.currentStep}`}</dd></div>
            <div><dt className="text-muted text-xs uppercase">Strategy</dt><dd className="mt-1 font-medium capitalize">{plan.strategy}</dd></div>
            <div><dt className="text-muted text-xs uppercase">Owner</dt><dd className="mt-1 font-medium">{plan.owner?.fullName ?? "Unassigned"}</dd></div>
            <div><dt className="text-muted text-xs uppercase">Target date</dt><dd className="mt-1 font-medium">{plan.targetDate ? new Intl.DateTimeFormat("en-GB").format(new Date(plan.targetDate)) : "Not set"}</dd></div>
            <div><dt className="text-muted text-xs uppercase">Actions</dt><dd className="mt-1 font-medium">{plan.actions.length}</dd></div>
          </dl>
          {plan.approval.submissionNote ? (
            <div className="rounded-lg border border-border bg-neutral-soft p-3 text-sm">
              <p className="font-medium">Submission note</p>
              <p className="text-muted mt-1 whitespace-pre-wrap">{plan.approval.submissionNote}</p>
            </div>
          ) : null}
          <label className="block space-y-2" htmlFor="approval-comment">
            <span className="text-sm font-medium">Approval comment (optional)</span>
            <Textarea id="approval-comment" maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} />
            <span className="text-muted block text-xs">{comment.length}/1000 characters</span>
          </label>
          {message ? <Alert className="border-danger/25 bg-danger-soft text-danger">{message}</Alert> : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" disabled={mutation.isPending} onClick={close}>Cancel</Button>
            <Button disabled={mutation.isPending} onClick={approve}>
              {mutation.isPending ? "Approving…" : "Approve plan"}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
