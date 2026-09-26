"use client";

import { useEffect, useRef } from "react";
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold">
                {configuration.modelName} {configuration.version}
              </h3>
              <p className="text-muted mt-1 text-sm [overflow-wrap:anywhere]">
                {configuration.id}
              </p>
            </div>
            <StatusBadge
              tone={configuration.status === "deployed" ? "success" : "neutral"}
            >
              {configuration.status}
            </StatusBadge>
          </div>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Model type" value={configuration.modelType} />
            <Detail
              label="Dataset"
              value={
                configuration.dataset
                  ? `${configuration.dataset.name} ${configuration.dataset.version}`
                  : "Not linked"
              }
            />
            <Detail
              label="Created"
              value={formatDate(configuration.createdAt)}
            />
            <Detail
              label="Deployed"
              value={
                configuration.deployedAt
                  ? formatDate(configuration.deployedAt)
                  : "Not deployed"
              }
            />
          </dl>
          <section aria-labelledby="evaluation-heading">
            <h3 className="font-semibold" id="evaluation-heading">
              Latest evaluation
            </h3>
            <p className="text-muted mt-1 text-sm">
              The most recently recorded evaluation for this immutable model
              version.
            </p>
            {evaluation ? (
              <>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Detail
                    label="Precision"
                    value={formatRatio(evaluation.precision)}
                  />
                  <Detail
                    label="Recall"
                    value={formatRatio(evaluation.recall)}
                  />
                  <Detail
                    label="F1 score"
                    value={formatRatio(evaluation.f1Score)}
                  />
                  <Detail
                    label="PR-AUC"
                    value={formatRatio(evaluation.prAuc)}
                  />
                  <Detail
                    label="False-positive rate"
                    value={formatRatio(evaluation.falsePositiveRate)}
                  />
                  <Detail
                    label="Alerts / day"
                    value={formatNumber(evaluation.alertsPerDay)}
                  />
                  <Detail
                    label="Detection latency"
                    value={
                      evaluation.detectionLatencyMs === null
                        ? "Not measured"
                        : `${formatNumber(evaluation.detectionLatencyMs)} ms`
                    }
                  />
                  <Detail
                    label="Evaluated"
                    value={formatDate(evaluation.evaluatedAt)}
                  />
                </dl>
                {evaluation.notes ? (
                  <div className="border-border bg-neutral-soft mt-4 rounded-xl border p-4">
                    <p className="text-muted text-xs font-medium tracking-wide uppercase">
                      Evaluation notes
                    </p>
                    <p className="mt-2 text-sm leading-6">{evaluation.notes}</p>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="border-border text-muted mt-4 rounded-xl border p-4 text-sm">
                No evaluation metrics have been recorded for this version.
              </p>
            )}
          </section>
          <div className="flex justify-end">
            <Button
              onClick={() => dialogRef.current?.close()}
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
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium [overflow-wrap:anywhere] tabular-nums">
        {value}
      </dd>
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
