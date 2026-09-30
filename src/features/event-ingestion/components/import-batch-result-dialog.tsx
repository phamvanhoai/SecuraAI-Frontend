"use client";

import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Layers,
  Loader2,
  Search,
  Server,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  useBatchDetail,
  useBatchInvalidEvents,
} from "../hooks/use-event-sources";
import type { InvalidEventItem } from "../schemas/event-source-schema";

export function ImportBatchResultDialog({
  batchId,
  isOpen,
  onClose,
}: {
  batchId: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();

  const [page, setPage] = useState<number>(1);
  const [errorCodeFilter, setErrorCodeFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [inspectingEvent, setInspectingEvent] = useState<InvalidEventItem | null>(
    null,
  );

  const batchQuery = useBatchDetail(batchId);
  const invalidEventsQuery = useBatchInvalidEvents(
    batchId,
    batchId
      ? {
          page,
          limit: 10,
          errorCode: errorCodeFilter || undefined,
          q: searchTerm || undefined,
        }
      : undefined,
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Reset pagination and filters on new batch
  useEffect(() => {
    if (isOpen) {
      setPage(1);
      setErrorCodeFilter("");
      setSearchTerm("");
      setInspectingEvent(null);
    }
  }, [isOpen, batchId]);

  function handleClose() {
    setInspectingEvent(null);
    onClose();
  }

  async function copyPayloadToClipboard(payload: unknown) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success("Payload copied", "Raw event payload copied to clipboard.");
    } catch {
      toast.error("Copy failed", "Unable to copy payload to clipboard.");
    }
  }

  const batch = batchQuery.data;
  const invalidEventsData = invalidEventsQuery.data;

  // Calculate duration if available
  let durationText: string | null = null;
  if (batch?.startedAt && batch?.completedAt) {
    const start = new Date(batch.startedAt).getTime();
    const end = new Date(batch.completedAt).getTime();
    const durationMs = end - start;
    if (durationMs < 1000) {
      durationText = `${durationMs}ms`;
    } else {
      durationText = `${(durationMs / 1000).toFixed(2)}s`;
    }
  }

  const successRate =
    batch && batch.totalRecords > 0
      ? Math.round((batch.acceptedRecords / batch.totalRecords) * 100)
      : 0;

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(56rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      onClose={handleClose}
      title="Event Ingestion Batch Report"
    >
      <div className="space-y-5">
        {batchQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted">
            <Loader2 className="size-8 animate-spin mb-3 text-primary" />
            <p className="text-sm font-medium">Loading batch results...</p>
          </div>
        ) : batchQuery.isError || !batch ? (
          <div className="space-y-4">
            <Alert>
              {batchQuery.error?.message ||
                "Unable to load ingestion batch information."}
            </Alert>
            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Header & Meta Info */}
            <div className="border-border bg-neutral-soft/30 rounded-xl border p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-foreground text-base font-semibold">
                      Batch #{batch.id.slice(0, 8)}
                    </span>
                    <StatusBadge
                      tone={
                        batch.status === "COMPLETED"
                          ? "success"
                          : batch.status === "PARTIALLY_COMPLETED"
                            ? "warning"
                            : batch.status === "FAILED"
                              ? "danger"
                              : "neutral"
                      }
                    >
                      {batch.status.replace("_", " ")}
                    </StatusBadge>
                    <span className="text-xs bg-neutral-soft px-2 py-0.5 rounded font-mono text-muted">
                      {batch.batchType}
                    </span>
                  </div>
                  <p className="text-muted text-xs font-mono mt-1">
                    ID: {batch.id}
                  </p>
                </div>

                <div className="sm:text-right space-y-0.5">
                  <div className="flex items-center sm:justify-end gap-1.5 text-xs text-muted">
                    <Server className="size-3.5" />
                    <span>Source:</span>
                    <strong className="text-foreground font-medium">
                      {batch.eventSourceName}
                    </strong>
                  </div>
                  {durationText && (
                    <div className="flex items-center sm:justify-end gap-1.5 text-xs text-muted">
                      <Clock className="size-3.5" />
                      <span>Duration: {durationText}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="border-border bg-background rounded-lg border p-3 text-center">
                  <span className="text-muted block text-xs">Total Records</span>
                  <span className="text-foreground text-xl font-bold font-mono">
                    {batch.totalRecords}
                  </span>
                </div>
                <div className="border-emerald-500/20 bg-emerald-500/10 rounded-lg border p-3 text-center">
                  <span className="text-emerald-700 dark:text-emerald-400 block text-xs font-semibold">
                    Accepted
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-xl font-bold font-mono">
                    {batch.acceptedRecords}
                  </span>
                </div>
                <div className="border-rose-500/20 bg-rose-500/10 rounded-lg border p-3 text-center">
                  <span className="text-rose-700 dark:text-rose-400 block text-xs font-semibold">
                    Rejected
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 text-xl font-bold font-mono">
                    {batch.rejectedRecords}
                  </span>
                </div>
                <div className="border-border bg-background rounded-lg border p-3 text-center">
                  <span className="text-muted block text-xs">Success Rate</span>
                  <span className="text-foreground text-xl font-bold font-mono">
                    {successRate}%
                  </span>
                </div>
              </div>

              {batch.errorMessage && (
                <div className="border-rose-500/30 bg-rose-500/10 rounded-lg border p-3 text-xs text-rose-800 dark:text-rose-300">
                  <strong className="font-semibold block mb-0.5">
                    Batch Execution Error:
                  </strong>
                  {batch.errorMessage}
                </div>
              )}
            </div>

            {/* Invalid Events Section */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-4 text-rose-600 dark:text-rose-400" />
                  <h4 className="text-foreground text-sm font-semibold">
                    Invalid & Rejected Events ({batch.rejectedRecords})
                  </h4>
                </div>

                {batch.rejectedRecords > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="relative w-44">
                      <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                      <Input
                        type="text"
                        placeholder="Filter errors..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setPage(1);
                        }}
                        className="pl-8 text-xs h-8"
                      />
                    </div>
                    <Select
                      aria-label="Filter error code"
                      value={errorCodeFilter}
                      onChange={(e) => {
                        setErrorCodeFilter(e.target.value);
                        setPage(1);
                      }}
                      className="text-xs h-8 w-36"
                    >
                      <option value="">All Errors</option>
                      <option value="MISSING_REQUIRED_FIELD">Missing Field</option>
                      <option value="INVALID_FORMAT">Invalid Format</option>
                      <option value="INVALID_EVENT_FAMILY">Invalid Family</option>
                      <option value="SCHEMA_VALIDATION_ERROR">Schema Error</option>
                      <option value="DATABASE_ERROR">Database Error</option>
                    </Select>
                  </div>
                )}
              </div>

              {batch.rejectedRecords === 0 ? (
                <div className="border-border bg-emerald-500/5 rounded-xl border border-emerald-500/20 p-8 text-center space-y-2">
                  <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <p className="text-foreground font-semibold text-sm">
                    No Invalid Events
                  </p>
                  <p className="text-muted text-xs max-w-md mx-auto">
                    All {batch.totalRecords} events in this batch passed validation and were successfully normalized and ingested.
                  </p>
                </div>
              ) : invalidEventsQuery.isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted text-xs">
                  <Loader2 className="size-5 animate-spin mr-2" />
                  <span>Loading rejected event details...</span>
                </div>
              ) : !invalidEventsData || invalidEventsData.items.length === 0 ? (
                <div className="border-border bg-background rounded-lg border p-6 text-center text-xs text-muted">
                  No invalid events match your search or filter criteria.
                </div>
              ) : (
                <div className="border-border bg-background rounded-xl border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-border border-b bg-neutral-soft/40 text-muted font-mono text-[11px]">
                          <th className="py-2 px-3"># Row</th>
                          <th className="py-2 px-3">Family</th>
                          <th className="py-2 px-3">Error Code</th>
                          <th className="py-2 px-3">Failure Reason</th>
                          <th className="py-2 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {invalidEventsData.items.map((row: InvalidEventItem) => (
                          <tr
                            key={row.id}
                            className="hover:bg-neutral-soft/20 transition-colors"
                          >
                            <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-foreground">
                              {row.recordIndex !== null
                                ? `Row #${row.recordIndex + 1}`
                                : "—"}
                            </td>
                            <td className="py-2.5 px-3">
                              {row.eventFamily ? (
                                <span className="bg-neutral-soft font-mono text-[10px] px-2 py-0.5 rounded text-muted">
                                  {row.eventFamily}
                                </span>
                              ) : (
                                <span className="text-muted text-xs">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-mono text-rose-600 dark:text-rose-400 font-semibold text-[11px]">
                                {row.errorCode}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-foreground font-sans max-w-sm break-words">
                              {row.errorMessage}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {row.receivedPayload ? (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() => setInspectingEvent(row)}
                                  className="h-7 px-2.5 text-xs gap-1.5 font-mono"
                                >
                                  <Code2 className="size-3.5" />
                                  <span>Inspect</span>
                                </Button>
                              ) : (
                                <span className="text-muted text-xs italic">
                                  No payload
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {invalidEventsData.pagination.totalPages > 1 && (
                    <div className="border-border flex items-center justify-between border-t px-4 py-2.5 bg-neutral-soft/20 text-xs">
                      <span className="text-muted">
                        Page{" "}
                        <strong className="text-foreground font-mono font-bold">
                          {invalidEventsData.pagination.page}
                        </strong>{" "}
                        of{" "}
                        <strong className="text-foreground font-mono font-bold">
                          {invalidEventsData.pagination.totalPages}
                        </strong>{" "}
                        ({invalidEventsData.pagination.total} total errors)
                      </span>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={invalidEventsData.pagination.page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          className="h-7 px-2"
                        >
                          <ChevronLeft className="size-3.5" />
                          <span className="sr-only">Previous Page</span>
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={
                            invalidEventsData.pagination.page >=
                            invalidEventsData.pagination.totalPages
                          }
                          onClick={() => setPage((p) => p + 1)}
                          className="h-7 px-2"
                        >
                          <ChevronRight className="size-3.5" />
                          <span className="sr-only">Next Page</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Inspect Payload Modal / Sub-view */}
            {inspectingEvent && (
              <div className="border-border bg-neutral-soft/50 rounded-xl border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="size-4 text-primary" />
                    <span className="text-foreground font-semibold text-xs uppercase tracking-wider">
                      Raw Received Payload •{" "}
                      {inspectingEvent.recordIndex !== null
                        ? `Row #${inspectingEvent.recordIndex + 1}`
                        : "Event Payload"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        copyPayloadToClipboard(inspectingEvent.receivedPayload)
                      }
                      className="h-7 px-2.5 text-xs gap-1.5"
                    >
                      <Copy className="size-3.5" />
                      <span>Copy JSON</span>
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setInspectingEvent(null)}
                      className="size-7 p-0"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="bg-[#0b101b] border border-border/80 rounded-lg p-3 text-[#d1d5db] font-mono text-xs max-h-64 overflow-y-auto leading-relaxed selection:bg-primary/30">
                  <pre className="whitespace-pre-wrap break-all">
                    {JSON.stringify(inspectingEvent.receivedPayload, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Dialog Footer */}
            <div className="border-border flex items-center justify-end border-t pt-4">
              <Button type="button" onClick={handleClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
