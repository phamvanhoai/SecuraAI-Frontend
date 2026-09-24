"use client";

import { useEffect, useRef } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { LogSource } from "../schemas/log-source-schema";

const statusTones = {
  active: "success",
  inactive: "neutral",
  error: "danger",
} as const;

export function LogSourceDetailDialog({
  source,
  onClose,
}: {
  source: LogSource | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (source && !dialog.open) dialog.showModal();
    if (!source && dialog.open) dialog.close();
  }, [source]);

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(44rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={onClose}
      title="Log source details"
    >
      {source ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold">{source.name}</h3>
              <p className="text-muted mt-1 text-sm break-all">{source.id}</p>
            </div>
            <StatusBadge tone={statusTones[source.status]}>
              {source.status}
            </StatusBadge>
          </div>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Detail label="Source type" value={source.sourceType} capitalize />
            <Detail
              label="Format"
              value={source.configuration.format.toUpperCase()}
            />
            <Detail label="Timezone" value={source.configuration.timezone} />
            <Detail
              label="Collect raw payload"
              value={source.configuration.collectRawPayload ? "Yes" : "No"}
            />
            <Detail
              label="Polling interval"
              value={
                source.configuration.pollingIntervalSeconds
                  ? `${source.configuration.pollingIntervalSeconds} seconds`
                  : "Not configured"
              }
            />
            <Detail
              label="Field mappings"
              value={String(
                Object.keys(source.configuration.fieldMapping ?? {}).length,
              )}
            />
            <Detail
              label="Linked asset"
              value={
                source.asset
                  ? `${source.asset.assetCode} — ${source.asset.name}`
                  : "Not linked"
              }
            />
            <Detail
              label="Integration"
              value={
                source.integration
                  ? `${source.integration.name} (${source.integration.type})`
                  : "Not linked"
              }
            />
            <Detail
              label="Last received"
              value={
                source.lastReceivedAt
                  ? formatDate(source.lastReceivedAt)
                  : "Never"
              }
            />
            <Detail label="Created" value={formatDate(source.createdAt)} />
            <Detail label="Last updated" value={formatDate(source.updatedAt)} />
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

function Detail({
  label,
  value,
  capitalize = false,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd
        className={cn("mt-1 text-sm font-medium", capitalize && "capitalize")}
      >
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
