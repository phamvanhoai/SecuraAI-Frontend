"use client";

import {
  AlertCircle,
  AlertTriangle,
  FileCode,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Server,
  Upload,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/api-error";
import { useEventSources, useImportEvents } from "../hooks/use-event-sources";
import {
  eventFamilies,
  type EventSourceResponse,
  type ImportEventsResponse,
} from "../schemas/event-source-schema";
import {
  parseEventFileContent,
  type ParsedEventFileResult,
} from "../utils/event-file-parser";

const eventFamilyOptions = [
  { value: "AUTHENTICATION", label: "Authentication & Identity" },
  { value: "VPN_SSO", label: "VPN & Remote SSO" },
  { value: "APPLICATION_ACCESS", label: "Application & Privilege Access" },
] as const;

export function ImportEventsDialog({
  isOpen,
  onClose,
  presetSource,
  onImportComplete,
  onViewBatchReport,
}: {
  isOpen: boolean;
  onClose: () => void;
  presetSource?: EventSourceResponse | null | undefined;
  onImportComplete?: ((result: ImportEventsResponse) => void) | undefined;
  onViewBatchReport?: ((batchId: string) => void) | undefined;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();
  const toast = useToast();

  const [userSourceId, setUserSourceId] = useState<string>("");
  const [userEventFamily, setUserEventFamily] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedEventFileResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportEventsResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "diagnostics">("preview");

  const sourcesQuery = useEventSources({ limit: 50, status: "ACTIVE" });
  const importMutation = useImportEvents();

  const selectedSourceId =
    presetSource?.id ?? (userSourceId || (sourcesQuery.data?.items[0]?.id ?? ""));
  const defaultEventFamily =
    userEventFamily || (presetSource?.eventFamilies[0] ?? "AUTHENTICATION");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  function resetForm() {
    setSelectedFile(null);
    setParsedData(null);
    setIsParsing(false);
    setErrorMessage(null);
    setImportResult(null);
    setActiveTab("preview");
    setUserSourceId("");
    setUserEventFamily("");
  }

  function handleClose(): void {
    if (importMutation.isPending) return;
    resetForm();
    onClose();
  }

  async function handleFileSelected(file: File) {
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "json" && extension !== "csv") {
      setErrorMessage("Please select a valid .json or .csv event data file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File size exceeds 10MB limit.");
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setErrorMessage(null);
    setImportResult(null);

    try {
      const text = await file.text();
      const parsed = parseEventFileContent(text, file.name, defaultEventFamily);
      setParsedData(parsed);
      if (parsed.records.length === 0) {
        setErrorMessage("No valid event records found in file.");
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to parse file content.",
      );
    } finally {
      setIsParsing(false);
    }
  }

  function onFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileSelected(file);
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFileSelected(file);
    }
  }

  async function handleImportSubmit() {
    if (!selectedSourceId || !parsedData || parsedData.records.length === 0) {
      setErrorMessage("Please select an event source and a valid data file.");
      return;
    }

    setErrorMessage(null);

    try {
      const result = await importMutation.mutateAsync({
        sourceId: selectedSourceId,
        payload: {
          fileName: selectedFile?.name ?? "imported_events.json",
          fileFormat: parsedData.format,
          eventFamily: (defaultEventFamily as (typeof eventFamilies)[number]) ?? undefined,
          events: parsedData.records,
        },
      });

      setImportResult(result);
      onImportComplete?.(result);

      if (result.status === "COMPLETED") {
        toast.success(
          "Import completed",
          `Successfully imported ${result.acceptedRecords} normalized events into ${result.eventSourceName}.`,
        );
      } else if (result.status === "PARTIALLY_COMPLETED") {
        toast.warning(
          "Import partially completed",
          `${result.acceptedRecords} accepted, ${result.rejectedRecords} rejected out of ${result.totalRecords} records.`,
        );
      } else {
        toast.error(
          "Import failed",
          `All ${result.totalRecords} records were rejected due to validation errors.`,
        );
      }

      if (onViewBatchReport) {
        handleClose();
        onViewBatchReport(result.batchId);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Failed to process event batch import. Please try again.");
      }
    }
  }

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      onClose={handleClose}
      title={
        importResult
          ? "Event Import Results"
          : "Import Normalized Events from File"
      }
    >
      <div className="space-y-5">
        {errorMessage && <Alert>{errorMessage}</Alert>}

        {importResult ? (
          /* ================= Results State ================= */
          <div className="space-y-5">
            <div className="border-border bg-neutral-soft/40 rounded-xl border p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-foreground text-lg font-semibold">
                      Batch Ingestion Summary
                    </h3>
                    <StatusBadge
                      tone={
                        importResult.status === "COMPLETED"
                          ? "success"
                          : importResult.status === "PARTIALLY_COMPLETED"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {importResult.status.replace("_", " ")}
                    </StatusBadge>
                  </div>
                  <p className="text-muted text-xs font-mono mt-1">
                    Batch ID: {importResult.batchId}
                  </p>
                </div>

                <div className="text-right sm:text-right">
                  <span className="text-muted text-xs">Target Event Source</span>
                  <p className="text-foreground text-sm font-semibold">
                    {importResult.eventSourceName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="border-border bg-background rounded-lg border p-3 text-center">
                  <span className="text-muted block text-xs">Total Records</span>
                  <span className="text-foreground text-xl font-bold font-mono">
                    {importResult.totalRecords}
                  </span>
                </div>
                <div className="border-emerald-500/20 bg-emerald-500/10 rounded-lg border p-3 text-center">
                  <span className="text-emerald-700 dark:text-emerald-400 block text-xs font-semibold">
                    Accepted
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 text-xl font-bold font-mono">
                    {importResult.acceptedRecords}
                  </span>
                </div>
                <div className="border-rose-500/20 bg-rose-500/10 rounded-lg border p-3 text-center">
                  <span className="text-rose-700 dark:text-rose-400 block text-xs font-semibold">
                    Rejected
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 text-xl font-bold font-mono">
                    {importResult.rejectedRecords}
                  </span>
                </div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="border-border bg-background rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs uppercase tracking-wider">
                  <AlertCircle className="size-4" />
                  <span>Validation & Ingestion Errors ({importResult.errors.length})</span>
                </div>

                <div className="max-h-56 overflow-y-auto divide-y divide-border text-xs">
                  {importResult.errors.map((err, idx) => (
                    <div key={idx} className="py-2 flex items-start gap-3">
                      <span className="bg-neutral-soft font-mono px-1.5 py-0.5 rounded text-[11px] font-bold">
                        Row #{err.recordIndex + 1}
                      </span>
                      <div className="flex-1">
                        <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                          [{err.errorCode}]
                        </span>{" "}
                        <span className="text-foreground">{err.errorMessage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-border flex items-center justify-between border-t pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={resetForm}
                className="gap-2"
              >
                <RefreshCw className="size-3.5" />
                <span>Import another file</span>
              </Button>

              <div className="flex items-center gap-2">
                {onViewBatchReport && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const bId = importResult.batchId;
                      handleClose();
                      onViewBatchReport(bId);
                    }}
                    className="gap-1.5"
                  >
                    <FileSpreadsheet className="size-3.5" />
                    <span>View Full Batch Report</span>
                  </Button>
                )}
                <Button type="button" onClick={handleClose}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* ================= Upload & Config State ================= */
          <div className="space-y-4">
            {/* Step 1: Target Event Source & Default Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-foreground block text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Target Event Source <span className="text-danger">*</span>
                </label>
                {presetSource ? (
                  <div className="border-border bg-neutral-soft/60 flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Server className="size-4 text-muted" />
                      <span className="font-medium text-foreground">
                        {presetSource.name}
                      </span>
                    </div>
                    <StatusBadge tone="success">Active</StatusBadge>
                  </div>
                ) : (
                  <Select
                    aria-label="Select target event source"
                    value={selectedSourceId}
                    onChange={(e) => setUserSourceId(e.target.value)}
                    className="w-full text-sm"
                  >
                    <option value="" disabled>
                      Select an event source...
                    </option>
                    {sourcesQuery.data?.items.map((src) => (
                      <option key={src.id} value={src.id}>
                        {src.name} ({src.sourceType})
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              <div>
                <label className="text-foreground block text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Fallback Event Family
                </label>
                <Select
                  aria-label="Select fallback event family"
                  value={defaultEventFamily}
                  onChange={(e) => setUserEventFamily(e.target.value)}
                  className="w-full text-sm"
                >
                  {eventFamilyOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                <p className="text-muted text-[11px] leading-relaxed mt-1.5">
                  Used only when an imported event does not contain an event family and automatic detection cannot determine one.
                </p>
              </div>
            </div>

            {/* Step 2: File Upload Dropzone */}
            <div>
              <label className="text-foreground block text-xs font-semibold uppercase tracking-wider mb-1.5">
                Upload Normalized Event File (JSON / CSV)
              </label>

              <input
                id={fileInputId}
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                aria-label="Upload Normalized Event File (JSON / CSV)"
                data-testid="event-file-input"
                onChange={onFileInputChange}
                className="sr-only"
                tabIndex={-1}
              />

              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-neutral-soft/30"
                  }`}
                >
                  <UploadCloud className="size-10 text-muted mx-auto stroke-1" />
                  <p className="text-foreground text-sm font-semibold mt-2">
                    Drag and drop your event file here, or{" "}
                    <span className="text-primary hover:underline">browse</span>
                  </p>
                  <p className="text-muted text-xs mt-1">
                    Supports structured <code className="font-mono">.json</code> (array of normalized objects) and <code className="font-mono">.csv</code> (max 10MB / 5,000 events)
                  </p>
                </div>
              ) : (
                <div className="border-border bg-neutral-soft/40 rounded-xl border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-background border border-border">
                        {selectedFile.name.endsWith(".json") ? (
                          <FileCode className="size-5 text-sky-600 dark:text-sky-400" />
                        ) : (
                          <FileSpreadsheet className="size-5 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </div>
                      <div>
                        <span className="text-foreground font-semibold text-sm block">
                          {selectedFile.name}
                        </span>
                        <span className="text-muted text-xs">
                          {(selectedFile.size / 1024).toFixed(1)} KB • Format:{" "}
                          <strong className="font-mono font-bold">
                            {parsedData?.format ?? "Detecting..."}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setSelectedFile(null);
                        setParsedData(null);
                      }}
                      className="size-8 p-0"
                      title="Remove file"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>

                  {/* Parse Statistics Strip */}
                  {isParsing ? (
                    <div className="flex items-center gap-2 text-muted text-xs py-2">
                      <Loader2 className="size-4 animate-spin" />
                      <span>Validating file schema...</span>
                    </div>
                  ) : parsedData ? (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                      <div className="bg-background border border-border rounded-lg px-3 py-2 text-center">
                        <span className="text-muted text-[11px] block">Parsed Records</span>
                        <span className="text-foreground font-bold font-mono text-sm">
                          {parsedData.records.length}
                        </span>
                      </div>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 text-center">
                        <span className="text-emerald-700 dark:text-emerald-400 text-[11px] block font-medium">
                          Valid Format
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-sm">
                          {parsedData.validCount}
                        </span>
                      </div>
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 text-center">
                        <span className="text-amber-700 dark:text-amber-400 text-[11px] block font-medium">
                          Warnings/Issues
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold font-mono text-sm">
                          {parsedData.invalidCount}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Step 3: Data Preview / Validation Tabs */}
            {parsedData && parsedData.records.length > 0 && (
              <div className="border-border bg-background rounded-xl border overflow-hidden">
                <div className="border-border flex items-center border-b bg-neutral-soft/30 px-3 pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={`px-3 py-1.5 font-medium border-b-2 transition-colors ${
                      activeTab === "preview"
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-muted hover:text-foreground"
                    }`}
                  >
                    Data Preview (First 5 records)
                  </button>
                  {parsedData.parseErrors.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("diagnostics")}
                      className={`px-3 py-1.5 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                        activeTab === "diagnostics"
                          ? "border-amber-500 text-amber-600 dark:text-amber-400 font-semibold"
                          : "border-transparent text-amber-600/80 hover:text-amber-600"
                      }`}
                    >
                      <AlertTriangle className="size-3.5" />
                      <span>Diagnostics ({parsedData.parseErrors.length})</span>
                    </button>
                  )}
                </div>

                <div className="p-3">
                  {activeTab === "preview" ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-border border-b text-muted font-mono text-[11px]">
                            <th className="py-1.5 px-2">#</th>
                            <th className="py-1.5 px-2">Event Type</th>
                            <th className="py-1.5 px-2">Family</th>
                            <th className="py-1.5 px-2">Time</th>
                            <th className="py-1.5 px-2">Account</th>
                            <th className="py-1.5 px-2">Source IP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                          {parsedData.records.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="hover:bg-neutral-soft/30 font-mono text-[11px]">
                              <td className="py-1.5 px-2 text-muted">{idx + 1}</td>
                              <td className="py-1.5 px-2 font-semibold text-foreground">
                                {String(row["eventType"] ?? "—")}
                              </td>
                              <td className="py-1.5 px-2 text-muted">
                                {String(row["eventFamily"] ?? defaultEventFamily)}
                              </td>
                              <td className="py-1.5 px-2 text-muted truncate max-w-[140px]">
                                {String(row["occurredAt"] ?? row["timestamp"] ?? "—")}
                              </td>
                              <td className="py-1.5 px-2 text-foreground truncate max-w-[120px]">
                                {String(row["accountIdentifier"] ?? row["username"] ?? "—")}
                              </td>
                              <td className="py-1.5 px-2 text-muted">
                                {String(row["sourceIp"] ?? "—")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="space-y-1 text-xs text-amber-800 dark:text-amber-300 max-h-40 overflow-y-auto">
                      {parsedData.parseErrors.map((err, i) => (
                        <p key={i} className="font-mono text-[11px]">
                          • {err}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="border-border flex items-center justify-end gap-3 border-t pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={importMutation.isPending}
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleImportSubmit}
                disabled={
                  !selectedSourceId ||
                  !parsedData ||
                  parsedData.validCount === 0 ||
                  importMutation.isPending
                }
                className="flex items-center gap-2"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Processing Batch Import...</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    <span>
                      Import {parsedData ? `${parsedData.records.length} Events` : "Events"}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
