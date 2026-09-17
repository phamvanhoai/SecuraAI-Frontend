"use client";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/api-error";
import { useSubmitTreatmentPlan } from "../hooks/use-submit-treatment-plan";
import type { RiskDetail } from "../schemas/risk-detail-schema";

type TreatmentPlan = RiskDetail["treatmentPlans"][number];

function backendErrorCode(error: ApiError): string | undefined {
  if (typeof error.details !== "object" || error.details === null)
    return undefined;
  const envelope = error.details as { error?: { code?: unknown } };
  return typeof envelope.error?.code === "string"
    ? envelope.error.code
    : undefined;
}

const messages: Readonly<Record<string, string>> = {
  RISK_NOT_APPROVED:
    "The risk assessment must be approved before submitting its treatment plan.",
  TREATMENT_DESCRIPTION_REQUIRED:
    "Add a meaningful treatment plan description before submitting.",
  TREATMENT_OWNER_INVALID:
    "Assign an active owner to the treatment plan before submitting.",
  TREATMENT_TARGET_DATE_REQUIRED:
    "Set a target date for the treatment plan before submitting.",
  TREATMENT_TARGET_DATE_IN_PAST:
    "The treatment plan target date cannot be in the past.",
  TREATMENT_ACTIONS_REQUIRED:
    "This strategy requires at least one active treatment action.",
  TOO_MANY_TREATMENT_ACTIONS:
    "A treatment plan cannot be submitted with more than 100 actions.",
  TREATMENT_ACTION_ASSIGNEE_INVALID:
    "Every active treatment action must have an active assignee.",
  TREATMENT_ACTION_DUE_DATE_REQUIRED:
    "Every active treatment action must have a due date.",
  TREATMENT_ACTION_DUE_DATE_INVALID:
    "Action due dates must be current and no later than the plan target date.",
  TREATMENT_ACTION_ALREADY_STARTED:
    "Actions must be pending with zero progress when submitted.",
  TREATMENT_PLAN_ALREADY_SUBMITTED:
    "This treatment plan already has a pending approval request.",
  RISK_HAS_ACTIVE_TREATMENT_PLAN:
    "This risk assessment already has another active treatment plan.",
  APPROVAL_WORKFLOW_NOT_CONFIGURED:
    "The treatment plan approval workflow has not been configured.",
  APPROVAL_WORKFLOW_INVALID:
    "The treatment plan approval workflow is invalid.",
  MULTIPLE_ACTIVE_APPROVAL_WORKFLOWS:
    "More than one active treatment plan approval workflow is configured.",
  NO_ELIGIBLE_APPROVER:
    "One or more approval steps do not have enough active independent approvers.",
  TREATMENT_PLAN_CHANGED:
    "This plan changed after it was loaded. Close this dialog, reload, and try again.",
  TREATMENT_PLAN_SUBMISSION_TEMPORARILY_UNAVAILABLE:
    "Submission timed out. Please wait a moment and try again.",
};

export function SubmitTreatmentPlanDialog({
  plan,
  riskCode,
  onClose,
}: {
  plan: TreatmentPlan | null;
  riskCode: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string>();
  const mutation = useSubmitTreatmentPlan();
  const toast = useToast();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (plan && !dialog.open) dialog.showModal();
    if (!plan && dialog.open) dialog.close();
    setNote("");
    setMessage(undefined);
  }, [plan]);
  const close = (): void => {
    if (!mutation.isPending) onClose();
  };
  const submit = async (): Promise<void> => {
    if (!plan) return;
    setMessage(undefined);
    try {
      await mutation.mutateAsync({
        id: plan.id,
        input: {
          expectedUpdatedAt: plan.updatedAt,
          ...(note.trim() ? { submissionNote: note } : {}),
        },
      });
      toast.success(
        "Treatment plan submitted",
        `${riskCode} is now awaiting approval.`,
      );
      onClose();
    } catch (error: unknown) {
      const code = error instanceof ApiError ? backendErrorCode(error) : undefined;
      setMessage(
        (code ? messages[code] : undefined) ??
          (error instanceof Error
            ? error.message
            : "Unable to submit this treatment plan."),
      );
    }
  };
  return (
    <Dialog
      title="Submit Treatment Plan for Approval"
      dialogRef={ref}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={close}
    >
      {plan ? (
        <div className="space-y-4">
          <Alert>
            After submission, the plan and its actions cannot be edited until
            the approval process is completed.
          </Alert>
          <dl className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted text-xs uppercase">Risk</dt>
              <dd className="mt-1 font-medium">{riskCode}</dd>
            </div>
            <div>
              <dt className="text-muted text-xs uppercase">Strategy</dt>
              <dd className="mt-1 font-medium capitalize">{plan.strategy}</dd>
            </div>
            <div>
              <dt className="text-muted text-xs uppercase">Owner</dt>
              <dd className="mt-1 font-medium">
                {plan.owner?.fullName ?? "Unassigned"}
              </dd>
            </div>
            <div>
              <dt className="text-muted text-xs uppercase">Actions</dt>
              <dd className="mt-1 font-medium">{plan.actions.length}</dd>
            </div>
            <div>
              <dt className="text-muted text-xs uppercase">Target date</dt>
              <dd className="mt-1 font-medium">
                {plan.targetDate
                  ? new Intl.DateTimeFormat("en-GB").format(
                      new Date(plan.targetDate),
                    )
                  : "Not set"}
              </dd>
            </div>
          </dl>
          <label className="block space-y-2" htmlFor="submission-note">
            <span className="text-sm font-medium">Submission note (optional)</span>
            <textarea
              id="submission-note"
              className="min-h-24 w-full rounded-lg border border-border bg-background p-3 text-sm"
              maxLength={1000}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
            <span className="text-muted block text-xs">{note.length}/1000 characters</span>
          </label>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" disabled={mutation.isPending} onClick={close}>
              Keep editing
            </Button>
            <Button disabled={mutation.isPending} onClick={submit}>
              {mutation.isPending ? "Submitting…" : "Submit for approval"}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
