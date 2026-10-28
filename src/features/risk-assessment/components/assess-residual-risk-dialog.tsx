"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  GaugeCircle,
  History,
  Info,
  Loader2,
  ShieldCheck,
  ShieldOff,
  Target,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/data-display/pagination";
import { StatusBadge } from "@/components/data-display/static-product";
import { useForm, useWatch } from "react-hook-form";
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

const ratingTone = (
  score: number,
): "success" | "info" | "warning" | "danger" =>
  score <= 4
    ? "success"
    : score <= 9
      ? "info"
      : score <= 16
        ? "warning"
        : "danger";

const likelihoodMeta: Record<number, { label: string; description: string }> = {
  1: { label: "Rare", description: "Exceptional, not expected normally." },
  2: { label: "Unlikely", description: "Could occur, but not expected." },
  3: { label: "Possible", description: "May occur under plausible conditions." },
  4: { label: "Likely", description: "Expected in many circumstances." },
  5: { label: "Almost certain", description: "Expected frequently or recurring." },
};

const impactMeta: Record<number, { label: string; description: string }> = {
  1: { label: "Insignificant", description: "Minimal security effect." },
  2: { label: "Minor", description: "Limited disruption, routine recovery." },
  3: { label: "Moderate", description: "Material impact, coordinated response." },
  4: { label: "Major", description: "Serious operational or reputational harm." },
  5: { label: "Severe", description: "Critical harm to services or regulated data." },
};

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
  const [tab, setTab] = useState<"assess" | "history">("assess");
  const [historyPage, setHistoryPage] = useState(1);
  const risk = useRiskRecord(riskId);
  const mutation = useAssessResidualRisk(riskId);
  const toast = useToast();

  const history = useMemo(
    () =>
      (risk.data?.assessments ?? [])
        .filter(
          (item) =>
            item.residualLikelihood !== null &&
            item.residualImpact !== null &&
            item.residualRating !== null,
        )
        .toSorted(
          (a, b) => Date.parse(b.assessedAt) - Date.parse(a.assessedAt),
        ),
    [risk.data?.assessments],
  );

  const pageCount = Math.max(1, Math.ceil(history.length / 5));
  const currentPage = Math.min(historyPage, pageCount);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
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

  const established = risk.data?.assessments.find(
    (item) => item.riskAppetite !== null && item.riskTolerance !== null,
  );

  useEffect(() => {
    if (established?.riskAppetite)
      setValue("riskAppetite", established.riskAppetite);
    if (established?.riskTolerance)
      setValue("riskTolerance", established.riskTolerance);
  }, [established?.riskAppetite, established?.riskTolerance, setValue]);

  const blocked = Boolean(
    risk.data &&
      (!["open", "under_treatment"].includes(risk.data.status) ||
        risk.data.acceptances.some((item) => item.decision === "pending")),
  );

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
    !blocked &&
      risk.data?.latestAssessment?.inherentRating &&
      risk.data.controls.length &&
      risk.data.controls.every((item) => item.latestEffectiveness !== null),
  );

  const cannotSave = !ready || mutation.isPending;

  return (
    <Dialog
      title="Assess Residual Risk"
      dialogRef={ref}
      onClose={close}
      className="max-h-[calc(100dvh-2rem)] w-[min(46rem,calc(100%-2rem))] overflow-y-auto"
    >
      <div className="space-y-5">
        {/* Context bar */}
        <div className="border-border bg-neutral-soft/30 rounded-lg border p-3.5 text-xs">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <GaugeCircle
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
              This risk cannot receive a residual assessment in its current
              state or while acceptance is pending.
            </p>
          ) : risk.data && !ready ? (
            <p className="text-warning mt-1.5 font-medium">
              Inherent risk and every related control effectiveness assessment
              are required before assessing residual risk.
            </p>
          ) : null}
        </div>

        {/* Tab switcher */}
        <div
          role="tablist"
          aria-label="Residual risk assessment views"
          className="border-border bg-surface inline-flex w-full items-center gap-1 rounded-xl border p-1 shadow-xs sm:w-auto"
        >
          <button
            id="residual-assess-tab"
            type="button"
            role="tab"
            aria-selected={tab === "assess"}
            aria-controls="residual-assess-panel"
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
              ref.current
                ?.querySelector<HTMLButtonElement>(`#residual-${next}-tab`)
                ?.focus();
            }}
          >
            <GaugeCircle
              aria-hidden="true"
              className="size-4 shrink-0"
              strokeWidth={1.8}
            />
            Assess residual risk
          </button>
          <button
            id="residual-history-tab"
            type="button"
            role="tab"
            aria-selected={tab === "history"}
            aria-controls="residual-history-panel"
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
              ref.current
                ?.querySelector<HTMLButtonElement>(`#residual-${next}-tab`)
                ?.focus();
            }}
          >
            <History
              aria-hidden="true"
              className="size-4 shrink-0"
              strokeWidth={2}
            />
            History ({history.length})
          </button>
        </div>

        {/* ── History panel ── */}
        {tab === "history" ? (
          <section
            id="residual-history-panel"
            role="tabpanel"
            aria-labelledby="residual-history-tab"
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
                  Read-only residual risk records. Each entry shows the values
                  recorded at that time, including carry-forwards.
                </p>
              </div>
            </div>

            {risk.isPending ? (
              <p role="status" className="text-muted text-sm">
                Loading assessment history…
              </p>
            ) : risk.isError ? (
              <Alert className="border-danger/25 bg-danger-soft text-danger">
                Unable to load assessment history.{" "}
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
                  .map((item) => (
                    <article
                      key={item.id}
                      className="border-border bg-surface rounded-xl border p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold tabular-nums">
                            {item.residualLikelihood} × {item.residualImpact} ={" "}
                            {(item.residualLikelihood ?? 0) *
                              (item.residualImpact ?? 0)}
                          </p>
                          <p className="text-muted text-xs mt-0.5">
                            {new Intl.DateTimeFormat("en-GB", {
                              timeZone: "Asia/Bangkok",
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(item.assessedAt))}{" "}
                            (UTC+7)
                          </p>
                        </div>
                        <StatusBadge
                          tone={
                            item.residualRating === "low"
                              ? "success"
                              : item.residualRating === "medium"
                                ? "info"
                                : item.residualRating === "high"
                                  ? "warning"
                                  : "danger"
                          }
                        >
                          {item.residualRating?.replace(/^./, (l) =>
                            l.toUpperCase(),
                          )}
                        </StatusBadge>
                      </div>
                      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        {(
                          [
                            [
                              "Assessed by",
                              item.assessedBy?.fullName ?? "Unknown assessor",
                            ],
                            ["Assessment type", item.type.replaceAll("_", " ")],
                            [
                              "Control effectiveness",
                              item.controlEffectiveness === null
                                ? "Not recorded"
                                : `${item.controlEffectiveness}%`,
                            ],
                            ["Target risk", item.targetRisk ?? "Not recorded"],
                            [
                              "Risk appetite",
                              item.riskAppetite ?? "Not recorded",
                            ],
                            [
                              "Risk tolerance",
                              item.riskTolerance ?? "Not recorded",
                            ],
                            ["Methodology", item.methodologyVersion],
                          ] as [string, string][]
                        ).map(([label, value]) => (
                          <div key={label}>
                            <dt className="text-muted text-xs font-medium uppercase">
                              {label}
                            </dt>
                            <dd className="mt-0.5 break-words">{value}</dd>
                          </div>
                        ))}
                      </dl>
                      {item.reason ? (
                        <div className="mt-3 border-t border-border pt-3 text-sm">
                          <p className="text-muted text-xs font-medium uppercase">
                            Assessment basis
                          </p>
                          <p className="mt-1 whitespace-pre-wrap break-words">
                            {item.reason}
                          </p>
                        </div>
                      ) : null}
                    </article>
                  ))}
                <Pagination
                  page={currentPage}
                  pageCount={pageCount}
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
                  No residual risk history
                </p>
                <p className="text-muted mt-0.5 text-xs">
                  Saved residual risk records will appear here.
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
          /* ── Assess panel ── */
          <form
            id="residual-assess-panel"
            role="tabpanel"
            aria-labelledby="residual-assess-tab"
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
                Unable to load the risk. Close and reopen this dialog to try
                again.
              </Alert>
            ) : null}

            {/* Control effectiveness summary */}
            {risk.data ? (
              <section aria-labelledby="residual-controls-heading" className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <ShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="residual-controls-heading"
                      className="text-sm font-semibold text-foreground"
                    >
                      Related control effectiveness
                    </h3>
                    <p className="text-xs text-muted">
                      Reference only — effectiveness does not automatically
                      determine the residual rating.
                    </p>
                  </div>
                </div>
                <div className="border-border overflow-hidden rounded-xl border">
                  {risk.data.controls.length ? (
                    <ul className="divide-y divide-border">
                      {risk.data.controls.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm"
                        >
                          <span className="min-w-0 break-words">
                            {item.code} — {item.name}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 tabular-nums font-medium",
                              item.latestEffectiveness === null
                                ? "text-warning"
                                : "text-foreground",
                            )}
                          >
                            {item.latestEffectiveness === null
                              ? "Not assessed"
                              : `${item.latestEffectiveness}%`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted px-3.5 py-4 text-sm">
                      No controls linked to this risk.
                    </p>
                  )}
                </div>
              </section>
            ) : null}

            <fieldset className="space-y-6" disabled={cannotSave}>
              <legend className="sr-only">Residual risk values</legend>

              {/* Section — Likelihood */}
              <section aria-labelledby="residual-likelihood-heading" className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <Zap
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="residual-likelihood-heading"
                      className="text-sm font-semibold text-foreground"
                    >
                      Residual likelihood
                    </h3>
                    <p className="text-xs text-muted">
                      Likelihood after existing controls are applied. (1 = Rare,
                      5 = Almost certain)
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-5">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const meta = likelihoodMeta[value];
                    return (
                      <label
                        key={value}
                        className={cn(
                          "border-border flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition-colors",
                          Number(likelihood) === value
                            ? "border-brand bg-brand/5"
                            : "bg-surface hover:bg-neutral-soft",
                          cannotSave && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          value={value}
                          {...register("likelihood", { valueAsNumber: true })}
                        />
                        <span className="font-semibold tabular-nums">
                          {value}
                        </span>
                        <span className="font-medium leading-tight text-xs">
                          {meta?.label}
                        </span>
                        <span className="text-muted text-xs leading-snug">
                          {meta?.description}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {errors.likelihood ? (
                  <p className="text-danger text-xs" role="alert">
                    {errors.likelihood.message}
                  </p>
                ) : null}
              </section>

              {/* Section — Impact */}
              <section aria-labelledby="residual-impact-heading" className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <ShieldOff
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="residual-impact-heading"
                      className="text-sm font-semibold text-foreground"
                    >
                      Residual impact
                    </h3>
                    <p className="text-xs text-muted">
                      Potential impact after controls. (1 = Insignificant, 5 =
                      Severe)
                    </p>
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-5">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const meta = impactMeta[value];
                    return (
                      <label
                        key={value}
                        className={cn(
                          "border-border flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition-colors",
                          Number(impact) === value
                            ? "border-brand bg-brand/5"
                            : "bg-surface hover:bg-neutral-soft",
                          cannotSave && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <input
                          type="radio"
                          className="sr-only"
                          value={value}
                          {...register("impact", { valueAsNumber: true })}
                        />
                        <span className="font-semibold tabular-nums">
                          {value}
                        </span>
                        <span className="font-medium leading-tight text-xs">
                          {meta?.label}
                        </span>
                        <span className="text-muted text-xs leading-snug">
                          {meta?.description}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {errors.impact ? (
                  <p className="text-danger text-xs" role="alert">
                    {errors.impact.message}
                  </p>
                ) : null}
              </section>

              {/* Calculated score strip */}
              <div className="border-border bg-surface flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
                <div>
                  <p className="text-muted text-xs font-medium uppercase">
                    Residual score
                  </p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{score}</p>
                </div>
                <div>
                  <p className="text-muted text-xs font-medium uppercase">
                    Formula
                  </p>
                  <p className="mt-1 font-mono text-sm tabular-nums">
                    {Number(likelihood)} × {Number(impact)} = {score}
                  </p>
                </div>
                <StatusBadge tone={ratingTone(score)}>
                  {rating(score)}
                </StatusBadge>
              </div>

              {/* Section — Risk thresholds */}
              <section aria-labelledby="residual-thresholds-heading" className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <Target
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <div>
                    <h3
                      id="residual-thresholds-heading"
                      className="text-sm font-semibold text-foreground"
                    >
                      Risk thresholds
                    </h3>
                    <p className="text-xs text-muted">
                      Appetite and tolerance apply to this risk. Once recorded,
                      they are reused in subsequent assessments.
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {(
                    [
                      ["targetRisk", "Target risk"],
                      ["riskAppetite", "Risk appetite"],
                      ["riskTolerance", "Risk tolerance"],
                    ] as const
                  ).map(([name, label]) => (
                    <div key={name} className="space-y-1.5">
                      <label
                        htmlFor={`residual-${name}`}
                        className="text-sm font-medium text-foreground"
                      >
                        {label}
                      </label>
                      <Select
                        id={`residual-${name}`}
                        {...register(name)}
                        disabled={
                          cannotSave ||
                          Boolean(established && name !== "targetRisk")
                        }
                      >
                        {levels.map((level) => (
                          <option key={level} value={level}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </option>
                        ))}
                      </Select>
                      {errors[name] ? (
                        <p className="text-danger text-xs" role="alert">
                          {errors[name]?.message}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>

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
                      id="residual-reason-heading"
                      className="text-sm font-semibold text-foreground"
                    >
                      Assessment basis
                      <span className="text-muted ml-1.5 text-xs font-normal">
                        (optional)
                      </span>
                    </h3>
                    <p className="text-xs text-muted">
                      Explain the evidence and control effectiveness considered.
                      Max 3,000 characters.
                    </p>
                  </div>
                </div>
                <Textarea
                  id="residualReason"
                  rows={4}
                  maxLength={3000}
                  aria-labelledby="residual-reason-heading"
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
                Residual risk reflects exposure after existing controls.
                Inherent risk and all linked control effectiveness assessments
                must be recorded first. Saving does not accept or close the
                risk.
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
                      <GaugeCircle
                        aria-hidden="true"
                        className="size-4"
                        strokeWidth={1.8}
                      />
                      Save residual assessment
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
