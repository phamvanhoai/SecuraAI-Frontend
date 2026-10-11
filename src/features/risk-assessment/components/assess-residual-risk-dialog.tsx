"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { GaugeCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAssessResidualRisk } from "../hooks/use-assess-residual-risk";
import { useRiskRecord } from "../hooks/use-risk-register";
import {
  assessResidualRiskSchema,
  type AssessResidualRiskInput,
} from "../schemas/assess-residual-risk-schema";
const levels = ["low", "medium", "high", "critical"] as const;
const rating = (score: number) =>
  score <= 4
    ? "Low"
    : score <= 9
      ? "Medium"
      : score <= 16
        ? "High"
        : "Critical";
export function AssessResidualRiskDialog({
  riskId,
  riskLabel,
  onClose,
}: {
  riskId: string | null;
  riskLabel: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const risk = useRiskRecord(riskId);
  const mutation = useAssessResidualRisk(riskId);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AssessResidualRiskInput>({
    resolver: zodResolver(assessResidualRiskSchema),
    defaultValues: {
      likelihood: 2,
      impact: 3,
      targetRisk: "low",
      riskAppetite: "medium",
      riskTolerance: "medium",
      assessmentReason: "",
    },
  });
  const [likelihood, impact] = useWatch({
    control,
    name: ["likelihood", "impact"],
  });
  const score = Number(likelihood) * Number(impact);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (riskId && !dialog.open) dialog.showModal();
    if (!riskId && dialog.open) dialog.close();
  }, [riskId]);
  const close = () => {
    reset();
    setMessage(undefined);
    onClose();
  };
  const submit = async (input: AssessResidualRiskInput) => {
    try {
      const result = await mutation.mutateAsync(input);
      close();
      toast.success(
        "Residual risk assessed",
        `${result.riskCode}: ${result.score} (${result.rating}); ${result.withinTolerance ? "within" : "outside"} tolerance.`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to assess residual risk.",
      );
    }
  };
  const ready = Boolean(
    risk.data?.latestAssessment?.inherentRating &&
    risk.data.controls.length &&
    risk.data.controls.every((item) => item.latestEffectiveness !== null),
  );
  return (
    <Dialog
      title="Assess Residual Risk"
      dialogRef={ref}
      onClose={close}
      className="max-h-[calc(100dvh-2rem)] w-[min(46rem,calc(100%-2rem))] overflow-y-auto"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
        <p className="text-muted text-sm">
          Assess remaining exposure for{" "}
          <strong className="text-foreground">{riskLabel}</strong> after
          considering implemented controls.
        </p>
        {message ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            {message}
          </Alert>
        ) : null}
        {risk.data ? (
          <section className="border-border rounded-lg border p-4">
            <p className="text-sm font-medium">Related control effectiveness</p>
            <ul className="mt-2 space-y-1 text-sm">
              {risk.data.controls.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>
                    {item.code} — {item.name}
                  </span>
                  <span className="tabular-nums">
                    {item.latestEffectiveness === null
                      ? "Not assessed"
                      : `${item.latestEffectiveness}%`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {risk.data && !ready ? (
          <Alert>
            Inherent risk and every related control effectiveness assessment are
            required first.
          </Alert>
        ) : null}
        <fieldset className="space-y-4" disabled={!ready || mutation.isPending}>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField id="residualLikelihood" label="Likelihood (1–5)">
              <Select
                id="residualLikelihood"
                {...register("likelihood", { valueAsNumber: true })}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="residualImpact" label="Impact (1–5)">
              <Select
                id="residualImpact"
                {...register("impact", { valueAsNumber: true })}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="bg-neutral-soft rounded-lg p-3">
              <p className="text-muted text-xs uppercase">Residual rating</p>
              <p className="mt-1 text-lg font-semibold">
                {score} — {rating(score)}
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {(["targetRisk", "riskAppetite", "riskTolerance"] as const).map(
              (name) => (
                <FormField
                  key={name}
                  id={name}
                  label={
                    name === "targetRisk"
                      ? "Target risk"
                      : name === "riskAppetite"
                        ? "Risk appetite"
                        : "Risk tolerance"
                  }
                >
                  <Select id={name} {...register(name)}>
                    {levels.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </Select>
                </FormField>
              ),
            )}
          </div>
          <FormField
            id="residualReason"
            label="Assessment basis"
            error={errors.assessmentReason?.message}
          >
            <Textarea
              id="residualReason"
              rows={4}
              {...register("assessmentReason")}
            />
          </FormField>
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" disabled={!ready || mutation.isPending}>
            <GaugeCircle className="size-4" aria-hidden="true" />
            {mutation.isPending ? "Saving…" : "Save residual assessment"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
