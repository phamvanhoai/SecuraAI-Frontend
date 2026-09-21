"use client";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/api-error";
import { useCancelTreatmentPlan } from "../hooks/use-cancel-treatment-plan";
import type { TreatmentPlanDetail } from "../schemas/treatment-plan-detail-schema";

function errorCode(error: ApiError): string | undefined {
  if (typeof error.details !== "object" || error.details === null) return undefined;
  const value = error.details as { error?: { code?: unknown } };
  return typeof value.error?.code === "string" ? value.error.code : undefined;
}

export function CancelTreatmentPlanDialog({ plan, open, onClose }: {
  plan: TreatmentPlanDetail;
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string>();
  const mutation = useCancelTreatmentPlan(plan.id);
  const toast = useToast();
  const normalized = reason.normalize("NFKC").replace(/\s+/gu, " ").trim();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  const close = (): void => {
    if (mutation.isPending) return;
    setReason("");
    setMessage(undefined);
    onClose();
  };
  const submit = async (): Promise<void> => {
    if (normalized.length < 10) return;
    setMessage(undefined);
    try {
      await mutation.mutateAsync({ id: plan.id, data: { expectedUpdatedAt: plan.updatedAt, reason: normalized } });
      toast.success("Treatment plan cancelled", plan.risk.riskCode);
      setReason("");
      setMessage(undefined);
      onClose();
    } catch (error: unknown) {
      const code = error instanceof ApiError ? errorCode(error) : undefined;
      if (code === "TREATMENT_PLAN_CHANGED") setMessage("This plan changed after the page loaded. Reload and try again.");
      else if (code === "TREATMENT_ACTION_ALREADY_STARTED") setMessage("This plan has an action that already started and cannot be cancelled.");
      else if (code === "TREATMENT_PLAN_NOT_CANCELLABLE") setMessage("Only draft or rejected plans can be cancelled.");
      else if (code === "RISK_ASSESSMENT_NOT_CANCELLABLE") setMessage("The linked risk assessment is no longer editable.");
      else setMessage(error instanceof Error ? error.message : "Unable to cancel treatment plan.");
    }
  };
  return <Dialog title="Cancel Risk Treatment Plan" dialogRef={ref} onClose={close} onCancel={(event) => { event.preventDefault(); close(); }}>
    <div className="space-y-4">
      <Alert className="border-danger/25 bg-danger-soft text-danger">Cancelling this plan preserves its audit and approval history. It cannot continue through the normal workflow.</Alert>
      <div><p className="font-medium">{plan.risk.riskCode} — {plan.risk.title}</p><p className="text-muted text-sm">Only plans whose actions have not started can be cancelled.</p></div>
      <label className="block space-y-2" htmlFor="treatment-plan-cancel-reason"><span className="text-sm font-medium">Cancellation reason <span className="text-danger">*</span></span><textarea id="treatment-plan-cancel-reason" className="border-border bg-background min-h-28 w-full rounded-lg border p-3 text-sm" maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} /><span className={normalized.length > 0 && normalized.length < 10 ? "text-danger block text-xs" : "text-muted block text-xs"}>{normalized.length > 0 && normalized.length < 10 ? "Enter at least 10 characters." : `${reason.length}/1000 characters`}</span></label>
      {message ? <Alert className="border-danger/25 bg-danger-soft text-danger">{message}</Alert> : null}
      <div className="flex justify-end gap-2"><Button type="button" variant="secondary" disabled={mutation.isPending} onClick={close}>Keep plan</Button><Button type="button" variant="danger" disabled={mutation.isPending || normalized.length < 10} onClick={() => void submit()}>{mutation.isPending ? "Cancelling..." : "Cancel plan"}</Button></div>
    </div>
  </Dialog>;
}
