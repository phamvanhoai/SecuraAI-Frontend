"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  AlertCircle,
  Calendar,
  ClipboardList,
  Gauge,
  GaugeCircle,
  Info,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCompleteRiskReassessment } from "../hooks/use-risk-reassessment-review";
import {
  completeRiskReassessmentFormSchema,
  type CompleteRiskReassessmentForm,
  type RiskReassessmentReviewItem,
} from "../schemas/risk-reassessment-review-schema";

// ─── Score preview helper ─────────────────────────────────────────────────────

function scoreLabel(score: number): { label: string; className: string } {
  if (score >= 20) return { label: "Critical", className: "text-danger" };
  if (score >= 12) return { label: "High", className: "text-warning" };
  if (score >= 6) return { label: "Medium", className: "text-info" };
  return { label: "Low", className: "text-muted" };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CompleteRiskReassessmentDialog({
  request,
  onClose,
}: {
  request: RiskReassessmentReviewItem | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const mutation = useCompleteRiskReassessment();
  const toast = useToast();

  const form = useForm<CompleteRiskReassessmentForm>({
    resolver: zodResolver(completeRiskReassessmentFormSchema),
    defaultValues: {
      residualLikelihood: 3,
      residualImpact: 3,
      controlEffectiveness: 0,
      assessmentReason: "",
      treatmentPlanId: "",
      treatmentPlanStatus: "active",
      targetDate: "",
    },
  });

  const likelihood = form.watch("residualLikelihood");
  const impact = form.watch("residualImpact");
  const rawScore = Number(likelihood) * Number(impact);
  const { label: ratingLabel, className: ratingClass } = scoreLabel(rawScore);

  useEffect(() => {
    if (request) {
      const plan = request.risk.treatmentPlans[0];
      form.reset({
        residualLikelihood: 3,
        residualImpact: 3,
        controlEffectiveness: 0,
        assessmentReason: "",
        treatmentPlanId: plan?.id ?? "",
        treatmentPlanStatus:
          plan?.status === "completed"
            ? "completed"
            : plan?.status === "draft"
              ? "draft"
              : "active",
        targetDate: plan?.targetDate?.slice(0, 10) ?? "",
      });
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [form, request]);

  const submit = async (values: CompleteRiskReassessmentForm) => {
    if (!request) return;
    try {
      const result = await mutation.mutateAsync({
        requestId: request.id,
        values,
      });
      toast.success(
        "Reassessment completed",
        `${request.risk.riskCode} is now ${result.residualRating} (score: ${result.residualScore}).`,
      );
      onClose();
    } catch {
      /* Error rendered below */
    }
  };

  const hasTreatmentPlans = (request?.risk.treatmentPlans.length ?? 0) > 0;
  const inherent = request?.risk.latestInherentAssessment ?? null;

  return (
    <Dialog
      title="Reassess Residual Risk &amp; Update Treatment Plan"
      dialogRef={ref}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100%-2rem))] overflow-y-auto"
    >
      {request ? (
        <form
          className="space-y-6"
          noValidate
          onSubmit={form.handleSubmit(submit)}
        >
          {/* ── Mutation error ───────────────────────────────────────── */}
          {mutation.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "Unable to complete reassessment. Please try again."}
            </Alert>
          ) : null}

          {/* ── Context bar ──────────────────────────────────────────── */}
          <div className="border-border bg-neutral-soft/30 text-muted rounded-lg border p-3.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <ShieldCheck
                  aria-hidden="true"
                  className="text-brand size-3.5 shrink-0"
                />
                <span className="text-foreground min-w-0 font-semibold break-words">
                  {request.risk.riskCode} — {request.risk.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Incident:</span>
                <span className="font-mono">
                  {request.incident.incidentCode}
                </span>
              </div>
            </div>
            {inherent ? (
              <div className="border-border mt-2.5 flex flex-wrap gap-4 border-t pt-2.5">
                <span>
                  Current inherent rating:{" "}
                  <strong className="text-foreground">
                    {inherent.rating
                      ? inherent.rating
                          .replaceAll("_", " ")
                          .replace(/^./, (l) => l.toUpperCase())
                      : "Not assessed"}
                  </strong>
                </span>
                {inherent.likelihood !== null && inherent.impact !== null ? (
                  <span>
                    L×I:{" "}
                    <strong className="text-foreground font-mono">
                      {inherent.likelihood} × {inherent.impact} ={" "}
                      {inherent.likelihood * inherent.impact}
                    </strong>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* ── Section 1: Residual risk scoring ─────────────────────── */}
          <div className="space-y-4">
            <div className="border-border flex items-center gap-2 border-b pb-2">
              <Gauge aria-hidden="true" className="text-brand size-4" />
              <h3 className="text-foreground text-sm font-semibold">
                1. Residual Risk Scoring
              </h3>
            </div>

            {/* Info hint */}
            <div className="border-info/20 bg-info-soft/40 text-foreground flex items-start gap-2.5 rounded-lg border p-3 text-xs">
              <Info
                aria-hidden="true"
                className="text-info mt-0.5 size-4 shrink-0"
              />
              <span>
                Residual risk reflects the remaining exposure <em>after</em>{" "}
                controls are applied. Score it independently from the inherent
                rating above.
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                id="rr-likelihood"
                label="Residual likelihood (1–5)"
                error={form.formState.errors.residualLikelihood?.message}
              >
                <Select
                  id="rr-likelihood"
                  {...form.register("residualLikelihood", {
                    valueAsNumber: true,
                  })}
                >
                  {[1, 2, 3, 4, 5].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                id="rr-impact"
                label="Residual impact (1–5)"
                error={form.formState.errors.residualImpact?.message}
              >
                <Select
                  id="rr-impact"
                  {...form.register("residualImpact", { valueAsNumber: true })}
                >
                  {[1, 2, 3, 4, 5].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                id="rr-effectiveness"
                label="Control effectiveness (%)"
                error={form.formState.errors.controlEffectiveness?.message}
              >
                <Input
                  id="rr-effectiveness"
                  type="number"
                  min={0}
                  max={100}
                  {...form.register("controlEffectiveness", {
                    valueAsNumber: true,
                  })}
                />
              </FormField>
            </div>

            {/* Live score preview */}
            <div className="border-border bg-surface flex items-center justify-between rounded-lg border px-4 py-3">
              <span className="text-muted text-sm">
                Projected residual score
              </span>
              <span className="flex items-center gap-2 text-sm font-semibold tabular-nums">
                <GaugeCircle
                  aria-hidden="true"
                  className={`size-4 ${ratingClass}`}
                  strokeWidth={1.8}
                />
                <span className="text-foreground font-mono">{rawScore}</span>
                <span className={`text-xs ${ratingClass}`}>
                  ({ratingLabel})
                </span>
              </span>
            </div>
          </div>

          {/* ── Section 2: Assessment rationale ──────────────────────── */}
          <div className="space-y-4">
            <div className="border-border flex items-center gap-2 border-b pb-2">
              <ClipboardList aria-hidden="true" className="text-brand size-4" />
              <h3 className="text-foreground text-sm font-semibold">
                2. Assessment Rationale
              </h3>
            </div>

            <FormField
              id="rr-reason"
              label="Rationale *"
              error={form.formState.errors.assessmentReason?.message}
            >
              <Textarea
                id="rr-reason"
                className="min-h-28"
                maxLength={5000}
                placeholder="Describe why this residual score is appropriate given the current controls and incident context. Minimum 20 characters."
                {...form.register("assessmentReason")}
              />
            </FormField>
          </div>

          {/* ── Section 3: Treatment plan update ─────────────────────── */}
          <div className="space-y-4">
            <div className="border-border flex items-center gap-2 border-b pb-2">
              <Calendar aria-hidden="true" className="text-brand size-4" />
              <div>
                <h3 className="text-foreground text-sm font-semibold">
                  3. Treatment Plan Update
                </h3>
                <p className="text-muted text-xs">
                  Select the treatment plan to update and confirm its current
                  status and target date.
                </p>
              </div>
            </div>

            {!hasTreatmentPlans ? (
              <div className="border-warning/20 bg-warning-soft text-foreground flex items-start gap-2.5 rounded-lg border p-3 text-xs">
                <AlertCircle
                  aria-hidden="true"
                  className="text-warning mt-0.5 size-4 shrink-0"
                />
                <div>
                  <p className="font-semibold">No treatment plans linked</p>
                  <p className="text-muted mt-0.5">
                    A treatment plan must be linked to this risk before
                    reassessment can be completed. Create one in the Risk
                    Register first.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                id="rr-plan"
                label="Treatment plan *"
                error={form.formState.errors.treatmentPlanId?.message}
              >
                <Select
                  id="rr-plan"
                  disabled={!hasTreatmentPlans}
                  {...form.register("treatmentPlanId")}
                >
                  <option value="">Select a plan</option>
                  {request.risk.treatmentPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField
                id="rr-plan-status"
                label="Plan status"
                error={form.formState.errors.treatmentPlanStatus?.message}
              >
                <Select
                  id="rr-plan-status"
                  disabled={!hasTreatmentPlans}
                  {...form.register("treatmentPlanStatus")}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </Select>
              </FormField>

              <FormField
                id="rr-target"
                label="Target date"
                error={form.formState.errors.targetDate?.message}
              >
                <Input
                  id="rr-target"
                  type="date"
                  disabled={!hasTreatmentPlans}
                  {...form.register("targetDate")}
                />
              </FormField>
            </div>
          </div>

          {/* ── Disclaimer note ───────────────────────────────────────── */}
          <p className="text-muted text-sm">
            The reassessment and treatment-plan update are saved together. This
            does not automatically accept or close the risk.
          </p>

          {/* ── Footer actions ────────────────────────────────────────── */}
          <div className="border-border flex items-center justify-between border-t pt-4">
            <div />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || !hasTreatmentPlans}
                className="flex items-center gap-2"
                title={
                  !hasTreatmentPlans
                    ? "Link a treatment plan to this risk before completing the reassessment"
                    : undefined
                }
              >
                {mutation.isPending ? (
                  <>
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                    Saving…
                  </>
                ) : (
                  <>
                    <ShieldCheck aria-hidden="true" className="size-4" />
                    Complete reassessment
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
