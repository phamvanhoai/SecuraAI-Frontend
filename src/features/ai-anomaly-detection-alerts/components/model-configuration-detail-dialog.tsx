"use client";

import { useEffect, useRef } from "react";
import { BarChart3, Bot, Database } from "lucide-react";
import { StatusBadge } from "@/components/data-display/static-product";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { ModelConfiguration } from "../schemas/model-configuration-schema";

export function ModelConfigurationDetailDialog({
  configuration,
  onClose,
}: {
  configuration: ModelConfiguration | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (configuration && !dialog.open) dialog.showModal();
    if (!configuration && dialog.open) dialog.close();
  }, [configuration]);
  const evaluation = configuration?.latestEvaluation;
  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={onClose}
      title="Model version metrics"
    >
      {configuration ? (
        <div className="space-y-6">
          <div className="border-border flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <div className="bg-brand/10 text-brand flex size-10 shrink-0 items-center justify-center rounded-lg">
                  <Bot
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={1.8}
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold [overflow-wrap:anywhere]">
                    {configuration.modelName} {configuration.version}
                  </h3>
                  <p className="text-muted mt-1 text-sm">
                    {formatModelType(configuration.modelType)}
                  </p>
                </div>
              </div>
              <p className="text-muted mt-3 font-mono text-xs [overflow-wrap:anywhere]">
                {configuration.id}
              </p>
            </div>
            <StatusBadge tone={statusTone(configuration.status)}>
              {formatStatus(configuration.status)}
            </StatusBadge>
          </div>

          <section
            aria-labelledby="model-context-heading"
            className="space-y-4"
          >
            <SectionHeading
              icon={Database}
              id="model-context-heading"
              title="Model context"
            />
            <dl className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2">
              <Metric
                label="Dataset"
                value={
                  configuration.dataset
                    ? `${configuration.dataset.name} ${configuration.dataset.version}`
                    : "Not linked"
                }
              />
              <Metric
                label="Created"
                value={formatDate(configuration.createdAt)}
              />
              <Metric
                label="Deployed"
                value={
                  configuration.deployedAt
                    ? formatDate(configuration.deployedAt)
                    : "Not deployed"
                }
              />
              <Metric
                label="Retired"
                value={
                  configuration.retiredAt
                    ? formatDate(configuration.retiredAt)
                    : "Not retired"
                }
              />
            </dl>
          </section>

          <section aria-labelledby="evaluation-heading" className="space-y-4">
            <SectionHeading
              icon={BarChart3}
              id="evaluation-heading"
              title="Latest evaluation"
            />
            <p className="text-muted mt-1 text-sm">
              The most recently recorded evaluation for this immutable model
              version.
            </p>
            {evaluation ? (
              <>
                <dl className="border-border bg-border grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2 lg:grid-cols-4">
                  <Metric
                    label="Precision"
                    value={formatRatio(evaluation.precision)}
                  />
                  <Metric
                    label="Recall"
                    value={formatRatio(evaluation.recall)}
                  />
                  <Metric
                    label="F1 score"
                    value={formatRatio(evaluation.f1Score)}
                  />
                  <Metric
                    label="PR-AUC"
                    value={formatRatio(evaluation.prAuc)}
                  />
                  <Metric
                    label="False-positive rate"
                    value={formatRatio(evaluation.falsePositiveRate)}
                  />
                  <Metric
                    label="Alerts / day"
                    value={formatNumber(evaluation.alertsPerDay)}
                  />
                  <Metric
                    label="Detection latency"
                    value={
                      evaluation.detectionLatencyMs === null
                        ? "Not measured"
                        : `${formatNumber(evaluation.detectionLatencyMs)} ms`
                    }
                  />
                  <Metric
                    label="Evaluated"
                    value={formatDate(evaluation.evaluatedAt)}
                  />
                </dl>
                {evaluation.notes ? (
                  <div className="border-border bg-neutral-soft/30 rounded-lg border p-4">
                    <p className="text-muted text-xs font-medium tracking-wide uppercase">
                      Evaluation notes
                    </p>
                    <p className="mt-2 text-sm leading-6">{evaluation.notes}</p>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="border-border py-8 text-center">
                <BarChart3 className="text-muted mx-auto size-8 stroke-1" />
                <p className="mt-2 font-medium">No evaluation recorded</p>
                <p className="text-muted mt-1 text-sm">
                  Evaluation metrics have not been recorded for this model
                  version.
                </p>
              </div>
            )}
          </section>
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
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface min-w-0 p-3.5">
      <dt className="text-muted text-xs font-medium">{label}</dt>
      <dd className="mt-1.5 text-sm font-semibold [overflow-wrap:anywhere] tabular-nums">
        {value}
      </dd>
    </div>
  );
}
function SectionHeading({
  icon: Icon,
  id,
  title,
}: {
  icon: typeof Database;
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
      <h3 className="text-sm font-semibold" id={id}>
        {title}
      </h3>
    </div>
  );
}
function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
function formatRatio(value: number | null): string {
  return value === null ? "Not measured" : `${(value * 100).toFixed(1)}%`;
}
function formatNumber(value: number | null): string {
  return value === null
    ? "Not measured"
    : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
        value,
      );
}
function formatModelType(value: string): string {
  return value
    .replaceAll("_", " ")
    .replace(/^./, (character) => character.toUpperCase());
}
function formatStatus(value: ModelConfiguration["status"]): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
function statusTone(value: ModelConfiguration["status"]) {
  if (value === "deployed") return "success" as const;
  if (value === "validated") return "info" as const;
  if (value === "development") return "warning" as const;
  return "neutral" as const;
}
