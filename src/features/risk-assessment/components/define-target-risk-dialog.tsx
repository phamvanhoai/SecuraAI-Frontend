"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  History,
  Info,
  Loader2,
  Target,
  TriangleAlert,
} from "lucide-react";
import { Pagination } from "@/components/data-display/pagination";
import { StatusBadge } from "@/components/data-display/static-product";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
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

const targetLevelMeta: Record<
  string,
  { description: string; tone: "success" | "info" | "warning" | "danger" }
> = {
  low: { description: "Minimal residual exposure after treatment.", tone: "success" },
  medium: { description: "Moderate residual exposure, within tolerance.", tone: "info" },
  high: { description: "Elevated exposure — document justification.", tone: "warning" },
  critical: { description: "Maximum exposure — requires strong rationale.", tone: "danger" },
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

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
        `${result.riskCode}: ${result.targetRisk}; ${
          result.withinTolerance === null
            ? "tolerance not recorded"
            : result.withinTolerance
              ? "within tolerance"
              : "outside tolerance"
        }.`,
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
  const cannotSave = !ready || !target || mutation.isPending;

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

  return (
    <Dialog
      title="Define Target Risk"
      dialogRef={ref}
      onClose={close}
      className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
    >
      <div className="space-y-5">
        {/* Context bar */}
        <div className="border-border bg-neutral-soft/30 rounded-lg border p-3.5 text-xs">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Target
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted"
              strokeWidth={1.8}
            />
            <span className="text-foreground font-semibold break-words">
              {riskLabel}
            </span>
          </div>
          {blocked ? (
            <p className="text-warning mt-1.5 font-medium">
              Target risk cannot be changed for an accepted, closed or archived
              risk, or while acceptance is pending.
            </p>
          ) : risk.data && !ready ? (
            <p className="text-warning mt-1.5 font-medium">
              A residual assessment and an active or draft treatment plan are
              required before defining a target risk.
            </p>
          ) : null}
        </div>

        {/* Tab switcher */}
        <div
          role="tablist"
          aria-label="Target risk views"
          className="border-border bg-surface inline-flex w-full items-center gap-1 rounded-xl border p-1 shadow-xs sm:w-auto"
        >
          <button
            id="target-define-tab"
            type="button"
            role="tab"
            aria-selected={tab === "define"}
            aria-controls="target-define-panel"
            tabIndex={tab === "define" ? 0 : -1}
            className={cn(
              "focus-visible:outline-brand inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 sm:flex-none",
              tab === "define"
                ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                : "text-muted hover:bg-neutral-soft hover:text-foreground",
            )}
            onClick={() => setTab("define")}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
                return;
              event.preventDefault();
              const next =
                event.key === "Home" || event.key === "ArrowLeft"
                  ? "define"
                  : "history";
              setTab(next);
              ref.current
                ?.querySelector<HTMLButtonElement>(`#target-${next}-tab`)
                ?.focus();
            }}
          >
            <Target aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.8} />
            Define target
          </button>
          <button
            id="target-history-tab"
            type="button"
            role="tab"
            aria-selected={tab === "history"}
            aria-controls="target-history-panel"
            tabIndex={tab === "history" ? 0 : -1}
            className={cn(
              "focus-visible:outline-brand inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 sm:flex-none",
              tab === "history"
                ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                : "text-muted hover:bg-neutral-soft hover:text-foreground",
            )}
            onClick={() => setTab("history")}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
                return;
              event.preventDefault();
              const next =
                event.key === "End" || event.key === "ArrowRight"
                  ? "history"
                  : "define";
              setTab(next);
              ref.current
                ?.querySelector<HTMLButtonElement>(`#target-${next}-tab`)
                ?.focus();
            }}
          >
            <History aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} />
            History ({history.length})
          </button>
        </div>

        {/* ── History panel ── */}
        {tab === "history" ? (
          <section
            id="target-history-panel"
            role="tabpanel"
            aria-labelledby="target-history-tab"
            className="space-y-4"
          >
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <History
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={2}
              />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Target definition history
                </h3>
                <p className="text-xs text-muted">
                  Previous target definitions are read-only and do not
                  represent new residual assessments.
                </p>
              </div>
            </div>

            {risk.isPending ? (
              <p role="status" className="text-muted text-sm">
                Loading target history…
              </p>
            ) : risk.isError ? (
              <Alert className="border-danger/25 bg-danger-soft text-danger">
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
              <>
                {history
                  .slice((currentPage - 1) * 5, currentPage * 5)
                  .map((item) => {
                    const context = risk.data?.targetHistory?.find(
                      (entry) => entry.assessmentId === item.id,
                    );
                    return (
                      <article
                        key={item.id}
                        className="border-border bg-surface rounded-xl border p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">
                              Target:{" "}
                              <span className="capitalize">
                                {item.targetRisk ?? "Not recorded"}
                              </span>
                            </p>
                            <p className="text-muted text-xs mt-0.5">
                              {formatDate(item.assessedAt)} (UTC+7) ·{" "}
                              {item.assessedBy?.fullName ?? "Unknown assessor"}
                            </p>
                          </div>
                          {item.targetRisk ? (
                            <StatusBadge
                              tone={targetLevelMeta[item.targetRisk]?.tone ?? "info"}
                            >
                              {item.targetRisk.charAt(0).toUpperCase() +
                                item.targetRisk.slice(1)}
                            </StatusBadge>
                          ) : null}
                        </div>
                        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                          {(
                            [
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
                                  ? `${formatDate(context.residualAssessedAt)} (UTC+7)`
                                  : "Not recorded",
                              ],
                              [
                                "Appetite / tolerance",
                                `${item.riskAppetite ?? "—"} / ${item.riskTolerance ?? "—"}`,
                              ],
                              [
                                "Within appetite",
                                item.targetRisk && item.riskAppetite
                                  ? rank[item.targetRisk] <=
                                    rank[item.riskAppetite]
                                    ? "Yes"
                                    : "No"
                                  : "Not recorded",
                              ],
                              [
                                "Within tolerance",
                                item.targetRisk && item.riskTolerance
                                  ? rank[item.targetRisk] <=
                                    rank[item.riskTolerance]
                                    ? "Yes"
                                    : "No"
                                  : "Not recorded",
                              ],
                            ] as [string, string][]
                          ).map(([label, value]) => (
                            <div key={label}>
                              <dt className="text-muted text-xs font-medium uppercase">
                                {label}
                              </dt>
                              <dd className="mt-0.5 break-words capitalize">
                                {value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        {item.reason ? (
                          <div className="mt-3 border-t border-border pt-3 text-sm">
                            <p className="text-muted text-xs font-medium uppercase">
                              Target rationale
                            </p>
                            <p className="mt-1 whitespace-pre-wrap break-words">
                              {item.reason}
                            </p>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                <Pagination
                  page={currentPage}
                  pageCount={pageCount}
                  onPageChange={setPage}
                />
              </>
            ) : (
              <div className="border-border bg-neutral-soft/30 rounded-xl border p-5 text-center">
                <History
                  aria-hidden="true"
                  className="text-muted mx-auto mb-2 size-7"
                  strokeWidth={1.5}
                />
                <p className="text-sm font-medium text-foreground">
                  No target definition history
                </p>
                <p className="text-muted mt-0.5 text-xs">
                  New target definitions will appear here.
                </p>
              </div>
            )}

            <div className="flex justify-end border-t border-border pt-4">
              <Button type="button" variant="secondary" onClick={close}>
                Close
              </Button>
            </div>
          </section>
        ) : (
          /* ── Define panel ── */
          <form
            id="target-define-panel"
            role="tabpanel"
            aria-labelledby="target-define-tab"
            className="space-y-6"
            noValidate
            onSubmit={handleSubmit(submit)}
          >
            {/* Alerts */}
            {message ? (
              <Alert className="border-danger/25 bg-danger-soft text-danger">
                {message}
              </Alert>
            ) : null}
            {risk.isError ? (
              <Alert className="border-danger/25 bg-danger-soft text-danger">
                Unable to load risk context.{" "}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void risk.refetch()}
                >
                  Try again
                </Button>
              </Alert>
            ) : null}

            {/* Current residual context */}
            {current ? (
              <section aria-labelledby="target-context-heading" className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <Target
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="target-context-heading"
                      className="text-sm font-semibold text-foreground"
                    >
                      Current risk context
                    </h3>
                    <p className="text-xs text-muted">
                      Target risk cannot exceed the current residual rating.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="border-border bg-surface rounded-xl border p-3">
                    <p className="text-muted text-xs font-medium uppercase">
                      Residual
                    </p>
                    <p className="mt-1.5 font-semibold capitalize">
                      {current.residualRating ?? "Not assessed"}
                    </p>
                  </div>
                  <div className="border-border bg-surface rounded-xl border p-3">
                    <p className="text-muted text-xs font-medium uppercase">
                      Appetite
                    </p>
                    <p className="mt-1.5 font-semibold capitalize">
                      {current.riskAppetite ?? "Not set"}
                    </p>
                  </div>
                  <div className="border-border bg-surface rounded-xl border p-3">
                    <p className="text-muted text-xs font-medium uppercase">
                      Tolerance
                    </p>
                    <p className="mt-1.5 font-semibold capitalize">
                      {current.riskTolerance ?? "Not set"}
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            <fieldset className="space-y-6" disabled={cannotSave}>
              <legend className="sr-only">Target risk values</legend>

              {/* Section — Treatment plan */}
              <section aria-labelledby="target-plan-heading" className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <FileText
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="target-plan-heading"
                      className="text-sm font-semibold text-foreground"
                    >
                      Treatment plan
                    </h3>
                    <p className="text-xs text-muted">
                      Select the active or draft plan this target is linked to.
                    </p>
                  </div>
                </div>
                <Select
                  id="targetPlan"
                  aria-labelledby="target-plan-heading"
                  aria-invalid={Boolean(errors.treatmentPlanId)}
                  {...register("treatmentPlanId")}
                >
                  <option value="">Select plan</option>
                  {plans.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} — {item.strategy}
                    </option>
                  ))}
                </Select>
                {errors.treatmentPlanId ? (
                  <p className="text-danger text-xs" role="alert">
                    {errors.treatmentPlanId.message}
                  </p>
                ) : null}
              </section>

              {/* Section — Target risk level (radio cards) */}
              <section aria-labelledby="target-level-heading" className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <Target
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="target-level-heading"
                      className="text-sm font-semibold text-foreground"
                    >
                      Target risk level
                    </h3>
                    <p className="text-xs text-muted">
                      The desired post-treatment risk. Cannot exceed current
                      residual rating.
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-4">
                  {levels.map((level) => {
                    const meta = targetLevelMeta[level];
                    const exceedsResidual =
                      current?.residualRating &&
                      rank[level] > rank[current.residualRating];
                    return (
                      <label
                        key={level}
                        className={cn(
                          "border-border flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition-colors",
                          target === level
                            ? "border-brand bg-brand/5"
                            : "bg-surface hover:bg-neutral-soft",
                          exceedsResidual && "opacity-50",
                          cannotSave && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          value={level}
                          {...register("targetRisk")}
                        />
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold capitalize">
                            {level}
                          </span>
                          {exceedsResidual ? (
                            <TriangleAlert
                              aria-label="Exceeds residual"
                              className="size-3.5 text-warning shrink-0"
                              strokeWidth={1.8}
                            />
                          ) : null}
                        </div>
                        <span className="text-muted text-xs leading-snug">
                          {meta?.description}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {!validTarget && current?.residualRating ? (
                  <p className="text-danger text-xs" role="alert">
                    Target risk cannot exceed the current residual risk (
                    {current.residualRating}).
                  </p>
                ) : null}
                {errors.targetRisk ? (
                  <p className="text-danger text-xs" role="alert">
                    {errors.targetRisk.message}
                  </p>
                ) : null}
              </section>

              {/* Threshold warning */}
              {outsideAppetite || outsideTolerance ? (
                <Alert className="border-warning/30 bg-warning-soft text-warning">
                  The proposed target is outside{" "}
                  {outsideTolerance ? "risk tolerance" : "risk appetite"}.
                  Explain in the rationale why the planned treatment cannot yet
                  reach the applicable threshold. This warning does not prevent
                  saving a valid target.
                </Alert>
              ) : null}

              {/* Section — Target rationale */}
              <div className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <FileText
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="target-rationale-heading"
                      className="text-sm font-semibold text-foreground"
                    >
                      Target rationale
                      <span className="text-muted ml-1.5 text-xs font-normal">
                        (optional)
                      </span>
                    </h3>
                    <p className="text-xs text-muted">
                      Explain how the actions in the selected plan will achieve
                      this target. Max 3,000 characters.
                    </p>
                  </div>
                </div>
                <Textarea
                  id="targetRationale"
                  rows={4}
                  maxLength={3000}
                  aria-labelledby="target-rationale-heading"
                  aria-invalid={Boolean(errors.rationale)}
                  {...register("rationale")}
                />
                {errors.rationale ? (
                  <p className="text-danger text-xs" role="alert">
                    {errors.rationale.message}
                  </p>
                ) : null}
              </div>
            </fieldset>

            {/* Info hint */}
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <Info
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-muted"
                strokeWidth={1.8}
              />
              <p className="text-xs text-muted">
                Defining a target does not change the current residual
                assessment. It records the desired post-treatment outcome linked
                to a specific treatment plan.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div />
              <div className="flex items-center gap-3">
                <Button type="button" variant="secondary" onClick={close}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={cannotSave || !validTarget}
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
                      <Target
                        aria-hidden="true"
                        className="size-4"
                        strokeWidth={1.8}
                      />
                      Define target
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </Dialog>
  );
}
