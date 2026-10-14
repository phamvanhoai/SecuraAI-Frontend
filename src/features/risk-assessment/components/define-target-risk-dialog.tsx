"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Target } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDefineTargetRisk } from "../hooks/use-define-target-risk";
import { useRiskRecord } from "../hooks/use-risk-register";
import {
  defineTargetRiskSchema,
  type DefineTargetRiskInput,
} from "../schemas/define-target-risk-schema";
const levels = ["low", "medium", "high", "critical"] as const;
const rank = { low: 1, medium: 2, high: 3, critical: 4 } as const;
export function DefineTargetRiskDialog({
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
  const mutation = useDefineTargetRisk(riskId);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<DefineTargetRiskInput>({
    resolver: zodResolver(defineTargetRiskSchema),
    defaultValues: { treatmentPlanId: "", targetRisk: "low", rationale: "" },
  });
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
  const submit = async (input: DefineTargetRiskInput) => {
    try {
      const result = await mutation.mutateAsync(input);
      close();
      toast.success(
        "Target risk defined",
        `${result.riskCode}: ${result.targetRisk}; ${result.withinTolerance === false ? "outside" : "within"} tolerance.`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to define target risk.",
      );
    }
  };
  const current = risk.data?.latestAssessment;
  const plans =
    risk.data?.treatmentPlans.filter(
      (item) => item.status === "draft" || item.status === "active",
    ) ?? [];
  const solePlanId = plans.length === 1 ? plans[0]?.id : undefined;
  useEffect(() => {
    if (solePlanId) setValue("treatmentPlanId", solePlanId);
  }, [setValue, solePlanId]);
  const target = useWatch({ control, name: "targetRisk" });
  const ready = Boolean(current?.residualRating && plans.length);
  const validTarget = current?.residualRating
    ? rank[target] <= rank[current.residualRating]
    : false;
  return (
    <Dialog
      title="Define Target Risk"
      dialogRef={ref}
      onClose={close}
      className="max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100%-2rem))] overflow-y-auto"
    >
      <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
        <p className="text-muted text-sm">
          Set the desired post-treatment risk for{" "}
          <strong className="text-foreground">{riskLabel}</strong>.
        </p>
        {message ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            {message}
          </Alert>
        ) : null}
        {current ? (
          <section className="border-border grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
            <div>
              <p className="text-muted text-xs uppercase">Residual</p>
              <p className="mt-1 font-medium">
                {current.residualRating ?? "Not assessed"}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase">Appetite</p>
              <p className="mt-1 font-medium">
                {current.riskAppetite ?? "Not set"}
              </p>
            </div>
            <div>
              <p className="text-muted text-xs uppercase">Tolerance</p>
              <p className="mt-1 font-medium">
                {current.riskTolerance ?? "Not set"}
              </p>
            </div>
          </section>
        ) : null}
        {risk.data && !ready ? (
          <Alert>
            A residual assessment and an active or draft treatment plan are
            required.
          </Alert>
        ) : null}
        <fieldset className="space-y-4" disabled={!ready || mutation.isPending}>
          <FormField
            id="targetPlan"
            label="Treatment plan"
            error={errors.treatmentPlanId?.message}
          >
            <Select id="targetPlan" {...register("treatmentPlanId")}>
              <option value="">Select plan</option>
              {plans.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} — {item.strategy}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="targetLevel" label="Target risk level">
            <Select id="targetLevel" {...register("targetRisk")}>
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </Select>
          </FormField>
          {!validTarget && current?.residualRating ? (
            <p className="text-danger text-xs" role="alert">
              Target risk cannot exceed the current residual risk.
            </p>
          ) : null}
          <FormField
            id="targetRationale"
            label="Target rationale"
            error={errors.rationale?.message}
          >
            <Textarea
              id="targetRationale"
              rows={4}
              maxLength={3000}
              {...register("rationale")}
            />
          </FormField>
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!ready || !validTarget || mutation.isPending}
          >
            <Target className="size-4" aria-hidden="true" />
            {mutation.isPending ? "Saving…" : "Define target"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
