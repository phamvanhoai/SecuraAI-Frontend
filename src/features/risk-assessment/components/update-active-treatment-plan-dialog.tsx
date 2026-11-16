"use client";

import { useEffect, useRef } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { hasPendingAcceptance, PENDING_ACCEPTANCE_MESSAGE } from "../pending-acceptance";
import { useRiskRecord } from "../hooks/use-risk-register";
import { UpdateRiskTreatmentPlanDialog } from "./update-risk-treatment-plan-dialog";

export function UpdateActiveTreatmentPlanDialog({
  riskId,
  planId,
  onClose,
}: {
  riskId: string | null;
  planId: string | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const detail = useRiskRecord(riskId);
  const plan = detail.data?.treatmentPlans.find((item) => item.id === planId);
  const pendingAcceptance = hasPendingAcceptance(detail.data);
  const blocked = Boolean(detail.data && (
    ["accepted", "closed", "archived"].includes(detail.data.status) ||
    pendingAcceptance ||
    (plan && !["draft", "active"].includes(plan.status))
  ));

  useEffect(() => {
    const dialog = ref.current;
    if (riskId && (!plan || blocked) && dialog && !dialog.open) dialog.showModal();
    if ((!riskId || (plan && !blocked)) && dialog?.open) dialog.close();
  }, [plan, riskId, blocked]);

  if (plan && !blocked) return <UpdateRiskTreatmentPlanDialog plan={plan} onClose={onClose} />;

  return (
    <Dialog
      dialogRef={ref}
      title="Update Risk Treatment Plan"
      onClose={onClose}
      className="w-[min(36rem,calc(100%-2rem))]"
    >
      {pendingAcceptance ? <Alert className="border-warning/30 bg-warning-soft text-warning">{PENDING_ACCEPTANCE_MESSAGE}</Alert> : blocked ? <Alert>This Risk or plan is read-only. Open Risk Review for an Accepted Risk before updating an eligible plan.</Alert> : detail.isError ? (
        <Alert className="border-danger/25 bg-danger-soft text-danger">
          Unable to load the active treatment plan. Close this dialog and try again.
        </Alert>
      ) : (
        <p className="text-muted py-8 text-center" role="status">
          Loading treatment plan…
        </p>
      )}
      <div className="mt-5 flex justify-end">
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
}
