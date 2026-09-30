"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Gauge } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAssessInherentRisk } from "../hooks/use-assess-inherent-risk";
import { useRiskRecord } from "../hooks/use-risk-register";
import {
  assessInherentRiskSchema,
  type AssessInherentRiskInput,
} from "../schemas/assess-inherent-risk-schema";

const rating = (score: number) =>
  score <= 4
    ? "Low"
    : score <= 9
      ? "Medium"
      : score <= 16
        ? "High"
        : "Critical";
export function AssessInherentRiskDialog({
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
  const mutation = useAssessInherentRisk(riskId);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AssessInherentRiskInput>({
    resolver: zodResolver(assessInherentRiskSchema),
    defaultValues: { likelihood: 3, impact: 3, assessmentReason: "" },
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
  const submit = async (input: AssessInherentRiskInput) => {
    try {
      const result = await mutation.mutateAsync(input);
      close();
      toast.success(
        "Inherent risk assessed",
        `${result.riskCode}: ${result.score} (${result.rating}).`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to assess inherent risk.",
      );
    }
  };
  const contextComplete = Boolean(
    risk.data?.assets.length &&
    risk.data.threats.length &&
    risk.data.vulnerabilities.length,
  );
  return (
    <Dialog
      title="Assess Inherent Risk"
      dialogRef={ref}
      onClose={close}
      className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
        <p className="text-muted text-sm">
          Assess exposure before considering existing security-control
          effectiveness for{" "}
          <strong className="text-foreground">{riskLabel}</strong>.
        </p>
        {message ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            {message}
          </Alert>
        ) : null}
        {risk.isError ? <Alert>Unable to load the risk context.</Alert> : null}
        {risk.data ? (
          <section className="border-border grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
            <div>
              <p className="text-muted text-xs font-medium uppercase">
                Assets / criticality
              </p>
              <p className="mt-1 text-sm">
                {risk.data.assets
                  .map((item) => `${item.name} (${item.criticality})`)
                  .join(", ") || "None"}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs font-medium uppercase">
                Threats
              </p>
              <p className="mt-1 text-sm">
                {risk.data.threats.map((item) => item.name).join(", ") ||
                  "None"}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs font-medium uppercase">
                Vulnerabilities
              </p>
              <p className="mt-1 text-sm">
                {risk.data.vulnerabilities
                  .map((item) => item.name)
                  .join(", ") || "None"}
              </p>
            </div>
          </section>
        ) : null}
        {risk.data && !contextComplete ? (
          <Alert>
            Document at least one asset, threat, and vulnerability before
            assessing inherent risk.
          </Alert>
        ) : null}
        <fieldset
          className="space-y-4"
          disabled={mutation.isPending || !contextComplete}
        >
          <legend className="sr-only">Inherent risk values</legend>
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_12rem]">
            <FormField id="inherentLikelihood" label="Likelihood (1–5)">
              <Select id="inherentLikelihood" {...register("likelihood", { valueAsNumber: true })}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="inherentImpact" label="Potential impact (1–5)">
              <Select id="inherentImpact" {...register("impact", { valueAsNumber: true })}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="bg-neutral-soft rounded-lg p-3">
              <p className="text-muted text-xs font-medium uppercase">
                Calculated rating
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {score} — {rating(score)}
              </p>
            </div>
          </div>
          <FormField
            id="inherentReason"
            label="Assessment basis"
            error={errors.assessmentReason?.message}
          >
            <Textarea
              id="inherentReason"
              rows={4}
              maxLength={3000}
              {...register("assessmentReason")}
            />
          </FormField>
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending || risk.isPending || !contextComplete}
          >
            <Gauge className="size-4" aria-hidden="true" />
            {mutation.isPending ? "Saving…" : "Save assessment"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
