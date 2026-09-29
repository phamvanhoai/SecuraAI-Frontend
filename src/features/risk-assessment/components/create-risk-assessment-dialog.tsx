"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRiskAssessment, useRiskCreateOptions } from "../hooks/use-create-risk-assessment";
import { createRiskAssessmentSchema, type CreateRiskAssessmentForm, type CreateRiskAssessmentInput, type CreateRiskAssessmentRequest } from "../schemas/create-risk-assessment-schema";

const tomorrow = () => { const date = new Date(); date.setDate(date.getDate() + 1); return date.toISOString().slice(0, 10); };
const defaults: CreateRiskAssessmentInput = { scopeType: "asset", scopeId: "", title: "", description: "", ownerUserId: "", reviewDate: tomorrow(), threatName: "", threatDescription: "", vulnerabilityName: "", vulnerabilityDescription: "", inherentLikelihood: 3, inherentImpact: 3, controlEffectiveness: 0, residualLikelihood: 3, residualImpact: 3, targetRisk: "low", assessmentReason: "" };
const scoreLabel = (a: number, b: number) => { const score = a * b; return `${score} — ${score <= 4 ? "Low" : score <= 9 ? "Medium" : score <= 16 ? "High" : "Critical"}`; };
const RatingFields = ({ prefix, register }: { prefix: "inherent" | "residual"; register: ReturnType<typeof useForm<CreateRiskAssessmentInput, unknown, CreateRiskAssessmentForm>>["register"] }) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <FormField id={`${prefix}Likelihood`} label="Likelihood (1–5)"><Select id={`${prefix}Likelihood`} {...register(`${prefix}Likelihood`)}>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value}</option>)}</Select></FormField>
    <FormField id={`${prefix}Impact`} label="Impact (1–5)"><Select id={`${prefix}Impact`} {...register(`${prefix}Impact`)}>{[1,2,3,4,5].map((value) => <option key={value} value={value}>{value}</option>)}</Select></FormField>
  </div>
);

export function CreateRiskAssessmentDialog() {
  const [open, setOpen] = useState(false); const [message, setMessage] = useState<string>(); const ref = useRef<HTMLDialogElement>(null);
  const options = useRiskCreateOptions(open); const mutation = useCreateRiskAssessment(); const toast = useToast();
  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<CreateRiskAssessmentInput, unknown, CreateRiskAssessmentForm>({ resolver: zodResolver(createRiskAssessmentSchema), defaultValues: defaults });
  const [scopeType, il, ii, rl, ri] = useWatch({ control, name: ["scopeType", "inherentLikelihood", "inherentImpact", "residualLikelihood", "residualImpact"] });
  useEffect(() => { const dialog = ref.current; if (!dialog) return; if (open && !dialog.open) dialog.showModal(); if (!open && dialog.open) dialog.close(); }, [open]);
  const close = () => { setOpen(false); setMessage(undefined); };
  const submit = async (values: CreateRiskAssessmentForm) => {
    const request: CreateRiskAssessmentRequest = {
      title: values.title, description: values.description, ownerUserId: values.ownerUserId, reviewDate: values.reviewDate,
      scope: values.scopeType === "asset" ? { type: "asset", assetId: values.scopeId } : { type: "business_service", businessServiceId: values.scopeId },
      threats: [{ name: values.threatName, ...(values.threatDescription ? { description: values.threatDescription } : {}) }],
      vulnerabilities: [{ name: values.vulnerabilityName, ...(values.vulnerabilityDescription ? { description: values.vulnerabilityDescription } : {}) }],
      inherentLikelihood: values.inherentLikelihood, inherentImpact: values.inherentImpact, controlEffectiveness: values.controlEffectiveness,
      residualLikelihood: values.residualLikelihood, residualImpact: values.residualImpact, targetRisk: values.targetRisk,
      ...(values.riskAppetite ? { riskAppetite: values.riskAppetite } : {}), ...(values.riskTolerance ? { riskTolerance: values.riskTolerance } : {}), assessmentReason: values.assessmentReason,
    };
    try { const created = await mutation.mutateAsync(request); reset(defaults); close(); toast.success("Risk assessment created", `${created.riskCode} is now in the risk register.`); }
    catch (error: unknown) { setMessage(error instanceof Error ? error.message : "Unable to create risk assessment."); }
  };
  const scopeItems = scopeType === "asset" ? options.data?.assets.map((item) => ({ id: item.id, label: `${item.code} — ${item.name}` })) : options.data?.businessServices.map((item) => ({ id: item.id, label: `${item.name} (${item.assetCount} active assets)` }));
  return <>
    <Button type="button" onClick={() => setOpen(true)}><Plus className="size-4" aria-hidden="true" />Create assessment</Button>
    <Dialog title="Create Risk Assessment" dialogRef={ref} onClose={close} className="max-h-[90vh] w-[min(56rem,calc(100%-2rem))] overflow-y-auto">
      <form className="space-y-6" noValidate onSubmit={handleSubmit(submit)}>
        {message ? <Alert className="border-danger/25 bg-danger-soft text-danger">{message}</Alert> : null}
        {options.isError ? <Alert>Unable to load active assets, services, and owners.</Alert> : null}
        <section className="space-y-4"><h3 className="font-semibold">Scope and ownership</h3><div className="grid gap-4 sm:grid-cols-2">
          <FormField id="scopeType" label="Assessment scope"><Select id="scopeType" {...register("scopeType", { onChange: () => setValue("scopeId", "") })}><option value="asset">Asset</option><option value="business_service">Business service</option></Select></FormField>
          <FormField id="scopeId" label={scopeType === "asset" ? "Asset" : "Business service"} error={errors.scopeId?.message}><Select id="scopeId" aria-invalid={Boolean(errors.scopeId)} {...register("scopeId")}><option value="">Select scope</option>{scopeItems?.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></FormField>
          <FormField id="ownerUserId" label="Risk owner" error={errors.ownerUserId?.message}><Select id="ownerUserId" {...register("ownerUserId")}><option value="">Select owner</option>{options.data?.owners.map((item) => <option key={item.id} value={item.id}>{item.fullName} — {item.email}</option>)}</Select></FormField>
          <FormField id="reviewDate" label="Review date" error={errors.reviewDate?.message}><Input id="reviewDate" type="date" min={tomorrow()} {...register("reviewDate")} /></FormField>
        </div></section>
        <section className="space-y-4"><h3 className="font-semibold">Risk context</h3><FormField id="title" label="Risk title" error={errors.title?.message}><Input id="title" maxLength={255} {...register("title")} /></FormField><FormField id="description" label="Context and scope" error={errors.description?.message}><Textarea id="description" rows={3} maxLength={5000} {...register("description")} /></FormField></section>
        <section className="grid gap-5 lg:grid-cols-2"><div className="space-y-3"><h3 className="font-semibold">Threat</h3><FormField id="threatName" label="Threat name" error={errors.threatName?.message}><Input id="threatName" {...register("threatName")} /></FormField><FormField id="threatDescription" label="Threat details (optional)"><Textarea id="threatDescription" rows={2} {...register("threatDescription")} /></FormField></div><div className="space-y-3"><h3 className="font-semibold">Vulnerability</h3><FormField id="vulnerabilityName" label="Vulnerability name" error={errors.vulnerabilityName?.message}><Input id="vulnerabilityName" {...register("vulnerabilityName")} /></FormField><FormField id="vulnerabilityDescription" label="Vulnerability details (optional)"><Textarea id="vulnerabilityDescription" rows={2} {...register("vulnerabilityDescription")} /></FormField></div></section>
        <section className="space-y-4"><h3 className="font-semibold">Initial evaluation</h3><div className="grid gap-5 lg:grid-cols-2"><div><p className="mb-3 text-sm font-medium">Inherent risk <span className="text-muted">({scoreLabel(Number(il), Number(ii))})</span></p><RatingFields prefix="inherent" register={register} /></div><div><p className="mb-3 text-sm font-medium">Residual risk <span className="text-muted">({scoreLabel(Number(rl), Number(ri))})</span></p><RatingFields prefix="residual" register={register} /></div></div><div className="grid gap-4 sm:grid-cols-3"><FormField id="controlEffectiveness" label="Control effectiveness (%)" error={errors.controlEffectiveness?.message}><Input id="controlEffectiveness" type="number" min={0} max={100} {...register("controlEffectiveness")} /></FormField><FormField id="targetRisk" label="Target risk"><Select id="targetRisk" {...register("targetRisk")}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></Select></FormField><FormField id="riskAppetite" label="Risk appetite (optional)"><Select id="riskAppetite" {...register("riskAppetite")}><option value="">Not set</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></Select></FormField></div><FormField id="assessmentReason" label="Assessment basis" error={errors.assessmentReason?.message}><Textarea id="assessmentReason" rows={3} {...register("assessmentReason")} /></FormField></section>
        <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={close}>Cancel</Button><Button type="submit" disabled={mutation.isPending || options.isPending}>{mutation.isPending ? "Creating…" : "Create assessment"}</Button></div>
      </form>
    </Dialog>
  </>;
}
