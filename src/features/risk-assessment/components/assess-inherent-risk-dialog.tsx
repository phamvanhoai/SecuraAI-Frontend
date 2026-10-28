"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  Gauge,
  History,
  Info,
  Loader2,
  ShieldOff,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/data-display/pagination";
import { StatusBadge } from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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

const ratingTone = (r: string): "success" | "info" | "warning" | "danger" =>
  r === "Low"
    ? "success"
    : r === "Medium"
      ? "info"
      : r === "High"
        ? "warning"
        : "danger";

const likelihoodCriteria = [
  {
    value: 1,
    label: "Rare",
    description: "Exceptional and not expected in normal conditions.",
  },
  {
    value: 2,
    label: "Unlikely",
    description: "Could occur, but is not expected.",
  },
  {
    value: 3,
    label: "Possible",
    description: "May occur under plausible conditions.",
  },
  {
    value: 4,
    label: "Likely",
    description: "Expected to occur in many circumstances.",
  },
  {
    value: 5,
    label: "Almost certain",
    description: "Expected frequently or already recurring.",
  },
] as const;

const impactCriteria = [
  {
    value: 1,
    label: "Insignificant",
    description: "Minimal operational or information-security effect.",
  },
  {
    value: 2,
    label: "Minor",
    description: "Limited disruption with routine recovery.",
  },
  {
    value: 3,
    label: "Moderate",
    description: "Material impact requiring a coordinated response.",
  },
  {
    value: 4,
    label: "Major",
    description: "Serious operational, financial, legal, or reputational harm.",
  },
  {
    value: 5,
    label: "Severe",
    description:
      "Critical or prolonged harm to services, customers, or regulated data.",
  },
] as const;

const methodologyVersion = "SECURAAI-RISK-MATRIX-v1";

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
  const [tab, setTab] = useState<"assess" | "history">("assess");
  const [historyPage, setHistoryPage] = useState(1);
  const risk = useRiskRecord(riskId);
  const mutation = useAssessInherentRisk(riskId);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setError,
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
  const calculatedRating = rating(score);
  const historyPageSize = 5;

  const inherentHistory = useMemo(
    () =>
      (risk.data?.assessments ?? []).filter(
        (assessment) =>
          assessment.inherentLikelihood !== null &&
          assessment.inherentImpact !== null &&
          assessment.inherentRating !== null &&
          assessment.residualLikelihood === null &&
          assessment.residualImpact === null &&
          assessment.residualRating === null,
      ),
    [risk.data?.assessments],
  );

  const previousAssessment = inherentHistory[0];
  const ratingRank = { low: 1, medium: 2, high: 3, critical: 4 } as const;
  const isMajorReduction = Boolean(
    previousAssessment?.inherentRating &&
      ratingRank[previousAssessment.inherentRating] -
        ratingRank[calculatedRating.toLowerCase() as keyof typeof ratingRank] >=
        2,
  );

  const contextComplete = Boolean(
    risk.data?.assets.length &&
      risk.data.threats.length &&
      risk.data.vulnerabilities.length,
  );
  const statusAllowsAssessment = Boolean(
    risk.data && ["open", "under_treatment"].includes(risk.data.status),
  );
  const cannotSave =
    mutation.isPending ||
    risk.isPending ||
    !contextComplete ||
    !statusAllowsAssessment;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (riskId && !dialog.open) dialog.showModal();
    if (!riskId && dialog.open) dialog.close();
  }, [riskId]);

  const close = () => {
    reset();
    setMessage(undefined);
    setTab("assess");
    setHistoryPage(1);
    onClose();
  };

  const submit = async (input: AssessInherentRiskInput) => {
    if (isMajorReduction) {
      const reason = input.assessmentReason.trim();
      const previousReason = previousAssessment?.reason
        ?.trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase();
      if (reason.length < 30) {
        setError("assessmentReason", {
          message:
            "Explain this major rating reduction in at least 30 characters.",
        });
        return;
      }
      if (reason.replace(/\s+/g, " ").toLocaleLowerCase() === previousReason) {
        setError("assessmentReason", {
          message:
            "Enter a new explanation instead of reusing the previous assessment basis.",
        });
        return;
      }
    }
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

  return (
    <Dialog
      title="Assess Inherent Risk"
      dialogRef={ref}
      onClose={close}
      className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
    >
      <div className="space-y-5">
        {/* Context bar */}
        <div className="border-border bg-neutral-soft/30 rounded-lg border p-3.5 text-xs">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Gauge
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted"
              strokeWidth={1.8}
            />
            <span className="text-foreground font-semibold break-words">
              {riskLabel}
            </span>
          </div>
          {risk.data && !statusAllowsAssessment ? (
            <p className="text-warning mt-1.5 font-medium">
              Assessment is only available while the risk is Open or Under
              treatment. Current status:{" "}
              {risk.data.status.replaceAll("_", " ")}.
            </p>
          ) : risk.data && !contextComplete ? (
            <p className="text-warning mt-1.5 font-medium">
              Document at least one asset, threat, and vulnerability before
              assessing inherent risk.
            </p>
          ) : null}
        </div>

        {/* Tab switcher */}
        <div
          role="tablist"
          aria-label="Inherent risk assessment views"
          className="border-border bg-surface inline-flex w-full items-center gap-1 rounded-xl border p-1 shadow-xs sm:w-auto"
        >
          <button
            id="inherent-assess-tab"
            type="button"
            role="tab"
            aria-selected={tab === "assess"}
            aria-controls="inherent-assess-panel"
            tabIndex={tab === "assess" ? 0 : -1}
            className={cn(
              "focus-visible:outline-brand inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 sm:flex-none",
              tab === "assess"
                ? "bg-brand text-brand-contrast font-semibold shadow-xs"
                : "text-muted hover:bg-neutral-soft hover:text-foreground",
            )}
            onClick={() => setTab("assess")}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
                return;
              event.preventDefault();
              const next =
                event.key === "Home" || event.key === "ArrowLeft"
                  ? "assess"
                  : "history";
              setTab(next);
              event.currentTarget.parentElement
                ?.querySelector<HTMLButtonElement>(`#inherent-${next}-tab`)
                ?.focus();
            }}
          >
            <Gauge aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.8} />
            Assess inherent risk
          </button>
          <button
            id="inherent-history-tab"
            type="button"
            role="tab"
            aria-selected={tab === "history"}
            aria-controls="inherent-history-panel"
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
                  : "assess";
              setTab(next);
              event.currentTarget.parentElement
                ?.querySelector<HTMLButtonElement>(`#inherent-${next}-tab`)
                ?.focus();
            }}
          >
            <History
              aria-hidden="true"
              className="size-4 shrink-0"
              strokeWidth={2}
            />
            History ({inherentHistory.length})
          </button>
        </div>

        {/* History panel */}
        {tab === "history" ? (
          <section
            id="inherent-history-panel"
            role="tabpanel"
            aria-labelledby="inherent-history-tab"
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
                  Assessment history
                </h3>
                <p className="text-xs text-muted">
                  Previous inherent-risk assessments are read-only. Saving a
                  new assessment creates a new history record.
                </p>
              </div>
            </div>
            {inherentHistory.length ? (
              <>
                {inherentHistory
                  .slice(
                    (historyPage - 1) * historyPageSize,
                    historyPage * historyPageSize,
                  )
                  .map((assessment) => (
                    <article
                      key={assessment.id}
                      className="border-border bg-surface rounded-xl border p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold tabular-nums">
                            {assessment.inherentLikelihood} ×{" "}
                            {assessment.inherentImpact} ={" "}
                            {(assessment.inherentLikelihood ?? 0) *
                              (assessment.inherentImpact ?? 0)}
                          </p>
                          <p className="text-muted text-xs mt-0.5">
                            {new Intl.DateTimeFormat("en-GB", {
                              timeZone: "Asia/Bangkok",
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(assessment.assessedAt))}{" "}
                            (UTC+7)
                          </p>
                        </div>
                        <StatusBadge
                          tone={
                            assessment.inherentRating === "low"
                              ? "success"
                              : assessment.inherentRating === "medium"
                                ? "info"
                                : assessment.inherentRating === "high"
                                  ? "warning"
                                  : "danger"
                          }
                        >
                          {assessment.inherentRating?.replace(/^./, (l) =>
                            l.toUpperCase(),
                          )}
                        </StatusBadge>
                      </div>
                      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-muted text-xs font-medium uppercase">
                            Assessed by
                          </dt>
                          <dd className="mt-0.5">
                            {assessment.assessedBy?.fullName ?? "Unknown assessor"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted text-xs font-medium uppercase">
                            Assessment type
                          </dt>
                          <dd className="mt-0.5">
                            {assessment.type.replaceAll("_", " ")}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted text-xs font-medium uppercase">
                            Methodology
                          </dt>
                          <dd className="mt-0.5">{assessment.methodologyVersion}</dd>
                        </div>
                      </dl>
                      {assessment.reason ? (
                        <div className="mt-3 border-t border-border pt-3 text-sm">
                          <p className="text-muted text-xs font-medium uppercase">
                            Assessment basis
                          </p>
                          <p className="mt-1 whitespace-pre-wrap">
                            {assessment.reason}
                          </p>
                        </div>
                      ) : null}
                    </article>
                  ))}
                <Pagination
                  page={historyPage}
                  pageCount={Math.ceil(inherentHistory.length / historyPageSize)}
                  onPageChange={setHistoryPage}
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
                  No assessment history
                </p>
                <p className="text-muted mt-0.5 text-xs">
                  The first saved inherent assessment will appear here.
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
          /* Assess panel */
          <form
            id="inherent-assess-panel"
            role="tabpanel"
            aria-labelledby="inherent-assess-tab"
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
                Unable to load the risk context.{" "}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void risk.refetch()}
                >
                  Try again
                </Button>
              </Alert>
            ) : null}
            {isMajorReduction && previousAssessment?.inherentRating ? (
              <Alert className="border-warning/30 bg-warning-soft text-warning">
                The rating is changing from{" "}
                {previousAssessment.inherentRating.replace(/^./, (l) =>
                  l.toUpperCase(),
                )}{" "}
                to {calculatedRating}. This reduction of two or more levels is
                allowed, but the assessment basis must contain a new explanation
                of at least 30 characters.
              </Alert>
            ) : null}

            {/* Risk context summary */}
            {risk.data ? (
              <section aria-labelledby="inherent-context-heading" className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <ShieldOff
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="inherent-context-heading"
                      className="text-sm font-semibold text-foreground"
                    >
                      Risk context
                    </h3>
                    <p className="text-xs text-muted">
                      Assess exposure before considering existing
                      security-control effectiveness.
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="border-border bg-surface rounded-xl border p-3">
                    <p className="text-muted text-xs font-medium uppercase">
                      Assets / criticality
                    </p>
                    <p className="mt-1.5 text-sm">
                      {risk.data.assets
                        .map(
                          (item) =>
                            `${item.name} (${item.criticality ?? "—"})`,
                        )
                        .join(", ") || "None"}
                    </p>
                  </div>
                  <div className="border-border bg-surface rounded-xl border p-3">
                    <p className="text-muted text-xs font-medium uppercase">
                      Threats
                    </p>
                    <p className="mt-1.5 text-sm">
                      {risk.data.threats.map((item) => item.name).join(", ") ||
                        "None"}
                    </p>
                  </div>
                  <div className="border-border bg-surface rounded-xl border p-3">
                    <p className="text-muted text-xs font-medium uppercase">
                      Vulnerabilities
                    </p>
                    <p className="mt-1.5 text-sm">
                      {risk.data.vulnerabilities
                        .map((item) => item.name)
                        .join(", ") || "None"}
                    </p>
                  </div>
                </div>
              </section>
            ) : null}

            {/* Methodology note */}
            <div className="border-border bg-neutral-soft/30 rounded-xl border p-3.5 text-xs">
              <p className="font-semibold text-foreground">
                Methodology: {methodologyVersion}
              </p>
              <p className="text-muted mt-1">
                Score = Likelihood × Impact. 1–4 Low · 5–9 Medium · 10–16 High
                · 17–25 Critical.
              </p>
            </div>

            <fieldset
              className="space-y-6"
              disabled={cannotSave}
            >
              <legend className="sr-only">Inherent risk values</legend>

              {/* Section — Likelihood */}
              <section aria-labelledby="inherent-likelihood-heading" className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <Zap
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="inherent-likelihood-heading"
                      className="text-sm font-semibold text-foreground"
                    >
                      Likelihood
                    </h3>
                    <p className="text-xs text-muted">
                      How likely is this risk to materialise? (1 = Rare, 5 =
                      Almost certain)
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-5">
                  {likelihoodCriteria.map((criterion) => (
                    <label
                      key={criterion.value}
                      className={cn(
                        "border-border flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition-colors",
                        Number(likelihood) === criterion.value
                          ? "border-brand bg-brand/5"
                          : "bg-surface hover:bg-neutral-soft",
                      )}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        value={criterion.value}
                        {...register("likelihood", { valueAsNumber: true })}
                      />
                      <span className="font-semibold tabular-nums">
                        {criterion.value}
                      </span>
                      <span className="font-medium leading-tight">
                        {criterion.label}
                      </span>
                      <span className="text-muted text-xs leading-snug">
                        {criterion.description}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.likelihood ? (
                  <p className="text-danger text-xs" role="alert">
                    {errors.likelihood.message}
                  </p>
                ) : null}
              </section>

              {/* Section — Impact */}
              <section aria-labelledby="inherent-impact-heading" className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <ShieldOff
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="inherent-impact-heading"
                      className="text-sm font-semibold text-foreground"
                    >
                      Potential impact
                    </h3>
                    <p className="text-xs text-muted">
                      What is the potential impact if this risk materialises? (1
                      = Insignificant, 5 = Severe)
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-5">
                  {impactCriteria.map((criterion) => (
                    <label
                      key={criterion.value}
                      className={cn(
                        "border-border flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition-colors",
                        Number(impact) === criterion.value
                          ? "border-brand bg-brand/5"
                          : "bg-surface hover:bg-neutral-soft",
                      )}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        value={criterion.value}
                        {...register("impact", { valueAsNumber: true })}
                      />
                      <span className="font-semibold tabular-nums">
                        {criterion.value}
                      </span>
                      <span className="font-medium leading-tight">
                        {criterion.label}
                      </span>
                      <span className="text-muted text-xs leading-snug">
                        {criterion.description}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.impact ? (
                  <p className="text-danger text-xs" role="alert">
                    {errors.impact.message}
                  </p>
                ) : null}
              </section>

              {/* Calculated rating strip */}
              <div className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                <div>
                  <p className="text-muted text-xs font-medium uppercase">
                    Calculated score
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">
                    {score}
                  </p>
                </div>
                <div>
                  <p className="text-muted text-xs font-medium uppercase">
                    Formula
                  </p>
                  <p className="mt-1 font-mono text-sm tabular-nums">
                    {Number(likelihood)} × {Number(impact)} = {score}
                  </p>
                </div>
                <StatusBadge tone={ratingTone(calculatedRating)}>
                  {calculatedRating}
                </StatusBadge>
              </div>

              {/* Section — Assessment basis */}
              <div className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <FileText
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="inherent-reason-heading"
                      className="text-sm font-semibold text-foreground"
                    >
                      Assessment basis
                      <span className="text-muted ml-1.5 text-xs font-normal">
                        {isMajorReduction ? "(required — major reduction)" : "(optional)"}
                      </span>
                    </h3>
                    <p className="text-xs text-muted">
                      Explain the rationale for these scores. Max 3,000
                      characters.
                    </p>
                  </div>
                </div>
                <Textarea
                  id="inherentReason"
                  rows={4}
                  maxLength={3000}
                  aria-labelledby="inherent-reason-heading"
                  aria-invalid={Boolean(errors.assessmentReason)}
                  {...register("assessmentReason")}
                />
                {errors.assessmentReason ? (
                  <p className="text-danger text-xs" role="alert">
                    {errors.assessmentReason.message}
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
                Inherent risk reflects exposure without controls. After saving,
                proceed to assess residual risk to account for existing
                security-control effectiveness.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div />
              <div className="flex items-center gap-3">
                <Button type="button" variant="secondary" onClick={close}>
                  Cancel
                </Button>
                <Button type="submit" disabled={cannotSave}>
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
                      <Gauge
                        aria-hidden="true"
                        className="size-4"
                        strokeWidth={1.8}
                      />
                      Save assessment
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
