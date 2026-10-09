"use client";

import {
  Calendar,
  Check,
  Clock,
  Copy,
  FileCode,
  Globe,
  Key,
  Laptop,
  Server,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useAuditLogDetail } from "../hooks/use-audit-logs";
import type { AuditLogItem } from "../schemas/audit-log-schema";
import { cn } from "@/lib/utils";

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
        <div className="py-12 text-center text-muted" role="status">
          <p className="text-sm">Loading audit record details…</p>
        </div>
      ) : isError && !log ? (
        <Alert className="border-danger/30 bg-danger-soft text-danger">
          <div className="flex items-center justify-between">
            <span>Failed to load audit record details: {error?.message}</span>
            <Button type="button" variant="secondary" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      ) : log ? (
        <div className="space-y-6">
          {/* Top Summary Banner */}
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <StatusBadge tone={getActionTone(log.action)}>
                  <span className="font-mono text-xs font-bold">{log.action}</span>
                </StatusBadge>
                <span className="text-xs text-muted">ID: {log.id}</span>
              </div>
              <p className="text-xs text-muted flex items-center gap-1.5 pt-1">
                <Clock className="size-3.5 text-muted shrink-0" />
                <span>Occurred: <strong className="text-foreground">{formatExactTime(log.occurredAt)}</strong></span>
                <span className="text-muted/60">•</span>
                <span>Logged: <strong className="text-foreground">{formatExactTime(log.createdAt)}</strong></span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md border border-success/30 bg-success-soft px-2.5 py-1 text-xs font-medium text-success">
                <ShieldCheck className="size-3.5" />
                <span>Cryptographically Verified</span>
              </span>
            </div>
          </div>

          {/* 2-Column Info Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Actor Details Card */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <User className="size-4 text-brand" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Actor Information
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Actor Type:</span>
                  <span className="rounded bg-neutral-soft px-1.5 py-0.5 font-mono font-medium text-foreground">
                    {log.actorType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Name:</span>
                  <span className="font-medium text-foreground text-right truncate max-w-[200px]">
                    {log.actor?.name ?? (log.actorType === "SYSTEM" ? "System Engine" : "Unknown")}
                  </span>
                </div>
                {log.actor?.email && (
                  <div className="flex justify-between">
                    <span className="text-muted">Email:</span>
                    <span className="font-medium text-foreground text-right truncate max-w-[200px]">
                      {log.actor.email}
                    </span>
                  </div>
                )}
                {log.actor?.role && (
                  <div className="flex justify-between">
                    <span className="text-muted">Assigned Role:</span>
                    <span className="font-mono text-foreground">{log.actor.role}</span>
                  </div>
                )}
                {log.actor?.keyPrefix && (
                  <div className="flex justify-between">
                    <span className="text-muted">API Key Prefix:</span>
                    <span className="font-mono text-foreground">{log.actor.keyPrefix}***</span>
                  </div>
                )}
                {log.actorUserId && (
                  <div className="flex justify-between">
                    <span className="text-muted">Actor User ID:</span>
                    <span className="font-mono text-[11px] text-muted truncate max-w-[180px]" title={log.actorUserId}>
                      {log.actorUserId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Affected Resource & Request Context */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <Server className="size-4 text-brand" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Resource & Context
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Resource Type:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {log.resourceType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Resource ID:</span>
                  <span className="font-mono text-[11px] text-foreground truncate max-w-[200px]" title={log.resourceId ?? "None"}>
                    {log.resourceId ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Source IP:</span>
                  <span className="font-mono text-foreground">{log.sourceIp ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Client / Source:</span>
                  <span className="text-foreground">{log.source ?? "System"}</span>
                </div>
                {log.userAgent && (
                  <div className="flex flex-col gap-0.5 pt-1">
                    <span className="text-muted">User Agent:</span>
                    <span className="font-mono text-[10px] text-muted line-clamp-2" title={log.userAgent}>
                      {log.userAgent}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Correlation ID Banner */}
          {log.correlationId && (
            <div className="flex items-center justify-between rounded-lg border border-border bg-surface-subtle px-3.5 py-2.5 text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="text-muted">Correlation ID:</span>
                <span className="font-mono font-semibold text-foreground truncate">
                  {log.correlationId}
                </span>
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

          {/* State Parameters (beforeData vs afterData) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileCode className="size-4 text-brand" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                State Changes & Parameters
              </h4>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Before Data */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-muted">
                  <span>State Before (beforeData)</span>
                  {log.beforeData && (
                    <button
                      type="button"
                      onClick={() => handleCopy(JSON.stringify(log.beforeData, null, 2), "beforeData")}
                      className="text-muted hover:text-foreground text-[11px] flex items-center gap-1"
                    >
                      {copiedField === "beforeData" ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                      <span>Copy</span>
                    </button>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-surface-subtle/80 p-3 font-mono text-[11px] overflow-x-auto max-h-48">
                  {log.beforeData && Object.keys(log.beforeData).length > 0 ? (
                    <pre className="text-foreground whitespace-pre-wrap">
                      {JSON.stringify(log.beforeData, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-muted italic">No previous state recorded</span>
                  )}
                </div>
              </div>

              {/* After Data */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-muted">
                  <span>State After (afterData)</span>
                  {log.afterData && (
                    <button
                      type="button"
                      onClick={() => handleCopy(JSON.stringify(log.afterData, null, 2), "afterData")}
                      className="text-muted hover:text-foreground text-[11px] flex items-center gap-1"
                    >
                      {copiedField === "afterData" ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
                      <span>Copy</span>
                    </button>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-surface-subtle/80 p-3 font-mono text-[11px] overflow-x-auto max-h-48">
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

          {/* Cryptographic Hash Chain Card */}
          <div className="rounded-xl border border-success/30 bg-success-soft/30 p-4 space-y-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-success" />
              <h4 className="text-xs font-semibold text-foreground">
                Cryptographic Hash Chain (SHA-256)
              </h4>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-muted">Record Hash:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-foreground bg-surface px-2 py-0.5 rounded border border-border max-w-[340px] truncate" title={log.recordHash}>
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
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-muted">Previous Hash:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-foreground bg-surface px-2 py-0.5 rounded border border-border max-w-[340px] truncate" title={log.previousHash ?? "Genesis Record (0)"}>
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
                </div>
              </div>
            </div>
          </div>

          {/* Close Action */}
          <div className="flex justify-end pt-2 border-t border-border">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
