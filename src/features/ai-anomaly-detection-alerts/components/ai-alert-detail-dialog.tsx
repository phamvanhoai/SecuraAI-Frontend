"use client";

import {
  Box,
  BrainCircuit,
  Database,
  LoaderCircle,
  Radar,
  RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useToast } from "@/components/feedback/toast";
import { StatusBadge } from "@/components/data-display/static-product";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
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
          : "Unable to regenerate the AI explanation.",
      );
    }
  };

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={closeDialog}
      title="AI alert details"
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

          <div className="border-border bg-neutral-soft/30 rounded-lg border p-4">
            <div className="flex items-start gap-3">
              <Radar
                aria-hidden="true"
                className="text-brand mt-0.5 size-5 shrink-0"
                strokeWidth={1.8}
              />
              <div className="min-w-0">
                <h4 className="text-sm font-semibold">Detection summary</h4>
                <p className="text-muted mt-1 text-sm leading-6">
                  {alert.description}
                </p>
              </div>
            </div>
          </div>

          <dl className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4">
            <SummaryMetric
              label="Anomaly score"
              value={formatScore(alert.anomalyScore)}
            />
            <SummaryMetric
              label="Detection risk level"
              value={
                alert.riskLevel
                  ? formatRiskLevel(alert.riskLevel)
                  : "Not available"
              }
            />
            <SummaryMetric
              label="Detection risk score"
              value={
                alert.riskScore === null
                  ? "Not available"
                  : String(alert.riskScore)
              }
            />
            <SummaryMetric
              label="Detected"
              value={formatDate(alert.detectedAt)}
            />
          </dl>

          <DetailSection
            icon={Database}
            id="alert-detection-context"
            title="Detection context"
          >
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
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
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Detail label="Asset" value={alert.asset?.name ?? "Not linked"} />
              <Detail
                label="Asset code"
                value={alert.asset?.assetCode ?? "Not available"}
              />
              <Detail
                label="Scoring configuration"
                value={`${alert.model.name} ${alert.model.version}`}
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
              title="Decision explanation"
            />
            <Alert className="border-info/25 bg-info-soft text-foreground">
              The deployed scoring configuration calculates the anomaly score
              and decides whether to create an alert. Ollama only turns the
              stored evidence into analyst-readable text; when unavailable, a
              deterministic fallback explanation is shown.
            </Alert>
            {explanation.isPending ? (
              <div
                aria-label="Loading AI explanation"
                className="space-y-2"
                role="status"
              >
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : explanation.isError ? (
              <Alert>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>Unable to load the AI explanation.</span>
                  <Button
                    onClick={() => void explanation.refetch()}
                    variant="secondary"
                  >
                    Try again
                  </Button>
                </div>
              </Alert>
            ) : explanation.data === null ? (
              <p className="text-muted text-sm">
                No AI explanation has been recorded for this alert.
              </p>
            ) : explanation.data ? (
              <div className="space-y-4 text-sm">
                <p className="[overflow-wrap:anywhere] whitespace-pre-wrap">
                  {explanation.data.explanationText}
                </p>
                <ExplanationData
                  label="Feature contributions"
                  value={explanation.data.featureContributions}
                  variant="contributions"
                />
                <ExplanationData
                  label="Baseline data"
                  value={explanation.data.baselineData}
                />
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
                              <LoaderCircle
                                aria-hidden="true"
                                className="size-4 animate-spin"
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
                        <Alert>{regenerateError}</Alert>
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

          <div className="border-border bg-neutral-soft/30 rounded-lg border p-3">
            <dl className="grid gap-3 text-xs sm:grid-cols-2">
              <Detail label="Alert ID" value={alert.id} mono />
              <Detail label="Event ID" value={alert.event.id} mono />
            </dl>
          </div>

          <div className="border-border flex justify-end border-t pt-4">
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
    <div className="bg-surface min-w-0 p-3.5">
      <dt className="text-muted text-xs font-medium">{label}</dt>
      <dd className="mt-1.5 text-base font-semibold [overflow-wrap:anywhere] tabular-nums">
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

  return (
    <div className="space-y-2">
      <h5 className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </h5>
      {contributions ? (
        contributions.length > 0 ? (
          <div className="border-border overflow-hidden rounded-lg border">
            <div className="bg-neutral-soft text-muted hidden grid-cols-[minmax(0,1fr)_minmax(7rem,0.65fr)_7rem] gap-3 border-b px-3 py-2 text-xs font-medium sm:grid">
              <span>Feature</span>
              <span>Observed value</span>
              <span>Contribution</span>
            </div>
            <dl className="divide-border divide-y">
              {contributions.map((feature, index) => (
                <div
                  className="grid gap-2 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(7rem,0.65fr)_7rem] sm:items-center sm:gap-3"
                  key={`${feature.name}-${feature.rank ?? index}`}
                >
                  <div className="min-w-0">
                    <dt className="font-medium [overflow-wrap:anywhere]">
                      {formatLabel(feature.name)}
                    </dt>
                    {feature.rank !== null ? (
                      <dd className="text-muted mt-0.5 text-xs">
                        Influence rank {feature.rank}
                      </dd>
                    ) : null}
                  </div>
                  <div>
                    <dt className="text-muted text-xs sm:hidden">
                      Observed value
                    </dt>
                    <dd className="mt-0.5 font-mono text-xs [overflow-wrap:anywhere] sm:mt-0">
                      {feature.value ?? "Not recorded"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted text-xs sm:hidden">
                      Contribution
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold tabular-nums sm:mt-0">
                      {formatContribution(feature.score)}
                    </dd>
                    <span className="text-muted text-xs">
                      {feature.score === null
                        ? "Impact unavailable"
                        : feature.score >= 0
                          ? "Raises score"
                          : "Lowers score"}
                    </span>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        ) : (
          <p className="text-muted text-sm">
            No contributing features were recorded.
          </p>
        )
      ) : isRecord(value) ? (
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
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
