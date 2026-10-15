"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { History, Target } from "lucide-react";
import { Pagination } from "@/components/data-display/pagination";
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
  const [tab, setTab] = useState<"define" | "history">("define");
  const [page, setPage] = useState(1);
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
    setTab("define");
    setPage(1);
    onClose();
  };
  const submit = async (input: DefineTargetRiskInput) => {
    try {
      const result = await mutation.mutateAsync(input);
      close();
      toast.success(
        "Target risk defined",
        `${result.riskCode}: ${result.targetRisk}; ${result.withinTolerance === null ? "tolerance not recorded" : result.withinTolerance ? "within tolerance" : "outside tolerance"}.`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to define target risk.",
      );
    }
  };
  const current = risk.data?.assessments
    .filter(
      (item) =>
        item.residualRating !== null && item.type !== "target_definition",
    )
    .toSorted((a, b) => Date.parse(b.assessedAt) - Date.parse(a.assessedAt))[0];
  const blocked = Boolean(
    risk.data &&
    (!["open", "under_treatment"].includes(risk.data.status) ||
      risk.data.acceptances.some((item) => item.decision === "pending")),
  );
  const plans =
    risk.data?.treatmentPlans.filter(
      (item) => item.status === "draft" || item.status === "active",
    ) ?? [];
  const solePlanId = plans.length === 1 ? plans[0]?.id : undefined;
  useEffect(() => {
    if (solePlanId) setValue("treatmentPlanId", solePlanId);
  }, [setValue, solePlanId]);
  const target = useWatch({ control, name: "targetRisk" });
  const ready = Boolean(
    !blocked && !risk.isError && current?.residualRating && plans.length,
  );
  const outsideAppetite = Boolean(
    current?.riskAppetite && rank[target] > rank[current.riskAppetite],
  );
  const outsideTolerance = Boolean(
    current?.riskTolerance && rank[target] > rank[current.riskTolerance],
  );
  const validTarget = current?.residualRating
    ? rank[target] <= rank[current.residualRating]
    : false;
  const history = (risk.data?.assessments ?? [])
    .filter((item) => item.type === "target_definition")
    .toSorted((a, b) => Date.parse(b.assessedAt) - Date.parse(a.assessedAt));
  const pageCount = Math.max(1, Math.ceil(history.length / 5));
  const currentPage = Math.min(page, pageCount);
  const date = (value: string) =>
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  return (
    <Dialog
      title="Define Target Risk"
      dialogRef={ref}
      onClose={close}
      className="max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100%-2rem))] overflow-y-auto"
    >
      <div
        role="tablist"
        aria-label="Target risk views"
        className="border-border bg-surface mb-4 inline-flex w-full gap-1 rounded-xl border p-1 shadow-xs sm:w-auto"
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
            return;
          event.preventDefault();
          const next =
            event.key === "Home"
              ? "define"
              : event.key === "End"
                ? "history"
                : tab === "define"
                  ? "history"
                  : "define";
          setTab(next);
          ref.current
            ?.querySelector<HTMLButtonElement>(`#target-${next}-tab`)
            ?.focus();
        }}
      >
        {(["define", "history"] as const).map((view) => (
          <button
            key={view}
            id={`target-${view}-tab`}
            type="button"
            role="tab"
            aria-selected={tab === view}
            aria-controls={`target-${view}-panel`}
            tabIndex={tab === view ? 0 : -1}
            className={`focus-visible:outline-brand inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 sm:flex-none ${tab === view ? "bg-brand text-brand-contrast font-semibold shadow-xs" : "text-muted hover:bg-neutral-soft hover:text-foreground"}`}
            onClick={() => setTab(view)}
          >
            {view === "history" ? (
              <History className="size-4" aria-hidden="true" />
            ) : null}
            {view === "define"
              ? "Define target"
              : `History (${history.length})`}
          </button>
        ))}
      </div>
      {tab === "history" ? (
        <section
          id="target-history-panel"
          role="tabpanel"
          aria-labelledby="target-history-tab"
          className="space-y-3"
        >
          <p className="text-muted text-sm">
            Previous target definitions are read-only. They do not represent new
            residual assessments.
          </p>
          {risk.isPending ? (
            <p role="status">Loading target history...</p>
          ) : risk.isError ? (
            <Alert>
              Unable to load history.{" "}
              <Button
                type="button"
                variant="secondary"
                onClick={() => void risk.refetch()}
              >
                Try again
              </Button>
            </Alert>
          ) : history.length ? (
            history
              .slice((currentPage - 1) * 5, currentPage * 5)
              .map((item) => {
                const context = risk.data?.targetHistory?.find(
                  (entry) => entry.assessmentId === item.id,
                );
                return (
                  <article
                    key={item.id}
                    className="border-border rounded-lg border p-4"
                  >
                    <p className="font-semibold">
                      Target: {item.targetRisk ?? "Not recorded"}
                    </p>
                    <p className="text-muted text-sm">
                      {date(item.assessedAt)} (UTC+7) ·{" "}
                      {item.assessedBy?.fullName ?? "Unknown assessor"}
                    </p>
                    <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                      {[
                        [
                          "Treatment plan",
                          context?.treatmentPlanTitle ?? "Not recorded",
                        ],
                        [
                          "Residual at definition",
                          context?.residualRating ?? "Not recorded",
                        ],
                        [
                          "Residual assessed at",
                          context?.residualAssessedAt
                            ? `${date(context.residualAssessedAt)} (UTC+7)`
                            : "Not recorded",
                        ],
                        [
                          "Appetite / tolerance",
                          `${item.riskAppetite ?? "Not recorded"} / ${item.riskTolerance ?? "Not recorded"}`,
                        ],
                        [
                          "Within appetite",
                          item.targetRisk && item.riskAppetite
                            ? rank[item.targetRisk] <= rank[item.riskAppetite]
                              ? "Yes"
                              : "No"
                            : "Not recorded",
                        ],
                        [
                          "Within tolerance",
                          item.targetRisk && item.riskTolerance
                            ? rank[item.targetRisk] <= rank[item.riskTolerance]
                              ? "Yes"
                              : "No"
                            : "Not recorded",
                        ],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt className="text-muted">{label}</dt>
                          <dd className="break-words">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="text-muted mt-3 text-sm">Target rationale</p>
                    <p className="text-sm break-words whitespace-pre-wrap">
                      {item.reason ?? "Not recorded"}
                    </p>
                  </article>
                );
              })
          ) : (
            <div className="border-border rounded-lg border border-dashed p-6 text-center">
              <p className="font-medium">No target definition history</p>
              <p className="text-muted mt-1 text-sm">
                New target definitions will appear here. Older unclassified
                assessment records remain in Risk details.
              </p>
            </div>
          )}
          {!risk.isPending && !risk.isError && history.length ? (
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          ) : null}
          <div className="border-border flex justify-end border-t pt-4">
            <Button type="button" variant="secondary" onClick={close}>
              Close
            </Button>
          </div>
        </section>
      ) : (
        <form
          id="target-define-panel"
          role="tabpanel"
          aria-labelledby="target-define-tab"
          className="space-y-5"
          noValidate
          onSubmit={handleSubmit(submit)}
        >
          <p className="text-muted text-sm">
            Set the desired post-treatment risk for{" "}
            <strong className="text-foreground">{riskLabel}</strong>.
          </p>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          {blocked ? (
            <Alert>
              Target risk cannot be changed for an accepted, closed or archived
              Risk, or while acceptance is pending.
            </Alert>
          ) : null}
          {risk.isError ? (
            <Alert>
              Unable to load Risk context.{" "}
              <Button
                type="button"
                variant="secondary"
                onClick={() => void risk.refetch()}
              >
                Try again
              </Button>
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
          <fieldset
            className="space-y-4"
            disabled={!ready || mutation.isPending}
          >
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
            {outsideAppetite || outsideTolerance ? (
              <Alert className="border-warning/30 bg-warning-soft text-warning">
                The proposed target is outside{" "}
                {outsideTolerance ? "risk tolerance" : "risk appetite"}. Explain
                why the planned treatment cannot yet reach the applicable
                threshold. This warning does not prevent saving a valid target.
              </Alert>
            ) : null}
            <p className="text-muted text-sm">
              Explain how the actions in the selected plan will achieve the
              target. Defining a target does not change the current residual
              assessment.
            </p>
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
      )}
    </Dialog>
  );
}
