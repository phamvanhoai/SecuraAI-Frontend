"use client";

import {
  ArrowRight,
  Check,
  Code2,
  Copy,
  Eye,
  FileDiff,
  Filter,
  Layers,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuditLogDiff } from "../hooks/use-audit-logs";
import {
  computePropertyChanges,
  type AuditLogDiff,
  type AuditLogItem,
  type PropertyChange,
  type PropertyChangeType,
} from "../schemas/audit-log-schema";
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
  return "neutral";
}

function getChangeTypeBadge(changeType: PropertyChangeType) {
  switch (changeType) {
    case "ADDED":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <PlusCircle className="size-3" />
          <span>ADDED</span>
        </span>
      );
    case "MODIFIED":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <FileDiff className="size-3" />
          <span>MODIFIED</span>
        </span>
      );
    case "REMOVED":
      return (
        <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <MinusCircle className="size-3" />
          <span>REMOVED</span>
        </span>
      );
    case "UNCHANGED":
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded bg-neutral-soft px-2 py-0.5 font-mono text-[11px] font-medium text-muted border border-border">
          <span>UNCHANGED</span>
        </span>
      );
  }
}

function formatPropertyValue(val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  return String(val);
}

export type AuditLogChangesDialogProps = {
  logId: string | null;
  initialData?: AuditLogItem | null;
  onClose: () => void;
};

export function AuditLogChangesDialog({
  logId,
  initialData,
  onClose,
}: AuditLogChangesDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const searchInputId = useId();

  const [viewMode, setViewMode] = useState<"table" | "json">("table");
  const [onlyChanged, setOnlyChanged] = useState<boolean>(true);
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const {
    data: fetchedDiff,
    isLoading,
    isError,
    error,
    refetch,
  } = useAuditLogDiff(logId);

  // Fallback / client-computed diff if fetchedDiff is loading or using initialData
  const clientComputedChanges: PropertyChange[] = initialData
    ? computePropertyChanges(initialData.beforeData, initialData.afterData)
    : [];

  const diff: AuditLogDiff | null =
    fetchedDiff ??
    (initialData && initialData.id === logId
      ? {
          id: initialData.id,
          action: initialData.action,
          resourceType: initialData.resourceType,
          resourceId: initialData.resourceId,
          occurredAt: initialData.occurredAt,
          totalProperties: clientComputedChanges.length,
          totalModified: clientComputedChanges.filter((c) => c.changeType === "MODIFIED").length,
          totalAdded: clientComputedChanges.filter((c) => c.changeType === "ADDED").length,
          totalRemoved: clientComputedChanges.filter((c) => c.changeType === "REMOVED").length,
          totalUnchanged: clientComputedChanges.filter((c) => c.changeType === "UNCHANGED").length,
          hasChanges: clientComputedChanges.some((c) => c.changeType !== "UNCHANGED"),
          changes: clientComputedChanges,
        }
      : null);

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

  const changesList = diff?.changes ?? [];
  const filteredChanges = changesList.filter((item) => {
    if (onlyChanged && item.changeType === "UNCHANGED") return false;
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      const matchKey = item.property.toLowerCase().includes(q);
      const matchBefore = formatPropertyValue(item.beforeValue).toLowerCase().includes(q);
      const matchAfter = formatPropertyValue(item.afterValue).toLowerCase().includes(q);
      return matchKey || matchBefore || matchAfter;
    }
    return true;
  });

  return (
    <Dialog
      dialogRef={dialogRef}
      onClose={onClose}
      title="View Before / After Changes"
      className="max-h-[calc(100dvh-2rem)] w-[min(56rem,calc(100%-2rem))] overflow-y-auto"
    >
      {isLoading && !diff ? (
        <div className="py-12 text-center text-muted" role="status">
          <p className="text-sm">Comparing entity properties before and after change…</p>
        </div>
      ) : isError && !diff ? (
        <Alert className="border-danger/30 bg-danger-soft text-danger">
          <div className="flex items-center justify-between">
            <span>Failed to load entity changes diff: {error?.message}</span>
            <Button type="button" variant="secondary" onClick={() => void refetch()}>
              Retry
            </Button>
          </div>
        </Alert>
      ) : diff ? (
        <div className="space-y-5">
          {/* Header Summary Card */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <StatusBadge tone={getActionTone(diff.action)}>
                  <span className="font-mono text-xs font-bold">{diff.action}</span>
                </StatusBadge>
                <span className="font-mono text-xs font-semibold text-foreground">
                  {diff.resourceType}
                </span>
                {diff.resourceId && (
                  <span className="font-mono text-[11px] text-muted truncate max-w-[140px]" title={diff.resourceId}>
                    ({diff.resourceId})
                  </span>
                )}
              </div>
              <p className="text-xs text-muted">
                Audit Record ID: <span className="font-mono text-foreground">{diff.id}</span>
              </p>
            </div>

            {/* Change Metrics Summary Badges */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="rounded-md border border-border bg-surface px-2 py-1 font-mono text-[11px] text-foreground">
                Total: <strong>{diff.totalProperties}</strong>
              </span>
              <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Modified: {diff.totalModified}
              </span>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Added: {diff.totalAdded}
              </span>
              <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 font-mono text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                Removed: {diff.totalRemoved}
              </span>
            </div>
          </div>

          {/* Comparison Control Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
            {/* View Mode Switcher */}
            <div className="inline-flex rounded-lg border border-border bg-surface-subtle p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
                  viewMode === "table"
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted hover:text-foreground",
                )}
              >
                <SlidersHorizontal className="size-3.5" />
                <span>Property Diff Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("json")}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
                  viewMode === "json"
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted hover:text-foreground",
                )}
              >
                <Code2 className="size-3.5" />
                <span>Side-by-Side JSON</span>
              </button>
            </div>

            {/* Quick Actions & Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {viewMode === "table" && (
                <>
                  <div className="relative max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted pointer-events-none" />
                    <Input
                      id={searchInputId}
                      type="text"
                      placeholder="Filter properties..."
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      className="h-8 pl-8 pr-7 text-xs w-44"
                    />
                    {filterQuery && (
                      <button
                        type="button"
                        onClick={() => setFilterQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                        aria-label="Clear filter"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant={onlyChanged ? "primary" : "secondary"}
                    onClick={() => setOnlyChanged(!onlyChanged)}
                    className="h-8 text-xs gap-1"
                  >
                    <Filter className="size-3" />
                    <span>{onlyChanged ? "Showing Changed Only" : "Show All"}</span>
                  </Button>
                </>
              )}

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  handleCopy(
                    JSON.stringify(
                      {
                        action: diff.action,
                        resourceType: diff.resourceType,
                        resourceId: diff.resourceId,
                        occurredAt: diff.occurredAt,
                        changes: diff.changes,
                      },
                      null,
                      2,
                    ),
                    "fullDiff",
                  )
                }
                className="h-8 text-xs gap-1"
                title="Copy full property changes JSON"
              >
                {copiedField === "fullDiff" ? (
                  <Check className="size-3 text-success" />
                ) : (
                  <Copy className="size-3" />
                )}
                <span>Copy Diff</span>
              </Button>
            </div>
          </div>

          {/* Body Content by View Mode */}
          {viewMode === "table" ? (
            <div>
              {filteredChanges.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted border rounded-xl border-dashed border-border bg-surface-subtle/40">
                  <Layers className="size-8 text-muted/50" />
                  <p className="mt-2 font-medium text-foreground text-sm">
                    {onlyChanged && diff.totalUnchanged > 0
                      ? "No property modifications detected"
                      : "No matching properties found"}
                  </p>
                  <p className="mt-0.5 text-xs max-w-sm">
                    {onlyChanged && diff.totalUnchanged > 0
                      ? `All ${diff.totalUnchanged} properties remained unchanged. Click 'Show All' to inspect static entity properties.`
                      : "Try clearing your property filter query."}
                  </p>
                  {onlyChanged && diff.totalUnchanged > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setOnlyChanged(false)}
                      className="mt-3 text-xs"
                    >
                      Show all {diff.totalUnchanged} unchanged properties
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-subtle border-b border-border text-muted uppercase tracking-wider font-semibold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Property</th>
                        <th className="py-2.5 px-3">Change Type</th>
                        <th className="py-2.5 px-3">State Before (beforeData)</th>
                        <th className="py-2.5 px-3">State After (afterData)</th>
                        <th className="py-2.5 px-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                      {filteredChanges.map((change) => {
                        const isMod = change.changeType === "MODIFIED";
                        const isAdd = change.changeType === "ADDED";
                        const isRem = change.changeType === "REMOVED";

                        return (
                          <tr
                            key={change.property}
                            className={cn(
                              "transition-colors",
                              isMod && "bg-amber-500/[0.04] hover:bg-amber-500/[0.08]",
                              isAdd && "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]",
                              isRem && "bg-rose-500/[0.04] hover:bg-rose-500/[0.08]",
                              !isMod && !isAdd && !isRem && "hover:bg-surface-subtle",
                            )}
                          >
                            {/* Property Key */}
                            <td className="py-2.5 px-3 font-semibold text-foreground">
                              {change.property}
                            </td>

                            {/* Change Type Badge */}
                            <td className="py-2.5 px-3">
                              {getChangeTypeBadge(change.changeType)}
                            </td>

                            {/* Before Value */}
                            <td className="py-2.5 px-3 max-w-[200px] truncate">
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.5",
                                  isRem && "bg-rose-500/10 text-rose-600 dark:text-rose-400 line-through font-semibold",
                                  isMod && "bg-amber-500/10 text-amber-600 dark:text-amber-400 line-through",
                                  !isRem && !isMod && "text-muted",
                                )}
                                title={formatPropertyValue(change.beforeValue)}
                              >
                                {formatPropertyValue(change.beforeValue)}
                              </span>
                            </td>

                            {/* After Value */}
                            <td className="py-2.5 px-3 max-w-[200px] truncate">
                              <span
                                className={cn(
                                  "rounded px-1.5 py-0.5",
                                  isAdd && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold",
                                  isMod && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold",
                                  !isAdd && !isMod && "text-muted",
                                )}
                                title={formatPropertyValue(change.afterValue)}
                              >
                                {formatPropertyValue(change.afterValue)}
                              </span>
                            </td>

                            {/* Copy Action */}
                            <td className="py-2.5 px-2 text-right">
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                  handleCopy(
                                    JSON.stringify(
                                      {
                                        property: change.property,
                                        type: change.changeType,
                                        before: change.beforeValue,
                                        after: change.afterValue,
                                      },
                                      null,
                                      2,
                                    ),
                                    change.property,
                                  )
                                }
                                className="size-6 p-0 shrink-0"
                                title={`Copy ${change.property} change`}
                              >
                                {copiedField === change.property ? (
                                  <Check className="size-3 text-success" />
                                ) : (
                                  <Copy className="size-3" />
                                )}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Side-by-Side Raw JSON View */
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* State Before Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted">
                  <span className="flex items-center gap-1">
                    <span>Recorded State Before</span>
                    <span className="rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1 py-0.2 text-[10px]">
                      beforeData
                    </span>
                  </span>
                  {initialData?.beforeData && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(JSON.stringify(initialData.beforeData, null, 2), "rawBefore")
                      }
                      className="text-muted hover:text-foreground text-[11px] flex items-center gap-1"
                    >
                      {copiedField === "rawBefore" ? (
                        <Check className="size-3 text-success" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      <span>Copy</span>
                    </button>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-surface-subtle p-3 font-mono text-[11px] overflow-x-auto max-h-72">
                  {initialData?.beforeData && Object.keys(initialData.beforeData).length > 0 ? (
                    <pre className="text-foreground whitespace-pre-wrap">
                      {JSON.stringify(initialData.beforeData, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-muted italic">No initial state recorded (New Entity / Create)</span>
                  )}
                </div>
              </div>

              {/* State After Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted">
                  <span className="flex items-center gap-1">
                    <span>Recorded State After</span>
                    <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.2 text-[10px]">
                      afterData
                    </span>
                  </span>
                  {initialData?.afterData && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(JSON.stringify(initialData.afterData, null, 2), "rawAfter")
                      }
                      className="text-muted hover:text-foreground text-[11px] flex items-center gap-1"
                    >
                      {copiedField === "rawAfter" ? (
                        <Check className="size-3 text-success" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      <span>Copy</span>
                    </button>
                  )}
                </div>
                <div className="rounded-lg border border-border bg-surface-subtle p-3 font-mono text-[11px] overflow-x-auto max-h-72">
                  {initialData?.afterData && Object.keys(initialData.afterData).length > 0 ? (
                    <pre className="text-foreground whitespace-pre-wrap">
                      {JSON.stringify(initialData.afterData, null, 2)}
                    </pre>
                  ) : (
                    <span className="text-muted italic">No final state recorded (Deleted Entity)</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
