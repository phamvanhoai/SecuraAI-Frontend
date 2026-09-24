"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
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
  const mutation = usePerformResidualRiskAssessment(risk?.assessment.id ?? "");
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
        risk.residualRisk
          ? "Residual risk reassessed"
          : "Residual risk assessed",
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
      title={
        risk?.residualRisk
          ? "Reassess Residual Risk"
          : "Perform Residual Risk Assessment"
      }
      dialogRef={dialogRef}
      className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
    >
      {risk ? (
        <form
          className="space-y-4"
          noValidate
          onSubmit={(event) => void submit(event)}
        >
          <div>
            <p className="font-medium wrap-anywhere">
              {risk.assessment.riskCode} - {risk.assessment.title}
            </p>
            <p className="text-muted mt-1 text-sm">
              Inherent risk: {risk.inherentRisk.score} (
              {risk.inherentRisk.level})
            </p>
          </div>

          {risk.residualRisk ? (
            <Alert>
              This replaces the current residual score of{" "}
              {risk.residualRisk.score}. The previous values and your note
              remain available in the audit log.
            </Alert>
          ) : null}

          {acceptWithoutActions ? (
            <Alert>
              This plan accepts the risk without treatment actions. Residual
              likelihood and impact must remain equal to the inherent
              assessment.
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
            className="space-y-4"
            disabled={mutation.isPending || needsReload}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="residual-likelihood"
                >
                  Residual likelihood
                </label>
                <Select
                  id="residual-likelihood"
                  disabled={acceptWithoutActions}
                  value={likelihood}
                  onChange={(event) => {
                    setLikelihood(Number(event.target.value));
                    setDiscarding(false);
                  }}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="residual-impact"
                >
                  Residual impact
                </label>
                <Select
                  id="residual-impact"
                  disabled={acceptWithoutActions}
                  value={impact}
                  onChange={(event) => {
                    setImpact(Number(event.target.value));
                    setDiscarding(false);
                  }}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div
              className={
                scoreValid
                  ? "border-border bg-neutral-soft rounded-xl border p-4"
                  : "border-danger/25 bg-danger-soft text-danger rounded-xl border p-4"
              }
              aria-live="polite"
            >
              <p className="text-xs font-medium tracking-wide uppercase">
                Calculated residual risk
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {score}{" "}
                <span className="text-sm capitalize">{levelFor(score)}</span>
              </p>
              <p className="mt-1 text-sm">
                {scoreValid
                  ? `Reduction: ${reduction} point${reduction === 1 ? "" : "s"}.`
                  : `This exceeds the inherent score of ${risk.inherentRisk.score}.`}
              </p>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                htmlFor="residual-assessment-note"
              >
                Assessment note{" "}
                <span className="text-danger" aria-hidden="true">
                  *
                </span>
              </label>
              <Textarea
                id="residual-assessment-note"
                value={note}
                maxLength={2000}
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
                className={
                  noteTouched && !noteValid
                    ? "text-danger text-xs"
                    : "text-muted text-xs"
                }
              >
                {noteTouched && !noteValid
                  ? "Explain the evidence and control effectiveness in at least 10 characters."
                  : `${note.length}/2000 characters. This note is retained in the audit log.`}
              </p>
            </div>
          </fieldset>

          <p className="text-muted text-sm">
            Saving this assessment does not accept the residual risk or close
            the risk.
          </p>

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

          <div className="flex flex-wrap justify-end gap-2">
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
                Reload risk details
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={mutation.isPending || !scoreValid || !noteValid}
              >
                {mutation.isPending ? "Saving..." : "Save residual assessment"}
              </Button>
            )}
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
