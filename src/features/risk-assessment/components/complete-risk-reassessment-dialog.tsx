"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCompleteRiskReassessment } from "../hooks/use-risk-reassessment-review";
import { completeRiskReassessmentFormSchema, type CompleteRiskReassessmentForm, type RiskReassessmentReviewItem } from "../schemas/risk-reassessment-review-schema";

export function CompleteRiskReassessmentDialog({ request, onClose }: { request: RiskReassessmentReviewItem | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null); const mutation = useCompleteRiskReassessment(); const toast = useToast();
  const form = useForm<CompleteRiskReassessmentForm>({ resolver: zodResolver(completeRiskReassessmentFormSchema), defaultValues: { residualLikelihood: 3, residualImpact: 3, controlEffectiveness: 0, assessmentReason: "", treatmentPlanId: "", treatmentPlanStatus: "active", targetDate: "" } });
  useEffect(() => { if (request) { const plan = request.risk.treatmentPlans[0]; form.reset({ residualLikelihood: 3, residualImpact: 3, controlEffectiveness: 0, assessmentReason: "", treatmentPlanId: plan?.id ?? "", treatmentPlanStatus: plan?.status === "completed" ? "completed" : plan?.status === "draft" ? "draft" : "active", targetDate: plan?.targetDate?.slice(0, 10) ?? "" }); ref.current?.showModal(); } else ref.current?.close(); }, [form, request]);
  const submit = async (values: CompleteRiskReassessmentForm) => { if (!request) return; try { const result = await mutation.mutateAsync({ requestId: request.id, values }); toast.success("Reassessment completed", `${request.risk.riskCode} is now ${result.residualRating} (${result.residualScore}).`); onClose(); } catch { /* visible below */ } };
  return <Dialog title="Reassess residual risk and update treatment plan" dialogRef={ref} onClose={onClose} className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto">{request ? <form className="space-y-5" noValidate onSubmit={form.handleSubmit(submit)}>
    <Alert>{request.risk.riskCode} — {request.risk.title}. This decision completes the incident reassessment request.</Alert>
    {mutation.isError ? <Alert className="border-danger/25 bg-danger-soft text-danger">{mutation.error instanceof Error ? mutation.error.message : "Unable to complete reassessment."}</Alert> : null}
    <div className="grid gap-4 sm:grid-cols-3"><FormField id="rr-likelihood" label="Residual likelihood" error={form.formState.errors.residualLikelihood?.message}><Select id="rr-likelihood" {...form.register("residualLikelihood", { valueAsNumber: true })}>{[1,2,3,4,5].map((v)=><option key={v} value={v}>{v}</option>)}</Select></FormField><FormField id="rr-impact" label="Residual impact" error={form.formState.errors.residualImpact?.message}><Select id="rr-impact" {...form.register("residualImpact", { valueAsNumber: true })}>{[1,2,3,4,5].map((v)=><option key={v} value={v}>{v}</option>)}</Select></FormField><FormField id="rr-effectiveness" label="Control effectiveness (%)" error={form.formState.errors.controlEffectiveness?.message}><Input id="rr-effectiveness" type="number" min={0} max={100} {...form.register("controlEffectiveness", { valueAsNumber: true })} /></FormField></div>
    <FormField id="rr-reason" label="Assessment rationale" error={form.formState.errors.assessmentReason?.message}><Textarea id="rr-reason" className="min-h-28" maxLength={5000} {...form.register("assessmentReason")} /></FormField>
    <div className="grid gap-4 sm:grid-cols-3"><FormField id="rr-plan" label="Treatment plan" error={form.formState.errors.treatmentPlanId?.message}><Select id="rr-plan" {...form.register("treatmentPlanId")}><option value="">Select a plan</option>{request.risk.treatmentPlans.map((p)=><option key={p.id} value={p.id}>{p.title}</option>)}</Select></FormField><FormField id="rr-plan-status" label="Plan status" error={form.formState.errors.treatmentPlanStatus?.message}><Select id="rr-plan-status" {...form.register("treatmentPlanStatus")}><option value="draft">Draft</option><option value="active">Active</option><option value="completed">Completed</option></Select></FormField><FormField id="rr-target" label="Target date" error={form.formState.errors.targetDate?.message}><Input id="rr-target" type="date" {...form.register("targetDate")} /></FormField></div>
    <p className="text-muted text-sm">The assessment and treatment-plan update are saved together. This does not automatically accept or close the risk.</p>
    <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={mutation.isPending || request.risk.treatmentPlans.length === 0}>{mutation.isPending ? "Saving…" : "Complete reassessment"}</Button></div>
  </form> : null}</Dialog>;
}
