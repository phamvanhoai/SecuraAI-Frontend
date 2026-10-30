"use client";

import {
  AlertTriangle,
  Box,
  BrainCircuit,
  Clock,
  Database,
  Info,
  Loader2,
  Radar,
  RefreshCw,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useToast } from "@/components/feedback/toast";
import { StatusBadge } from "@/components/data-display/static-product";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useAiAlertExplanation,
  useRegenerateAiAlertExplanation,
} from "../hooks/use-ai-alerts";
import type { AiAlert } from "../schemas/ai-alert-schema";

export function AiAlertDetailDialog({
  alert,
  onClose,
}: {
  alert: AiAlert | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [reason, setReason] = useState("");
  const [regenerateError, setRegenerateError] = useState<string>();
  const explanation = useAiAlertExplanation(alert?.id ?? null);
  const regenerate = useRegenerateAiAlertExplanation(alert?.id ?? null);
  const toast = useToast();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (alert && !dialog.open) dialog.showModal();
    if (!alert && dialog.open) dialog.close();
  }, [alert]);

  const closeDialog = (): void => {
    setShowRegenerate(false);
    setReason("");
    setRegenerateError(undefined);
    onClose();
  };

  const submitRegeneration = async (): Promise<void> => {
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 10) {
      setRegenerateError("Reason must be at least 10 characters.");
      return;
    }
    setRegenerateError(undefined);
    try {
      await regenerate.mutateAsync({ reason: normalizedReason });
      toast.success(
        "Explanation regenerated",
        "The latest explanation is displayed and the change was recorded in the audit log.",
      );
      setShowRegenerate(false);
      setReason("");
    } catch (error: unknown) {
      setRegenerateError(
        error instanceof Error
          ? error.message
          : "Unable to regenerate the alert explanation.",
      );
    }
  };

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={closeDialog}
      title="Anomaly alert details"
    >
      {alert ? (
        <div className="space-y-6">
          <div className="border-border flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold">{alert.title}</h3>
              <p className="text-muted mt-1 font-mono text-xs [overflow-wrap:anywhere]">
                {alert.alertCode}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {alert.riskLevel ? (
                <StatusBadge tone={riskLevelTone(alert.riskLevel)}>
                  {formatRiskLevel(alert.riskLevel)} risk
                </StatusBadge>
              ) : null}
              <StatusBadge tone={statusTone(alert.status)}>
                {formatStatus(alert.status)}
              </StatusBadge>
            </div>
          </div>

          {/* ── Detection summary ── */}
          <div className="space-y-3">
            <div className="border-border flex items-start gap-2 border-b pb-2">
              <Radar
                aria-hidden="true"
                className="text-brand mt-0.5 size-4 shrink-0"
                strokeWidth={1.8}
              />
              <h3 className="text-sm font-semibold">Detection summary</h3>
            </div>
            <div className="border-border bg-neutral-soft/30 rounded-xl border p-4">
              <p className="text-muted text-sm leading-6">
                {alert.description}
              </p>
            </div>
          </div>

          {/* ── Context bar ── */}
          <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border p-3.5 text-xs">
            <span className="text-muted inline-flex items-center gap-1.5">
              <Zap className="text-brand size-3.5 shrink-0" strokeWidth={1.8} />
              <span>
                Detected:{" "}
                <strong className="text-foreground font-semibold">
                  {formatDate(alert.detectedAt)}
                </strong>
              </span>
            </span>
            <span className="text-border hidden sm:inline">·</span>
            <span className="text-muted inline-flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" strokeWidth={1.8} />
              <span>
                Event:{" "}
                <strong className="text-foreground font-semibold">
                  {formatDate(alert.event.eventTime)}
                </strong>
              </span>
            </span>
            <span className="text-border hidden sm:inline">·</span>
            <span className="text-muted">
              Source:{" "}
              <strong className="text-foreground font-semibold">
                {alert.logSource.name}
              </strong>
            </span>
          </div>

          {/* ── Metric cards strip ── */}
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SummaryMetric
              label="Detection score"
              value={formatScore(alert.anomalyScore)}
            />
            <SummaryMetric
              label="Risk level"
              value={alert.riskLevel ? formatRiskLevel(alert.riskLevel) : "—"}
            />
            <SummaryMetric label="Alert code" value={alert.alertCode} />
          </dl>

          <DetailSection
            icon={Database}
            id="alert-detection-context"
            title="Detection context"
          >
            <dl className="border-border bg-neutral-soft/30 grid gap-x-6 gap-y-4 rounded-xl border p-4 sm:grid-cols-2">
              <Detail label="Event type" value={alert.event.eventType} />
              <Detail
                label="Event time"
                value={formatDate(alert.event.eventTime)}
              />
              <Detail label="Log source" value={alert.logSource.name} />
              <Detail label="Source type" value={alert.logSource.sourceType} />
            </dl>
          </DetailSection>

          <DetailSection
            icon={Box}
            id="alert-asset-model-context"
            title="Asset & model context"
          >
            <dl className="border-border bg-neutral-soft/30 grid gap-x-6 gap-y-4 rounded-xl border p-4 sm:grid-cols-2">
              <Detail label="Asset" value={alert.asset?.name ?? "Not linked"} />
              <Detail
                label="Asset code"
                value={alert.asset?.assetCode ?? "Not available"}
              />
              <Detail
                label="Scoring configuration"
                value={alert.model.name + " " + alert.model.version}
              />
              <Detail label="Detection method" value={alert.model.provider} />
            </dl>
          </DetailSection>

          <section
            aria-labelledby="ai-decision-explanation"
            className="space-y-4"
          >
            <SectionHeading
              icon={BrainCircuit}
              id="ai-decision-explanation"
              title="Alert explanation"
            />
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <Info
                className="text-brand mt-0.5 size-4 shrink-0"
                strokeWidth={1.8}
              />
              <p className="text-xs leading-5">
                The detection engine compares activity with historical patterns.
                Rules provide context, not fixed bonus points. Events without
                sufficient history remain unscored. Alerts are created only when
                the detection score meets the applicable threshold. Scores
                indicate signal strength, not attack probability. Repeated
                matches may be grouped in the recorded evidence. Ollama only
                turns the stored evidence into analyst-readable text; when
                unavailable, a deterministic fallback explanation is shown.
              </p>
            </div>
            {explanation.isPending ? (
              <div
                aria-label="Loading alert explanation"
                className="space-y-2"
                role="status"
              >
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : explanation.isError ? (
              <div
                role="alert"
                className="border-border bg-neutral-soft/30 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle
                    className="text-warning size-4 shrink-0"
                    strokeWidth={1.8}
                  />
                  <span className="text-sm">
                    Unable to load the alert explanation.
                  </span>
                </div>
                <Button
                  onClick={() => void explanation.refetch()}
                  variant="secondary"
                  className="shrink-0"
                >
                  Try again
                </Button>
              </div>
            ) : explanation.data === null ? (
              <p className="text-muted text-sm">
                No alert explanation has been recorded for this alert.
              </p>
            ) : explanation.data ? (
              <div className="space-y-4 text-sm">
                <details className="border-border rounded-lg border p-3">
                  <summary className="cursor-pointer font-medium">
                    Stored explanation
                  </summary>
                  <p className="mt-3 [overflow-wrap:anywhere] whitespace-pre-wrap">
                    {readableStoredExplanation(
                      explanation.data.explanationText,
                    )}
                  </p>
                </details>
                <ExplanationData
                  label="Why this alert was created"
                  value={explanation.data.featureContributions}
                  variant="contributions"
                />
                <details className="border-border rounded-lg border p-3">
                  <summary className="cursor-pointer font-medium">
                    Recorded detection metadata
                  </summary>
                  <div className="mt-3">
                    <ExplanationData
                      label="Baseline data"
                      value={explanation.data.baselineData}
                    />
                  </div>
                </details>
                <div className="border-border border-t pt-4">
                  {showRegenerate ? (
                    <div className="bg-neutral-soft/30 space-y-3 rounded-lg p-4">
                      <div>
                        <label
                          className="text-sm font-semibold"
                          htmlFor="regenerate-explanation-reason"
                        >
                          Reason for regeneration
                        </label>
                        <p className="text-muted mt-1 text-xs leading-5">
                          The new explanation replaces the displayed text. The
                          previous and new values remain traceable in the audit
                          log.
                        </p>
                      </div>
                      <Textarea
                        aria-describedby="regenerate-explanation-help"
                        disabled={regenerate.isPending}
                        id="regenerate-explanation-reason"
                        maxLength={500}
                        onChange={(event) => setReason(event.target.value)}
                        placeholder="Example: Recheck the explanation after reviewing the contributing factors."
                        rows={3}
                        value={reason}
                      />
                      <div className="flex items-center justify-between gap-3">
                        <p
                          className="text-muted text-xs"
                          id="regenerate-explanation-help"
                        >
                          {reason.length}/500 characters
                        </p>
                        <div className="flex gap-2">
                          <Button
                            disabled={regenerate.isPending}
                            onClick={() => {
                              setShowRegenerate(false);
                              setRegenerateError(undefined);
                            }}
                            variant="secondary"
                          >
                            Cancel
                          </Button>
                          <Button
                            disabled={
                              regenerate.isPending || reason.trim().length < 10
                            }
                            onClick={() => void submitRegeneration()}
                          >
                            {regenerate.isPending ? (
                              <Loader2
                                aria-hidden="true"
                                className="size-4 animate-spin"
                                strokeWidth={2}
                              />
                            ) : (
                              <RefreshCw
                                aria-hidden="true"
                                className="size-4"
                                strokeWidth={1.8}
                              />
                            )}
                            {regenerate.isPending
                              ? "Regenerating…"
                              : "Regenerate"}
                          </Button>
                        </div>
                      </div>
                      {regenerateError ? (
                        <div
                          role="alert"
                          className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5"
                        >
                          <AlertTriangle
                            className="text-danger mt-0.5 size-4 shrink-0"
                            strokeWidth={1.8}
                          />
                          <p className="text-xs">{regenerateError}</p>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-muted text-xs">
                        Generated {formatDate(explanation.data.createdAt)}
                      </p>
                      <Button
                        onClick={() => setShowRegenerate(true)}
                        variant="secondary"
                      >
                        <RefreshCw
                          aria-hidden="true"
                          className="size-4"
                          strokeWidth={1.8}
                        />
                        Regenerate explanation
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </section>

          {/* ── Metadata footer bar ── */}
          <div className="border-border bg-neutral-soft/20 text-muted flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-xs [overflow-wrap:anywhere]">
            <div className="flex min-w-0 items-center gap-1.5">
              <Radar className="size-3.5 shrink-0" strokeWidth={1.8} />
              <span>
                Alert ID:{" "}
                <strong className="text-foreground font-mono font-medium">
                  {alert.id}
                </strong>
              </span>
            </div>
            <span>
              Event ID:{" "}
              <strong className="text-foreground font-mono font-medium">
                {alert.event.id}
              </strong>
            </span>
          </div>

          <div className="border-border flex items-center justify-end gap-2 border-t pt-4">
            <Button
              onClick={() => dialogRef.current?.close()}
              type="button"
              variant="secondary"
            >
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

type ExplanationDataProps = {
  label: string;
  value: unknown;
  variant?: "metrics" | "contributions";
};

function DetailSection({
  icon,
  id,
  title,
  children,
}: {
  icon: LucideIcon;
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <SectionHeading icon={icon} id={id} title={title} />
      {children}
    </section>
  );
}

function SectionHeading({
  icon: Icon,
  id,
  title,
}: {
  icon: LucideIcon;
  id: string;
  title: string;
}) {
  return (
    <div className="border-border flex items-center gap-2 border-b pb-2.5">
      <Icon
        aria-hidden="true"
        className="text-brand size-4"
        strokeWidth={1.8}
      />
      <h4 className="text-sm font-semibold" id={id}>
        {title}
      </h4>
    </div>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border bg-surface min-w-0 rounded-xl border p-3.5">
      <dt className="text-muted text-xs font-medium">{label}</dt>
      <dd className="text-foreground mt-1.5 text-base font-bold [overflow-wrap:anywhere] tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function ExplanationData({
  label,
  value,
  variant = "metrics",
}: ExplanationDataProps) {
  if (value === null) return null;

  const contributions =
    variant === "contributions" ? parseContributions(value) : null;

  if (contributions) {
    return <ContributionDetails label={label} contributions={contributions} />;
  }

  return (
    <div className="space-y-2">
      <h5 className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </h5>
      {isRecord(value) ? (
        <dl className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2">
          {Object.entries(value).map(([key, entry]) => (
            <div className="bg-surface min-w-0 p-3" key={key}>
              <dt className="text-muted text-xs font-medium">
                {formatLabel(key)}
              </dt>
              <dd className="mt-1 text-sm font-semibold [overflow-wrap:anywhere] tabular-nums">
                {formatMetric(entry)}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="bg-neutral-soft rounded-lg p-3 text-sm [overflow-wrap:anywhere]">
          {formatMetric(value)}
        </p>
      )}
    </div>
  );
}

type Contribution = {
  name: string;
  value: string | null;
  score: number | null;
  rank: number | null;
};

function ContributionDetails({
  label,
  contributions,
}: {
  label: string;
  contributions: Contribution[];
}) {
  const technicalNames = new Set([
    "alert_score_update",
    "statistical_baseline",
    "evidence_event_ids",
    "detection_group",
    "engine_version",
    "policy_snapshot",
    "weight_snapshot",
  ]);
  const candidates = contributions.filter(
    (item) =>
      item.name !== "correlated_detection" && !technicalNames.has(item.name),
  );
  const factors = candidates
    .filter(
      (item) =>
        (item.name === "matched_rules" && item.value !== "[]") ||
        (item.name === "failure_count_in_window" &&
          Number(parsedEvidence(item.value).count) > 0) ||
        (item.score !== null && item.score !== 0),
    )
    .slice(0, 3);
  const correlated = contributions.filter(
    (item) => item.name === "correlated_detection",
  );
  const scoreHistory = contributions.filter(
    (item) => item.name === "alert_score_update",
  );
  const technical = contributions.filter(
    (item) =>
      item.name !== "correlated_detection" &&
      (!factors.includes(item) || item.name === "failure_count_in_window"),
  );
  return (
    <div className="space-y-4">
      <h5 className="text-sm font-semibold">{label}</h5>
      <p className="text-muted text-xs">
        Key evidence behind this alert. Additional parameters are available in
        Technical details.
      </p>
      {factors.length ? (
        <dl className="border-border divide-border divide-y overflow-hidden rounded-lg border">
          {factors.map((feature, index) => (
            <div
              key={`${feature.name}-${index}`}
              className="grid min-w-0 gap-2 p-3 sm:grid-cols-[minmax(0,1fr)_8rem]"
            >
              <div className="min-w-0">
                <dt className="text-sm font-medium">
                  {signalLabel(feature.name)}
                </dt>
                <dd className="mt-1 text-sm [overflow-wrap:anywhere]">
                  {feature.name === "failure_count_in_window" ? (
                    <FailureSummary value={feature.value} />
                  ) : (
                    <RecordedValue value={feature.value} />
                  )}
                </dd>
                {feature.name === "matched_rules" ? (
                  <dd className="text-muted mt-2 text-xs">
                    Rule score indicates signal strength, not attack probability
                    or an additional score.
                  </dd>
                ) : null}
              </div>
              {feature.score !== null && feature.score !== 0 ? (
                <div className="text-sm sm:text-right">
                  <dt className="text-muted text-xs">
                    {feature.name === "matched_rules"
                      ? "Rule score"
                      : feature.score === null || feature.score === 0
                        ? "Supporting context"
                        : "Score contribution"}
                  </dt>
                  <dd className="mt-1 font-semibold tabular-nums">
                    {feature.score === null
                      ? "Context only"
                      : feature.name === "matched_rules"
                        ? new Intl.NumberFormat("en", {
                            style: "percent",
                            maximumFractionDigits: 1,
                          }).format(feature.score)
                        : feature.score === 0
                          ? "No score change"
                          : formatContribution(feature.score)}
                  </dd>
                  {feature.name !== "matched_rules" &&
                  feature.score !== null &&
                  feature.score !== 0 ? (
                    <span className="text-muted text-xs">
                      {feature.score > 0 ? "Raises score" : "Lowers score"}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-muted text-sm">
          No contributing features were recorded.
        </p>
      )}
      <EvidenceSummary contributions={contributions} />
      {scoreHistory.length ? (
        <details className="border-border rounded-lg border">
          <summary className="cursor-pointer p-3 text-sm font-medium">
            Score history ({scoreHistory.length})
          </summary>
          <ol className="border-border divide-border max-h-64 divide-y overflow-y-auto border-t">
            {scoreHistory.map((item, index) => {
              const change = parsedEvidence(item.value);
              return (
                <li key={`score-${index}`} className="p-3 text-sm">
                  {typeof change.previousScore === "number" &&
                  typeof change.score === "number" ? (
                    <p className="font-medium">
                      {formatScore(change.previousScore)} →{" "}
                      {formatScore(change.score)}
                    </p>
                  ) : null}
                  <p className="text-muted mt-1 text-xs">
                    System updated priority after stronger correlated event
                    evidence.
                  </p>
                  {typeof change.updatedAt === "string" ? (
                    <p className="text-muted mt-1 text-xs">
                      {formatDate(change.updatedAt)}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </details>
      ) : null}
      {correlated.length ? (
        <details className="border-border rounded-lg border">
          <summary className="focus-visible:outline-brand cursor-pointer p-3 text-sm font-medium">
            Grouped detections ({correlated.length})
          </summary>
          <p className="text-muted px-3 pb-3 text-xs">
            These additional detections were grouped into this alert instead of
            creating separate alerts. Each row shows its own score and event
            time; scores are not added together.
          </p>
          <ol className="border-border divide-border max-h-64 divide-y overflow-y-auto border-t">
            {correlated.map((feature, index) => (
              <li
                className="p-3 text-sm [overflow-wrap:anywhere]"
                key={`correlated-${index}`}
              >
                <GroupedDetection value={feature.value} number={index + 1} />
              </li>
            ))}
          </ol>
        </details>
      ) : null}
      {technical.length ? (
        <details className="border-border rounded-lg border">
          <summary className="focus-visible:outline-brand cursor-pointer p-3 text-sm font-medium">
            Technical details
          </summary>
          <dl className="border-border divide-border divide-y border-t">
            {technical
              .filter((feature) => feature.name !== "alert_score_update")
              .map((feature, index) => (
                <div className="min-w-0 p-3" key={`${feature.name}-${index}`}>
                  <dt className="text-muted text-xs">
                    {formatLabel(feature.name)}
                  </dt>
                  <dd className="mt-1 text-sm [overflow-wrap:anywhere]">
                    <RecordedValue value={feature.value} />
                  </dd>
                </div>
              ))}
          </dl>
        </details>
      ) : null}
    </div>
  );
}

function GroupedDetection({
  value,
  number,
}: {
  value: string | null;
  number: number;
}) {
  const evidence = parsedEvidence(value);
  const score =
    typeof evidence.score === "number" &&
    Number.isFinite(evidence.score) &&
    evidence.score >= 0 &&
    evidence.score <= 1
      ? evidence.score
      : null;
  const occurredAt =
    typeof evidence.occurredAt === "string" &&
    Number.isFinite(Date.parse(evidence.occurredAt))
      ? evidence.occurredAt
      : null;
  const identifiers = Object.fromEntries(
    ["eventId", "detectionId"].flatMap((key) =>
      typeof evidence[key] === "string" ? [[key, evidence[key]]] : [],
    ),
  );

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">Related detection {number}</p>
          <p className="text-muted mt-1 text-xs tabular-nums">
            {occurredAt ? (
              <time dateTime={occurredAt}>{formatDate(occurredAt)}</time>
            ) : (
              "Event time not recorded"
            )}
          </p>
        </div>
        <p className="text-muted text-xs">
          Detection score{" "}
          <span className="text-foreground ml-1 font-semibold tabular-nums">
            {score === null ? "Not recorded" : formatScore(score)}
          </span>
        </p>
      </div>
      <details>
        <summary className="focus-visible:outline-brand min-h-10 cursor-pointer py-2 text-xs font-medium">
          Technical identifiers for detection {number}
        </summary>
        <div className="text-muted pb-1 text-xs [overflow-wrap:anywhere]">
          <RecordedValue
            value={
              Object.keys(identifiers).length
                ? JSON.stringify(identifiers)
                : value
            }
          />
        </div>
      </details>
    </div>
  );
}

function readableStoredExplanation(text: string): string {
  // Compatibility for the old deterministic fallback only. Do not rewrite
  // model-authored prose or alter the persisted explanation.
  const legacy =
    /^Detection rule matched: (\[[^\n]*?\])\. The signal score is ([\d.]+); rule-based detection is independent of the behavioral threshold ([\d.]+)\./.exec(
      text,
    );
  if (!legacy) return text;
  try {
    const rules: unknown = JSON.parse(legacy[1] ?? "null");
    const score = Number(legacy[2]);
    const threshold = Number(legacy[3]);
    if (
      !Array.isArray(rules) ||
      !rules.every((rule): rule is string => typeof rule === "string") ||
      !Number.isFinite(score) ||
      !Number.isFinite(threshold)
    )
      return text;
    return `${rules.map((rule) => ruleLabels[rule] ?? "Configured detection rule matched").join("; ")}.\n\nPriority score: ${formatScore(score)}. This measures signal strength, not attack probability.\n\nHistorical record from the previous rule-based policy. New alerts require the detection score to meet the configured threshold (${formatScore(threshold)}).\n\nReview the key evidence below to confirm whether the activity was expected. The original record remains stored; supporting parameters are available in Technical details.`;
  } catch {
    return text;
  }
}

function parsedEvidence(value: string | null): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(value ?? "null");
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function EvidenceSummary({ contributions }: { contributions: Contribution[] }) {
  const evidence = (name: string) =>
    parsedEvidence(
      contributions.find((item) => item.name === name)?.value ?? null,
    );
  const hours = evidence("working_hours");
  const baseline = evidence("baseline_context");
  const breakdown = evidence("rule_score_breakdown");
  const statistical = evidence("statistical_baseline");
  const terms: Array<[string, unknown]> = [
    ["Matched rule", breakdown.base],
    ["Rapid sequence of attempts", breakdown.rapidSequence],
    ["Attempts above the limit", breakdown.excessFailures],
    ["Event severity", breakdown.sourceSeverity],
    ["Outside working hours", breakdown.offHours],
    ["New IP address", breakdown.newIp],
    ["New device", breakdown.newDevice],
    ["Successful access after failures", breakdown.successAfterFailures],
  ];
  const activeTerms = terms.filter(
    (term): term is [string, number] =>
      typeof term[1] === "number" && term[1] > 0,
  );
  return (
    <div className="space-y-3">
      {statistical.method === "empirical-history-v1" ? (
        <div className="border-border rounded-lg border p-3">
          <h6 className="text-sm font-semibold">Historical comparison</h6>
          <p className="text-muted mt-1 text-sm">
            Compared with {String(statistical.activeWindows)} previous active{" "}
            {String(statistical.windowMinutes)}-minute windows. No fixed rule
            points are added.
          </p>
          {Array.isArray(statistical.comparisons) ? (
            <dl className="mt-3 space-y-3">
              {statistical.comparisons.filter(isRecord).map((item, index) => (
                <div key={index}>
                  <dt className="text-sm font-medium">
                    {signalLabel(String(item.signal))}
                  </dt>
                  <dd className="text-muted text-sm">
                    Observed: {String(item.observed)}.{" "}
                    {String(item.equallyOrMoreUnusual)} of{" "}
                    {String(item.samples)} historical observations were equally
                    or more unusual.
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
          <p className="text-muted mt-3 text-xs">
            Score = 100 × (1 − adjusted historical tail fraction). Each tail
            fraction = (equally or more unusual observations + 1) / (samples +
            1). The smallest tail is multiplied by the number of comparisons,
            capped at 1, to account for testing several signals. This is
            historical rarity, not attack probability.
          </p>
        </div>
      ) : null}
      {hours.offHours === true ||
      (baseline.ready === true &&
        (baseline.newIp === true || baseline.newDevice === true)) ? (
        <ul className="text-muted list-disc space-y-1 pl-5 text-sm">
          {hours.offHours === true && typeof hours.localHour === "number" ? (
            <li>
              Activity at {String(hours.localHour).padStart(2, "0")}:00–
              {String(hours.localHour).padStart(2, "0")}:59, outside working
              hours ({String(hours.timeZone)}).
            </li>
          ) : null}
          {baseline.ready === true && baseline.newIp === true ? (
            <li>
              IP address not seen in {String(baseline.successfulEvents)}{" "}
              previous successful events.
            </li>
          ) : null}
          {baseline.ready === true && baseline.newDevice === true ? (
            <li>
              Device not seen in the available successful activity history.
            </li>
          ) : null}
        </ul>
      ) : null}
      {activeTerms.length ? (
        <div className="bg-neutral-soft rounded-lg p-3">
          <h6 className="text-sm font-medium">How the score was calculated</h6>
          <p className="text-muted mt-1 text-xs">
            Priority points out of 100; not an attack probability.
          </p>
          <dl className="mt-2 space-y-1">
            {activeTerms.map(([name, value]) => (
              <div key={name} className="flex justify-between gap-3 text-sm">
                <dt>{name}</dt>
                <dd className="tabular-nums">
                  {new Intl.NumberFormat("en", {
                    maximumFractionDigits: 2,
                  }).format(value * 100)}{" "}
                  points
                </dd>
              </div>
            ))}
          </dl>
          {typeof breakdown.cap === "number" ? (
            <p className="text-muted mt-2 text-xs">
              Total capped at {Math.round(breakdown.cap * 100)} points.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FailureSummary({ value }: { value: string | null }) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value ?? "null");
  } catch {
    return <RecordedValue value={value} />;
  }
  if (
    !isRecord(parsed) ||
    typeof parsed.count !== "number" ||
    typeof parsed.windowMinutes !== "number"
  )
    return <RecordedValue value={value} />;
  return (
    <>
      {parsed.count} failed attempts within {parsed.windowMinutes} minutes
      {typeof parsed.account === "string" ? ` for ${parsed.account}` : ""}.
    </>
  );
}

const signalLabels: Record<string, string> = {
  failures_per_window: "Failed attempts per observation window",
  ip_rarity: "IP recurrence in successful activity",
  device_rarity: "Device recurrence in successful activity",
  hour_rarity: "Access-hour recurrence in successful activity",
  matched_rules: "Reason for this alert",
  failure_count_in_window: "Repeated failed attempts",
  working_hours: "Time of activity",
  baseline_context: "Comparison with previous activity",
  source_severity: "Severity from the event source",
  contextual_behavior: "Behavioral signal",
  count: "Failed attempts",
  windowMinutes: "Time window (minutes)",
  account: "Account",
  sourceIp: "Source IP address",
  application: "Application context",
  timeZone: "Time zone",
  startHour: "Working hours start (hour)",
  endHour: "Working hours end (hour)",
  localHour: "Event local hour",
  offHours: "Outside working hours",
  successfulEvents: "Previous successful events",
  ready: "Enough history for comparison",
  truncated: "History limit reached",
  newIp: "New IP detected",
  newDevice: "New device detected",
  lookbackDays: "History period (days)",
  strength: "Signal strength (0–1)",
  failureThreshold: "Failed attempts needed to match",
  eventId: "Event reference",
  detectionId: "Detection reference",
  occurredAt: "Event time (UTC)",
  score: "Detection score (0–1)",
};

function signalLabel(name: string): string {
  return signalLabels[name] ?? formatLabel(name);
}

const ruleLabels: Record<string, string> = {
  AUTH_FAILURE_BURST: "Repeated failed sign-ins",
  AUTH_SUCCESS_AFTER_FAILURE: "Successful sign-in after repeated failures",
  APP_DENIAL_BURST: "Repeated denied application access",
  APP_SUCCESS_AFTER_DENIAL:
    "Successful application access after repeated denials",
  VPN_SSO_FAILURE_BURST: "Repeated failed VPN or SSO sign-ins",
  VPN_SSO_NEW_CONTEXT_OFF_HOURS:
    "VPN or SSO access from a new IP or device outside working hours",
};

function RecordedValue({ value }: { value: string | null }) {
  if (value === null) return <>Not recorded</>;
  let parsed: unknown = value;
  try {
    parsed = JSON.parse(value);
  } catch {
    /* Older records may contain plain text. */
  }
  if (isRecord(parsed)) {
    return (
      <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
        {Object.entries(parsed).map(([key, entry]) => (
          <div className="min-w-0" key={key}>
            <dt className="text-muted text-xs">{signalLabel(key)}</dt>
            <dd className="mt-0.5 [overflow-wrap:anywhere]">
              {readableValue(entry)}
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  return <>{readableValue(parsed)}</>;
}

function readableValue(value: unknown): string {
  if (typeof value === "number")
    return new Intl.NumberFormat("en", { maximumFractionDigits: 4 }).format(
      value,
    );
  if (Array.isArray(value))
    return value.map(readableValue).join(", ") || "None recorded";
  if (typeof value === "string") {
    if (ruleLabels[value]) return ruleLabels[value];
    if (value === "source-level context")
      return "Event source (no specific application recorded)";
    if (/^[A-Z]+(?:_[A-Z]+)+$/.test(value))
      return formatLabel(value.toLowerCase());
    return value;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null) return "Not recorded";
  if (isRecord(value))
    return Object.entries(value)
      .map(([key, entry]) => `${formatLabel(key)}: ${readableValue(entry)}`)
      .join("; ");
  return String(value);
}

function parseContributions(value: unknown): Contribution[] | null {
  if (!Array.isArray(value)) return null;
  return value.flatMap((entry) => {
    if (!isRecord(entry) || typeof entry.featureName !== "string") return [];
    return [
      {
        name: entry.featureName,
        value:
          typeof entry.featureValue === "string" ? entry.featureValue : null,
        score:
          typeof entry.contributionScore === "number"
            ? entry.contributionScore
            : null,
        rank: typeof entry.rank === "number" ? entry.rank : null,
      },
    ];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatLabel(value: string): string {
  const spaced = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replaceAll("-", " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatContribution(value: number | null): string {
  if (value === null) return "Not available";
  const formatted = new Intl.NumberFormat("en", {
    maximumFractionDigits: 4,
    signDisplay: "always",
  }).format(value);
  return formatted;
}

function formatMetric(value: unknown): string {
  if (value === null) return "Not available";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    return new Intl.NumberFormat("en", { maximumFractionDigits: 4 }).format(
      value,
    );
  }
  if (typeof value === "string") return formatLabel(value);
  return JSON.stringify(value);
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm font-medium [overflow-wrap:anywhere] ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function formatRiskLevel(level: string): string {
  return level
    .replaceAll("_", " ")
    .replace(/^./, (value) => value.toUpperCase());
}

function riskLevelTone(level: string) {
  const normalized = level.toLowerCase();
  if (normalized === "critical" || normalized === "high")
    return "danger" as const;
  if (normalized === "medium") return "warning" as const;
  if (normalized === "low") return "success" as const;
  return "neutral" as const;
}

export function formatStatus(status: AiAlert["status"]): string {
  if (status === "needs_investigation") return "Needs further investigation";
  return status
    .replaceAll("_", " ")
    .replace(/^./, (value) => value.toUpperCase());
}

export function statusTone(status: AiAlert["status"]) {
  if (status === "new") return "info" as const;
  if (status === "reviewing" || status === "needs_investigation")
    return "warning" as const;
  if (status === "confirmed" || status === "resolved")
    return "success" as const;
  return "neutral" as const;
}

export function formatScore(score: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(score);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
