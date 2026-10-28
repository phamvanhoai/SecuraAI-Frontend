"use client";

import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Copy,
  FileCode,
  Key,
  Server,
  ShieldCheck,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuditLogDetail } from "../hooks/use-audit-logs";
import type { AuditLogItem } from "../schemas/audit-log-schema";

function getActionTone(action: string): "success" | "warning" | "danger" | "info" | "neutral" {
  const upper = action.toUpperCase();
  if (
    upper.includes("DELETE") ||
    upper.includes("REMOVE") ||
    upper.includes("LOCK") ||
    upper.includes("REVOKE") ||
    upper.includes("FAIL")
  ) {
    return "danger";
  }
  if (
    upper.includes("UPDATE") ||
    upper.includes("CHANGE") ||
    upper.includes("ASSIGN") ||
    upper.includes("CORRECT") ||
    upper.includes("SUBMIT")
  ) {
    return "warning";
  }
  if (
    upper.includes("CREATE") ||
    upper.includes("LOGIN") ||
    upper.includes("PUBLISH") ||
    upper.includes("APPROVE") ||
    upper.includes("SUCCESS")
  ) {
    return "success";
  }
  if (upper.includes("READ") || upper.includes("VIEW") || upper.includes("EXPORT")) {
    return "neutral";
  }
  return "info";
}

function formatExactTime(isoString: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function AuditLogDetailDialog({
  logId,
  initialData,
  onClose,
}: {
  logId: string | null;
  initialData?: AuditLogItem | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const {
    data: fetchedData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAuditLogDetail(logId);

  const log = fetchedData ?? (initialData?.id === logId ? initialData : null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (logId && !dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    }
    if (!logId && dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
  }, [logId]);

  if (!logId) return null;

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    void navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Dialog
      dialogRef={dialogRef}
      onClose={onClose}
      title="Audit Record Details"
      className="max-h-[calc(100dvh-2rem)] w-[min(54rem,calc(100%-2rem))] overflow-y-auto"
    >
      {isLoading && !log ? (
        <div className="space-y-4" role="status" aria-label="Loading audit record details">
          <Skeleton className="h-14 w-full rounded-lg" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="h-36 w-full rounded-xl" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="flex justify-end pt-4 border-t border-border">
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
        </div>
      ) : isError && !log ? (
        <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.8} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-danger">Failed to load audit record details</p>
            {error?.message && (
              <p className="mt-0.5 text-xs text-muted">{error.message}</p>
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void refetch()}
            className="min-h-8 shrink-0 gap-1.5 px-2.5 text-xs font-medium"
          >
            Retry
          </Button>
        </div>
      ) : log ? (
        <div className="space-y-6">
          {/* Context Bar */}
          <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
            <StatusBadge tone={getActionTone(log.action)}>
              <span className="font-mono font-bold">{log.action}</span>
            </StatusBadge>
            <span className="text-muted font-mono">{log.id}</span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1 text-muted">
              <Clock className="size-3.5 shrink-0" strokeWidth={1.8} />
              <span>Occurred: <strong className="text-foreground">{formatExactTime(log.occurredAt)}</strong></span>
            </span>
            <span className="text-border">·</span>
            <span className="inline-flex items-center gap-1 text-muted">
              <Calendar className="size-3.5 shrink-0" strokeWidth={1.8} />
              <span>Logged: <strong className="text-foreground">{formatExactTime(log.createdAt)}</strong></span>
            </span>
            <span className="ml-auto inline-flex items-center gap-1 rounded-md border border-success/30 bg-success-soft px-2 py-0.5 font-medium text-success">
              <ShieldCheck className="size-3.5" strokeWidth={1.8} />
              <span>Cryptographically Verified</span>
            </span>
          </div>

          {/* 2-Column Info Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Actor Details */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <User className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
                <h3 className="text-sm font-semibold">Actor Information</h3>
              </div>
              <dl className="border-border bg-neutral-soft/30 grid gap-x-6 gap-y-3 rounded-xl border p-4">
                <div>
                  <dt className="text-muted text-xs font-medium uppercase tracking-wide">Actor Type</dt>
                  <dd className="mt-1 text-sm font-medium font-mono">
                    <span className="rounded bg-neutral-soft px-1.5 py-0.5 text-xs">{log.actorType}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted text-xs font-medium uppercase tracking-wide">Name</dt>
                  <dd className="mt-1 text-sm font-medium truncate">
                    {log.actor?.name ?? (log.actorType === "SYSTEM" ? "System Engine" : "Unknown")}
                  </dd>
                </div>
                {log.actor?.email && (
                  <div>
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide">Email</dt>
                    <dd className="mt-1 text-sm font-medium truncate">{log.actor.email}</dd>
                  </div>
                )}
                {log.actor?.role && (
                  <div>
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide">Assigned Role</dt>
                    <dd className="mt-1 text-sm font-medium font-mono">{log.actor.role}</dd>
                  </div>
                )}
                {log.actor?.keyPrefix && (
                  <div>
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide">API Key Prefix</dt>
                    <dd className="mt-1 text-sm font-medium font-mono">{log.actor.keyPrefix}***</dd>
                  </div>
                )}
                {log.actorUserId && (
                  <div>
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide">Actor User ID</dt>
                    <dd className="mt-1 font-mono text-xs text-muted truncate" title={log.actorUserId}>
                      {log.actorUserId}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Resource & Context */}
            <div className="space-y-3">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <Server className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
                <h3 className="text-sm font-semibold">Resource & Context</h3>
              </div>
              <dl className="border-border bg-neutral-soft/30 grid gap-x-6 gap-y-3 rounded-xl border p-4">
                <div>
                  <dt className="text-muted text-xs font-medium uppercase tracking-wide">Resource Type</dt>
                  <dd className="mt-1 text-sm font-medium font-mono">{log.resourceType}</dd>
                </div>
                <div>
                  <dt className="text-muted text-xs font-medium uppercase tracking-wide">Resource ID</dt>
                  <dd className="mt-1 font-mono text-xs truncate" title={log.resourceId ?? "None"}>
                    {log.resourceId ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted text-xs font-medium uppercase tracking-wide">Source IP</dt>
                  <dd className="mt-1 text-sm font-medium font-mono">{log.sourceIp ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted text-xs font-medium uppercase tracking-wide">Client / Source</dt>
                  <dd className="mt-1 text-sm font-medium">{log.source ?? "System"}</dd>
                </div>
                {log.userAgent && (
                  <div>
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide">User Agent</dt>
                    <dd className="mt-1 font-mono text-[10px] text-muted line-clamp-2" title={log.userAgent}>
                      {log.userAgent}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Correlation ID */}
          {log.correlationId && (
            <div className="border-border bg-neutral-soft/30 flex items-center justify-between gap-3 rounded-lg border p-3.5 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Key className="size-3.5 shrink-0 text-brand" strokeWidth={1.8} />
                <span className="text-muted shrink-0">Correlation ID:</span>
                <span className="font-mono font-semibold text-foreground truncate">{log.correlationId}</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleCopy(log.correlationId ?? "", "correlationId")}
                className="size-7 p-0 shrink-0"
                title="Copy Correlation ID"
              >
                {copiedField === "correlationId" ? (
                  <Check className="size-3.5 text-success" />
                ) : (
                  <Copy className="size-3.5" />
                )}
              </Button>
            </div>
          )}

          {/* State Changes & Parameters */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <FileCode className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
              <h3 className="text-sm font-semibold">State Changes & Parameters</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Before Data */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-muted">
                  <span>State Before (beforeData)</span>
                  {log.beforeData && (
                    <button
                      type="button"
                      onClick={() => handleCopy(JSON.stringify(log.beforeData, null, 2), "beforeData")}
                      className="text-muted hover:text-foreground flex items-center gap-1"
                    >
                      {copiedField === "beforeData" ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                      <span>Copy</span>
                    </button>
                  )}
                </div>
                <div className="border-border overflow-hidden rounded-xl border">
                  <div className="border-b border-border bg-neutral-soft/30 px-3 py-1.5 text-[11px] font-medium text-muted">
                    beforeData
                  </div>
                  <div className="overflow-x-auto p-3 font-mono text-[11px] max-h-48">
                    {log.beforeData && Object.keys(log.beforeData).length > 0 ? (
                      <pre className="text-foreground whitespace-pre-wrap">
                        {JSON.stringify(log.beforeData, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-muted italic">No previous state recorded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* After Data */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-muted">
                  <span>State After (afterData)</span>
                  {log.afterData && (
                    <button
                      type="button"
                      onClick={() => handleCopy(JSON.stringify(log.afterData, null, 2), "afterData")}
                      className="text-muted hover:text-foreground flex items-center gap-1"
                    >
                      {copiedField === "afterData" ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                      <span>Copy</span>
                    </button>
                  )}
                </div>
                <div className="border-border overflow-hidden rounded-xl border">
                  <div className="border-b border-border bg-neutral-soft/30 px-3 py-1.5 text-[11px] font-medium text-muted">
                    afterData
                  </div>
                  <div className="overflow-x-auto p-3 font-mono text-[11px] max-h-48">
                    {log.afterData && Object.keys(log.afterData).length > 0 ? (
                      <pre className="text-foreground whitespace-pre-wrap">
                        {JSON.stringify(log.afterData, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-muted italic">No new state recorded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Hash Chain */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={1.8} />
              <h3 className="text-sm font-semibold">Cryptographic Hash Chain (SHA-256)</h3>
            </div>
            <dl className="border-border bg-neutral-soft/30 grid gap-x-6 gap-y-4 rounded-xl border p-4">
              <div>
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">Record Hash</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <span
                    className="font-mono text-[11px] text-foreground bg-surface px-2 py-0.5 rounded border border-border flex-1 truncate min-w-0"
                    title={log.recordHash}
                  >
                    {log.recordHash}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleCopy(log.recordHash, "recordHash")}
                    className="size-6 p-0 shrink-0"
                    title="Copy Record Hash"
                  >
                    {copiedField === "recordHash" ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                  </Button>
                </dd>
              </div>
              <div>
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">Previous Hash</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <span
                    className="font-mono text-[11px] text-foreground bg-surface px-2 py-0.5 rounded border border-border flex-1 truncate min-w-0"
                    title={log.previousHash ?? "Genesis Record (0)"}
                  >
                    {log.previousHash ?? "0000000000000000000000000000000000000000000000000000000000000000 (Genesis)"}
                  </span>
                  {log.previousHash && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleCopy(log.previousHash ?? "", "previousHash")}
                      className="size-6 p-0 shrink-0"
                      title="Copy Previous Hash"
                    >
                      {copiedField === "previousHash" ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                    </Button>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
