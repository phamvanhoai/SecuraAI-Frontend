"use client";

import { useEffect, useRef } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { AiAlert } from "../schemas/ai-alert-schema";

export function AiAlertDetailDialog({
  alert,
  onClose,
}: {
  alert: AiAlert | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (alert && !dialog.open) dialog.showModal();
    if (!alert && dialog.open) dialog.close();
  }, [alert]);

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={onClose}
      title="AI alert details"
    >
      {alert ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold">{alert.title}</h3>
              <p className="text-muted mt-1 text-sm [overflow-wrap:anywhere]">
                {alert.alertCode}
              </p>
            </div>
            <StatusBadge tone={statusTone(alert.status)}>
              {formatStatus(alert.status)}
            </StatusBadge>
          </div>
          <p className="text-muted text-sm leading-6">{alert.description}</p>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail
              label="Anomaly score"
              value={formatScore(alert.anomalyScore)}
            />
            <Detail label="Detected" value={formatDate(alert.detectedAt)} />
            <Detail label="Event type" value={alert.event.eventType} />
            <Detail
              label="Event time"
              value={formatDate(alert.event.eventTime)}
            />
            <Detail label="Log source" value={alert.logSource.name} />
            <Detail label="Source type" value={alert.logSource.sourceType} />
            <Detail label="Asset" value={alert.asset?.name ?? "Not linked"} />
            <Detail
              label="Asset code"
              value={alert.asset?.assetCode ?? "Not available"}
            />
            <Detail
              label="Model"
              value={`${alert.model.name} ${alert.model.version}`}
            />
            <Detail label="Provider" value={alert.model.provider} />
            <Detail label="Alert ID" value={alert.id} />
            <Detail label="Event ID" value={alert.event.id} />
          </dl>
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
      <dd className="mt-1 text-sm font-medium [overflow-wrap:anywhere]">
        {value}
      </dd>
    </div>
  );
}

export function formatStatus(status: AiAlert["status"]): string {
  return status
    .replaceAll("_", " ")
    .replace(/^./, (value) => value.toUpperCase());
}

export function statusTone(status: AiAlert["status"]) {
  if (status === "new" || status === "confirmed") return "danger" as const;
  if (status === "reviewing") return "warning" as const;
  if (status === "resolved") return "success" as const;
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
