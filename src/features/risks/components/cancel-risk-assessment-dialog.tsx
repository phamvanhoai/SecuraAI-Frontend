"use client";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/api-error";
import { useCancelRiskAssessment } from "../hooks/use-cancel-risk-assessment";
import type { RiskListItem } from "../schemas/risk-list-schema";

function backendErrorCode(error: ApiError): string | undefined {
  if (typeof error.details !== "object" || error.details === null)
    return undefined;
  const envelope = error.details as { error?: { code?: unknown } };
  return typeof envelope.error?.code === "string"
    ? envelope.error.code
    : undefined;
}

export function CancelRiskAssessmentDialog({
  risk,
  onClose,
}: {
  risk: RiskListItem | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string>();
  const mutation = useCancelRiskAssessment();
  const toast = useToast();
  const trimmed = reason.trim();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (risk && !dialog.open) dialog.showModal();
    if (!risk && dialog.open) dialog.close();
    setReason("");
    setMessage(undefined);
  }, [risk]);

  function close(): void {
    if (!mutation.isPending) onClose();
  }

  async function submit(): Promise<void> {
    if (!risk || trimmed.length < 10) return;
    setMessage(undefined);
    try {
      await mutation.mutateAsync({
        id: risk.id,
        input: { reason: trimmed, expectedUpdatedAt: risk.updatedAt },
      });
      onClose();
      toast.success("Risk assessment cancelled", risk.riskCode);
    } catch (error: unknown) {
      const code =
        error instanceof ApiError ? backendErrorCode(error) : undefined;
      if (code === "RISK_HAS_TREATMENT_PLAN")
        setMessage(
          "This assessment has a treatment plan and cannot be cancelled.",
        );
      else if (code === "RISK_ASSESSMENT_CHANGED")
        setMessage(
          "This assessment changed after the page loaded. Close this dialog, refresh, and try again.",
        );
      else if (code === "RISK_NOT_CANCELLABLE")
        setMessage("Only draft or rejected assessments can be cancelled.");
      else
        setMessage(
          "Unable to cancel this assessment. Check your permissions and try again.",
        );
    }
  }

  return (
    <Dialog
      title="Cancel Risk Assessment"
      dialogRef={ref}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={close}
    >
      {risk ? (
        <div className="space-y-4">
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            Cancelling <strong>{risk.riskCode}</strong> preserves its history
            but prevents further editing. This action cannot be undone in the
            normal workflow.
          </Alert>
          <div>
            <p className="text-sm font-medium">{risk.title}</p>
            <p className="text-muted mt-1 text-xs">
              {risk.target.code} — {risk.target.name}
            </p>
          </div>
          <label className="block space-y-2" htmlFor="risk-cancellation-reason">
            <span className="text-sm font-medium">
              Cancellation reason{" "}
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </span>
            <textarea
              id="risk-cancellation-reason"
              className="border-border bg-background min-h-28 w-full rounded-lg border p-3 text-sm"
              maxLength={1000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              aria-describedby="risk-cancellation-help"
            />
            <span
              id="risk-cancellation-help"
              className={
                trimmed.length > 0 && trimmed.length < 10
                  ? "text-danger block text-xs"
                  : "text-muted block text-xs"
              }
            >
              {trimmed.length > 0 && trimmed.length < 10
                ? "Enter at least 10 characters."
                : `${reason.length}/1000 characters`}
            </span>
          </label>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              disabled={mutation.isPending}
              onClick={close}
            >
              Keep assessment
            </Button>
            <Button
              variant="danger"
              disabled={trimmed.length < 10 || mutation.isPending}
              onClick={submit}
            >
              {mutation.isPending ? "Cancelling..." : "Cancel assessment"}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
