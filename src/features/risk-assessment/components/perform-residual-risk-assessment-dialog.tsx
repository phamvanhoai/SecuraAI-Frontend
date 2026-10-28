"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  FileText,
  Gauge,
  Info,
  Loader2,
  RefreshCw,
  ShieldOff,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/api-error";
import { usePerformResidualRiskAssessment } from "../hooks/use-perform-residual-risk-assessment";
import type { RiskDetail } from "../schemas/risk-detail-schema";
import { performResidualRiskAssessmentRequestSchema } from "../schemas/perform-residual-risk-assessment-schema";

function backendErrorCode(error: ApiError): string | undefined {
  if (typeof error.details !== "object" || error.details === null)
    return undefined;
  const envelope = error.details as { error?: { code?: unknown } };
  return typeof envelope.error?.code === "string"
    ? envelope.error.code
    : undefined;
}

function levelFor(score: number): "low" | "medium" | "high" | "critical" {
  if (score <= 4) return "low";
  if (score <= 9) return "medium";
  if (score <= 16) return "high";
  return "critical";
}

function labelFor(score: number): string {
  const level = levelFor(score);
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function ratingTone(
  score: number,
): "success" | "info" | "warning" | "danger" {
  const level = levelFor(score);
  return level === "low"
    ? "success"
    : level === "medium"
      ? "info"
      : level === "high"
        ? "warning"
        : "danger";
}

const errorMessages: Readonly<Record<string, string>> = {
  ACTOR_INACTIVE:
    "Your account is no longer active. Sign in again or contact an administrator.",
  TREATMENT_PLAN_REQUIRED:
    "This risk does not have an active treatment plan. Reload the assessment before trying again.",
  RISK_ASSESSMENT_CHANGED:
    "This risk changed after the dialog opened. Reload its details and review the latest values.",
  RISK_NOT_READY_FOR_RESIDUAL_ASSESSMENT:
    "Only approved or in-treatment risks can receive a residual assessment.",
  TREATMENT_PLAN_NOT_READY:
    "The active treatment plan is not ready for residual assessment.",
  TREATMENT_ACTIONS_INCOMPLETE:
    "Complete every active treatment action before assessing residual risk.",
  RESIDUAL_EXCEEDS_INHERENT:
    "Residual risk cannot exceed the inherent risk. Review the likelihood and impact.",
  ACCEPT_WITHOUT_ACTIONS_MUST_MATCH_INHERENT:
    "An accepted risk without treatment actions must retain its inherent likelihood and impact.",
};

const likelihoodLabels: Record<number, { label: string; description: string }> =
  {
    1: { label: "Rare", description: "Exceptional, not expected normally." },
    2: { label: "Unlikely", description: "Could occur, but not expected." },
    3: { label: "Possible", description: "May occur under plausible conditions." },
    4: { label: "Likely", description: "Expected in many circumstances." },
    5: {
      label: "Almost certain",
      description: "Expected frequently or recurring.",
    },
  };

const impactLabels: Record<number, { label: string; description: string }> = {
  1: { label: "Insignificant", description: "Minimal security effect." },
  2: { label: "Minor", description: "Limited disruption, routine recovery." },
  3: {
    label: "Moderate",
    description: "Material impact requiring coordinated response.",
  },
  4: {
    label: "Major",
    description: "Serious operational or reputational harm.",
  },
  5: {
    label: "Severe",
    description: "Critical harm to services, customers, or regulated data.",
  },
};

export function PerformResidualRiskAssessmentDialog({
  risk,
  onClose,
  onReload,
}: {
  risk: RiskDetail | null;
  onClose: () => void;
  onReload: () => void;
}) {
  return (
    <ResidualRiskAssessmentDialogContent
      key={
        risk ? `${risk.assessment.id}:${risk.assessment.updatedAt}` : "closed"
      }
      risk={risk}
      onClose={onClose}
      onReload={onReload}
    />
  );
}

function ResidualRiskAssessmentDialogContent({
  risk,
  onClose,
  onReload,
}: {
  risk: RiskDetail | null;
  onClose: () => void;
  onReload: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const activePlan = risk?.treatmentPlans.find(
    ({ status }) => status !== "cancelled",
  );
  const activeActions = activePlan?.actions.filter(
    ({ status }) => status !== "cancelled",
  );
  const acceptWithoutActions =
    activePlan?.strategy === "accept" && activeActions?.length === 0;

  const initialLikelihood = acceptWithoutActions
    ? (risk?.inherentRisk.likelihood ?? 1)
    : (risk?.residualRisk?.likelihood ?? 1);
  const initialImpact = acceptWithoutActions
    ? (risk?.inherentRisk.impact ?? 1)
    : (risk?.residualRisk?.impact ?? 1);

  const [likelihood, setLikelihood] = useState(initialLikelihood);
  const [impact, setImpact] = useState(initialImpact);
  const [note, setNote] = useState("");
  const [noteTouched, setNoteTouched] = useState(false);
  const [message, setMessage] = useState<string>();
  const [needsReload, setNeedsReload] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  const mutation = usePerformResidualRiskAssessment(
    risk?.assessment.id ?? "",
  );
  const toast = useToast();

  const normalizedNote = note.normalize("NFKC").replace(/\s+/gu, " ").trim();
  const score = likelihood * impact;
  const reduction = risk ? risk.inherentRisk.score - score : 0;
  const scoreValid = risk !== null && score <= risk.inherentRisk.score;
  const noteValid =
    normalizedNote.length >= 10 && normalizedNote.length <= 2000;
  const dirty =
    note.length > 0 ||
    likelihood !== initialLikelihood ||
    impact !== initialImpact;

  const isReassess = Boolean(risk?.residualRisk);
  const dialogTitle = isReassess
    ? "Reassess Residual Risk"
    : "Perform Residual Risk Assessment";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (risk) {
      if (dialog && !dialog.open) dialog.showModal();
    } else if (dialog?.open) dialog.close();
  }, [risk]);

  useEffect(() => {
    if (message) errorRef.current?.focus();
  }, [message]);

  function close(): void {
    if (mutation.isPending) return;
    if (dirty && !discarding) setDiscarding(true);
    else onClose();
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setNoteTouched(true);
    if (!risk || mutation.isPending || needsReload || !scoreValid || !noteValid)
      return;
    const parsed = performResidualRiskAssessmentRequestSchema.safeParse({
      residualLikelihood: likelihood,
      residualImpact: impact,
      assessmentNote: normalizedNote,
      expectedUpdatedAt: risk.assessment.updatedAt,
    });
    if (!parsed.success) {
      setMessage(
        "Review the residual likelihood, impact, and assessment note.",
      );
      return;
    }
    setMessage(undefined);
    try {
      const result = await mutation.mutateAsync({
        riskAssessmentId: risk.assessment.id,
        data: parsed.data,
      });
      toast.success(
        isReassess ? "Residual risk reassessed" : "Residual risk assessed",
        `${risk.assessment.riskCode}: ${result.residualRisk.score} (${result.residualRisk.level}).`,
      );
      onClose();
    } catch (cause: unknown) {
      const code =
        cause instanceof ApiError ? backendErrorCode(cause) : undefined;
      const reload =
        cause instanceof ApiError &&
        (cause.status === 0 ||
          cause.status >= 500 ||
          [403, 404, 409].includes(cause.status));
      setNeedsReload(reload);
      setMessage(
        (code ? errorMessages[code] : undefined) ??
          "Unable to save the residual assessment. Review the latest risk details and try again.",
      );
    }
  }

  return (
    <Dialog
      title={dialogTitle}
      dialogRef={dialogRef}
      className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      {risk ? (
        <form
          className="space-y-6"
          noValidate
          onSubmit={(event) => void submit(event)}
        >
          {/* Context bar */}
          <div className="border-border bg-neutral-soft/30 rounded-lg border p-3.5 text-xs">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono font-semibold text-muted">
                {risk.assessment.riskCode}
              </span>
              <span className="text-foreground font-semibold break-words">
                {risk.assessment.title}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-muted">
              <span>
                Inherent:{" "}
                <span className="font-medium text-foreground">
                  {risk.inherentRisk.score} ({risk.inherentRisk.level})
                </span>
              </span>
              {risk.residualRisk ? (
                <span>
                  Current residual:{" "}
                  <span className="font-medium text-foreground">
                    {risk.residualRisk.score} ({risk.residualRisk.level})
                  </span>
                </span>
              ) : null}
              {activePlan ? (
                <span>
                  Strategy:{" "}
                  <span className="font-medium capitalize text-foreground">
                    {activePlan.strategy}
                  </span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Contextual alerts */}
          {isReassess ? (
            <Alert>
              This replaces the current residual score of{" "}
              {risk.residualRisk?.score}. The previous values and your note
              remain available in the audit log.
            </Alert>
          ) : null}
          {acceptWithoutActions ? (
            <Alert>
              This plan accepts the risk without treatment actions. Residual
              likelihood and impact must remain equal to the inherent assessment.
            </Alert>
          ) : null}
          {message ? (
            <div ref={errorRef} role="alert" tabIndex={-1}>
              <Alert className="border-danger/25 bg-danger-soft text-danger">
                {message}
              </Alert>
            </div>
          ) : null}

          <fieldset
            className="space-y-6"
            disabled={mutation.isPending || needsReload}
          >
            <legend className="sr-only">Residual risk values</legend>

            {/* Section — Likelihood */}
            <section
              aria-labelledby="residual-likelihood-heading"
              className="space-y-3"
            >
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
                  const meta = likelihoodLabels[value];
                  const disabled =
                    acceptWithoutActions ||
                    mutation.isPending ||
                    needsReload;
                  return (
                    <label
                      key={value}
                      className={cn(
                        "border-border flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition-colors",
                        likelihood === value
                          ? "border-brand bg-brand/5"
                          : "bg-surface hover:bg-neutral-soft",
                        disabled && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name="residual-likelihood"
                        value={value}
                        checked={likelihood === value}
                        disabled={disabled}
                        onChange={() => {
                          setLikelihood(value);
                          setDiscarding(false);
                        }}
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
            </section>

            {/* Section — Impact */}
            <section
              aria-labelledby="residual-impact-heading"
              className="space-y-3"
            >
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
                  const meta = impactLabels[value];
                  const disabled =
                    acceptWithoutActions ||
                    mutation.isPending ||
                    needsReload;
                  return (
                    <label
                      key={value}
                      className={cn(
                        "border-border flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition-colors",
                        impact === value
                          ? "border-brand bg-brand/5"
                          : "bg-surface hover:bg-neutral-soft",
                        disabled && "cursor-not-allowed opacity-60",
                      )}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name="residual-impact"
                        value={value}
                        checked={impact === value}
                        disabled={disabled}
                        onChange={() => {
                          setImpact(value);
                          setDiscarding(false);
                        }}
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
            </section>

            {/* Calculated score strip */}
            <div
              aria-live="polite"
              className={cn(
                "flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4",
                scoreValid
                  ? "border-border bg-surface"
                  : "border-danger/25 bg-danger-soft",
              )}
            >
              <div>
                <p className="text-muted text-xs font-medium uppercase">
                  Calculated residual score
                </p>
                <p
                  className={cn(
                    "mt-1 text-2xl font-bold tabular-nums",
                    !scoreValid && "text-danger",
                  )}
                >
                  {score}
                </p>
              </div>
              <div>
                <p className="text-muted text-xs font-medium uppercase">
                  Formula
                </p>
                <p className="mt-1 font-mono text-sm tabular-nums">
                  {likelihood} × {impact} = {score}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StatusBadge tone={ratingTone(score)}>
                  {labelFor(score)}
                </StatusBadge>
                <p
                  className={cn(
                    "text-xs",
                    scoreValid ? "text-muted" : "text-danger font-medium",
                  )}
                >
                  {scoreValid
                    ? `Reduction: ${reduction} point${reduction === 1 ? "" : "s"}.`
                    : `This exceeds the inherent score of ${risk.inherentRisk.score}.`}
                </p>
              </div>
            </div>

            {/* Section — Assessment note */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <FileText
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <div>
                  <h3
                    id="residual-note-heading"
                    className="text-sm font-semibold text-foreground"
                  >
                    Assessment note
                    <span className="text-danger ml-0.5" aria-hidden="true">
                      *
                    </span>
                  </h3>
                  <p className="text-xs text-muted">
                    Explain the evidence and control effectiveness. Retained in
                    the audit log. Min 10, max 2,000 characters.
                  </p>
                </div>
              </div>
              <Textarea
                id="residual-assessment-note"
                value={note}
                maxLength={2000}
                rows={4}
                aria-labelledby="residual-note-heading"
                aria-invalid={noteTouched && !noteValid}
                aria-describedby="residual-assessment-note-help"
                onBlur={() => setNoteTouched(true)}
                onChange={(event) => {
                  setNote(event.target.value);
                  setDiscarding(false);
                }}
              />
              <p
                id="residual-assessment-note-help"
                className={cn(
                  "text-xs",
                  noteTouched && !noteValid
                    ? "text-danger"
                    : "text-muted",
                )}
                role={noteTouched && !noteValid ? "alert" : undefined}
              >
                {noteTouched && !noteValid
                  ? "Explain the evidence and control effectiveness in at least 10 characters."
                  : `${note.length}/2,000 characters.`}
              </p>
            </div>
          </fieldset>

          {/* Discard confirmation */}
          {discarding ? (
            <Alert>
              <p>Discard this unsaved residual assessment?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setDiscarding(false)}
                >
                  Keep editing
                </Button>
                <Button type="button" variant="danger" onClick={onClose}>
                  Discard changes
                </Button>
              </div>
            </Alert>
          ) : null}

          {/* Info hint */}
          <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
            <Info
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-muted"
              strokeWidth={1.8}
            />
            <p className="text-xs text-muted">
              Saving this assessment does not accept the residual risk or close
              the risk. A separate acceptance step is required.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <div />
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={mutation.isPending}
                onClick={close}
              >
                Cancel
              </Button>
              {needsReload ? (
                <Button type="button" onClick={onReload}>
                  <RefreshCw
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.8}
                  />
                  Reload risk details
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={
                    mutation.isPending || !scoreValid || !noteValid
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
                      <Gauge
                        aria-hidden="true"
                        className="size-4"
                        strokeWidth={1.8}
                      />
                      {isReassess
                        ? "Save reassessment"
                        : "Save residual assessment"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
