"use client";

import { Check, Copy, KeyRound, ShieldCheck, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventSource } from "../hooks/use-event-sources";

const statusTones = {
  ACTIVE: "success",
  INACTIVE: "neutral",
} as const;

const apiKeyStatusTones = {
  ACTIVE: "success",
  EXPIRED: "warning",
  REVOKED: "danger",
  ROTATED: "neutral",
} as const;

const sourceTypeStyles: Record<string, string> = {
  WAZUH: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
  IDENTITY_PROVIDER:
    "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
  FIREWALL: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  EDR: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
};

const formatFamilyLabel: Record<string, string> = {
  AUTHENTICATION: "Authentication",
  VPN_SSO: "VPN / SSO",
  APPLICATION_ACCESS: "App Access",
  NETWORK_TRAFFIC: "Network Traffic",
  SYSTEM_LOGS: "System Logs",
  AUDIT_LOGS: "Audit Logs",
};

export function EventSourceDetailDialog({
  sourceId,
  onClose,
}: {
  sourceId: string | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const detailQuery = useEventSource(sourceId);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (sourceId && !dialog.open) dialog.showModal();
    if (!sourceId && dialog.open) dialog.close();
  }, [sourceId]);

  function copyToClipboard(text: string, keyId: string) {
    void navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === keyId ? null : curr));
    }, 2000);
  }

  const source = detailQuery.data;

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={onClose}
      title="Event source details"
    >
      {detailQuery.isPending ? (
        <div className="space-y-4 py-2">
          <Skeleton className="h-8 w-3/4 rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : detailQuery.isError ? (
        <Alert>
          Unable to load event source details. Please check your network
          connection and permissions.
        </Alert>
      ) : source ? (
        <div className="space-y-6">
          {/* Header section */}
          <div className="border-border flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-foreground text-xl font-semibold">
                  {source.name}
                </h3>
                <span
                  className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                    sourceTypeStyles[source.sourceType] ??
                    "border-border bg-neutral-soft/60 text-foreground"
                  }`}
                >
                  {source.sourceType}
                </span>
              </div>
              <p className="text-muted mt-1 font-mono text-xs break-all">
                {source.id}
              </p>
            </div>
            <StatusBadge tone={statusTones[source.status]}>
              {source.status === "ACTIVE" ? "Active" : "Inactive"}
            </StatusBadge>
          </div>

          {/* Configuration Grid */}
          <section aria-labelledby="configuration-heading">
            <h4
              className="text-muted mb-3 text-xs font-bold tracking-wider uppercase"
              id="configuration-heading"
            >
              Ingestion Configuration
            </h4>
            <div className="border-border bg-neutral-soft/30 grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
              <Detail
                label="Ingestion Method"
                value={source.ingestionMethod}
              />
              <Detail
                label="Authentication Type"
                value={source.authenticationType ?? "None"}
              />
              <div className="sm:col-span-2">
                <dt className="text-muted text-xs font-medium tracking-wide uppercase">
                  Endpoint URL
                </dt>
                <dd className="mt-1">
                  {source.endpoint ? (
                    <div className="border-border bg-surface flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                      <span className="text-foreground truncate font-mono text-xs">
                        {source.endpoint}
                      </span>
                      <button
                        className="text-muted hover:text-foreground inline-flex shrink-0 items-center p-1 transition-colors"
                        onClick={() =>
                          copyToClipboard(source.endpoint ?? "", "endpoint")
                        }
                        title="Copy endpoint URL"
                        type="button"
                      >
                        {copiedKey === "endpoint" ? (
                          <Check className="text-success size-3.5" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <span className="text-muted text-sm font-medium">
                      Not specified
                    </span>
                  )}
                </dd>
              </div>
              {source.description ? (
                <div className="sm:col-span-2">
                  <Detail
                    label="Description"
                    value={source.description}
                  />
                </div>
              ) : null}
            </div>
          </section>

          {/* Supported Event Families */}
          <section aria-labelledby="event-families-heading">
            <h4
              className="text-muted mb-3 text-xs font-bold tracking-wider uppercase"
              id="event-families-heading"
            >
              Supported Event Families
            </h4>
            <div className="border-border bg-surface flex flex-wrap gap-2 rounded-xl border p-4">
              {source.eventFamilies.map((family) => (
                <span
                  className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium"
                  key={family}
                >
                  <ShieldCheck aria-hidden="true" className="size-3.5" />
                  {formatFamilyLabel[family] ?? family}
                </span>
              ))}
            </div>
          </section>

          {/* Masked Credentials & API Keys */}
          <section aria-labelledby="credentials-heading">
            <div className="mb-3 flex items-center justify-between">
              <h4
                className="text-muted text-xs font-bold tracking-wider uppercase"
                id="credentials-heading"
              >
                Ingestion Credentials (Masked)
              </h4>
              <span className="text-muted text-xs">
                {source.apiKeys.length} key(s) linked
              </span>
            </div>
            {source.apiKeys.length === 0 ? (
              <div className="border-border bg-neutral-soft/20 rounded-xl border p-4 text-center">
                <KeyRound className="text-muted mx-auto size-6 stroke-1" />
                <p className="text-muted mt-1 text-xs">
                  No active API keys or credentials linked to this event source.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {source.apiKeys.map((key) => (
                  <div
                    className="border-border bg-surface flex flex-col gap-2 rounded-xl border p-3.5 sm:flex-row sm:items-center sm:justify-between"
                    key={key.id}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className="text-foreground text-sm font-semibold">
                          {key.name}
                        </strong>
                        <StatusBadge tone={apiKeyStatusTones[key.status]}>
                          {key.status}
                        </StatusBadge>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-muted font-mono text-xs">
                          {key.maskedKey}
                        </span>
                        <button
                          className="text-muted hover:text-foreground inline-flex items-center p-0.5 transition-colors"
                          onClick={() =>
                            copyToClipboard(key.keyPrefix, `prefix-${key.id}`)
                          }
                          title="Copy key prefix"
                          type="button"
                        >
                          {copiedKey === `prefix-${key.id}` ? (
                            <Check className="text-success size-3" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="text-muted text-xs sm:text-right">
                      <p>
                        Last used:{" "}
                        {key.lastUsedAt ? formatDate(key.lastUsedAt) : "Never"}
                      </p>
                      {key.lastUsedIp ? (
                        <p className="font-mono text-[11px]">
                          IP: {key.lastUsedIp}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Ingestion Statistics */}
          <section aria-labelledby="stats-heading">
            <h4
              className="text-muted mb-3 text-xs font-bold tracking-wider uppercase"
              id="stats-heading"
            >
              Ingestion Activity & Statistics
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="border-border bg-surface rounded-xl border p-3.5">
                <p className="text-muted text-xs">Total Ingested Events</p>
                <p className="text-foreground mt-1 text-xl font-bold">
                  {source.stats.totalIngestedEvents.toLocaleString()}
                </p>
              </div>
              <div className="border-border bg-surface rounded-xl border p-3.5">
                <p className="text-muted text-xs">Ingestion Batches</p>
                <p className="text-foreground mt-1 text-xl font-bold">
                  {source.stats.totalBatches.toLocaleString()}
                </p>
              </div>
              <div className="border-border bg-surface col-span-2 rounded-xl border p-3.5 sm:col-span-1">
                <p className="text-muted text-xs">Last Event Received</p>
                <p className="text-foreground mt-1 text-sm font-semibold">
                  {source.stats.lastIngestedAt
                    ? formatDate(source.stats.lastIngestedAt)
                    : "Never"}
                </p>
              </div>
            </div>
          </section>

          {/* Metadata & Audit footer */}
          <div className="border-border bg-neutral-soft/20 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-xs text-muted">
            <div className="flex items-center gap-1.5">
              <User aria-hidden="true" className="size-3.5" />
              <span>
                Created by:{" "}
                <strong className="text-foreground font-medium">
                  {source.creator?.fullName ??
                    source.creator?.email ??
                    source.createdBy}
                </strong>
              </span>
            </div>
            <div className="flex gap-4">
              <span>Created: {formatDate(source.createdAt)}</span>
              <span>Updated: {formatDate(source.updatedAt)}</span>
            </div>
          </div>

          <div className="flex justify-end">
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-foreground mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
