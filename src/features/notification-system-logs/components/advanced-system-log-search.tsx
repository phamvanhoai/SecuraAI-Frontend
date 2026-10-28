"use client";

import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Download,
  Eye,
  Filter,
  GitBranch,
  Info,
  Loader2,
  RotateCcw,
  Search,
  Shield,
  User,
  X,
} from "lucide-react";
import React, { useRef, useState, type ComponentProps, type ReactNode } from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/feedback/toast";
import { cn } from "@/lib/utils";
import { exportInvestigationLogs } from "../api/export-investigation-logs";
import { useSystemLogSearch } from "../hooks/use-system-log-search";
import { useSystemLogDetail } from "../hooks/use-system-log-detail";
import type {
  SystemLogDetail,
  SystemLogRecord,
  SystemLogStatus,
} from "../schemas/system-log-schema";

const pageSize = 20;
type AppliedFilters = {
  query: string;
  eventType: string;
  source: string;
  actor: string;
  status: "" | SystemLogStatus;
  from: string;
  to: string;
};
const emptyFilters: AppliedFilters = {
  query: "",
  eventType: "",
  source: "",
  actor: "",
  status: "",
  from: "",
  to: "",
};

export function AdvancedSystemLogSearch({ canExport }: { canExport: boolean }) {
  const [page, setPage] = useState(1);
  const [searchRequest, setSearchRequest] = useState(0);
  const [draft, setDraft] = useState("");
  const [applied, setApplied] = useState<AppliedFilters>(emptyFilters);
  const [eventType, setEventType] = useState("");
  const [source, setSource] = useState("");
  const [actor, setActor] = useState("");
  const [status, setStatus] = useState<"" | SystemLogStatus>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dateError, setDateError] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [selected, setSelected] = useState<SystemLogRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportScope, setExportScope] = useState<"SELECTED" | "FILTERED">(
    "SELECTED",
  );
  const [exportFormat, setExportFormat] = useState<
    "CSV" | "JSON" | "XLSX" | "PDF"
  >("PDF");
  const [exportReason, setExportReason] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportErrors, setExportErrors] = useState({
    scope: "",
    reason: "",
    request: "",
  });
  const toast = useToast();
  const dialog = useRef<HTMLDialogElement>(null);
  const exportDialog = useRef<HTMLDialogElement>(null);
  const logs = useSystemLogSearch(
    {
      page,
      limit: pageSize,
      ...(applied.query ? { q: applied.query } : {}),
      ...(applied.eventType ? { eventType: applied.eventType } : {}),
      ...(applied.source ? { source: applied.source } : {}),
      ...(applied.actor ? { actor: applied.actor } : {}),
      ...(applied.status ? { status: applied.status } : {}),
      ...(applied.from ? { from: applied.from } : {}),
      ...(applied.to ? { to: applied.to } : {}),
    },
    searchRequest,
  );
  const detail = useSystemLogDetail(selected?.id ?? null);
  const rows = logs.data?.items ?? [];
  const pagination = logs.data?.pagination;
  const activeCount = [
    applied.query,
    applied.eventType,
    applied.source,
    applied.actor,
    applied.status,
    applied.from || applied.to,
  ].filter(Boolean).length;
  const applyFilters = () => {
    const fromDate = from ? parseNativeDate(from, false) : null;
    const toDate = to ? parseNativeDate(to, true) : null;
    if ((from && !fromDate) || (to && !toDate)) {
      setDateError("Select valid dates.");
      return;
    }
    if (fromDate && toDate && fromDate > toDate) {
      setDateError("From date must not be after to date.");
      return;
    }
    setDateError("");
    setApplied({
      query: draft.trim(),
      eventType: eventType.trim(),
      source: source.trim(),
      actor: actor.trim(),
      status,
      from: fromDate?.toISOString() ?? "",
      to: toDate?.toISOString() ?? "",
    });
    setPage(1);
    setSearchRequest((current) => current + 1);
  };
  const reset = () => {
    setDraft("");
    setEventType("");
    setSource("");
    setActor("");
    setStatus("");
    setFrom("");
    setTo("");
    setDateError("");
    setApplied(emptyFilters);
    setPage(1);
  };
  const columns: readonly DataTableColumn<SystemLogRecord>[] = [
    ...(canExport
      ? [
          {
            key: "select",
            header: "Select",
            cell: (log: SystemLogRecord) => (
              <Checkbox
                aria-label={`Select ${log.eventType} at ${formatTime(log.occurredAt)}`}
                checked={selectedIds.includes(log.id)}
                onChange={() =>
                  setSelectedIds((current) =>
                    current.includes(log.id)
                      ? current.filter((id) => id !== log.id)
                      : [...current, log.id],
                  )
                }
              />
            ),
          },
        ]
      : []),
    {
      key: "time",
      header: "Timestamp",
      cell: (log) => (
        <time
          className="font-mono text-xs whitespace-nowrap"
          dateTime={log.occurredAt}
        >
          {formatTime(log.occurredAt)}
        </time>
      ),
    },
    {
      key: "event",
      header: "Event type",
      cell: (log) => (
        <div>
          <p className="font-mono text-xs font-semibold">{log.eventType}</p>
          <p className="text-muted mt-1 text-xs">
            {humanize(log.resourceType)}
          </p>
        </div>
      ),
    },
    { key: "source", header: "Source", cell: (log) => log.source },
    {
      key: "actor",
      header: "Actor",
      cell: (log) => (
        <div>
          <p>{log.actor}</p>
          {log.actorDetail && log.actorDetail !== log.actor ? (
            <p className="text-muted mt-1 text-xs">{log.actorDetail}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Processing status",
      cell: (log) => <LogStatusBadge status={log.status} />,
    },
    {
      key: "action",
      header: "Actions",
      cell: (log) => (
        <Button
          className="min-h-8 gap-1.5 px-2.5 text-xs font-medium"
          variant="secondary"
          type="button"
          onClick={() => {
            setSelected(log);
            dialog.current?.showModal();
          }}
        >
          <Eye aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <ProductPanel
        title="System log search"
        description={
          pagination
            ? `${pagination.total} logs match the current criteria`
            : "Permission-scoped operational activity"
        }
      >
        <div className="border-border space-y-3 border-b p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <form
              className="flex min-w-0 flex-1 gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                applyFilters();
              }}
            >
              <Label
                className="relative max-w-md min-w-[220px] flex-1"
                htmlFor="system-log-search"
              >
                <span className="sr-only">Search system logs</span>
                <Search
                  aria-hidden="true"
                  className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <Input
                  className="min-h-10 pl-9"
                  id="system-log-search"
                  maxLength={100}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Event, resource, actor, or correlation ID"
                />
              </Label>
              <Button type="submit">Search</Button>
            </form>
            <div className="flex flex-wrap gap-2">
              <Select
                aria-label="Processing status"
                className="w-44"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as "" | SystemLogStatus)
                }
              >
                <option value="">All statuses</option>
                <option value="SUCCESS">Processed</option>
                <option value="DENIED">Denied</option>
                <option value="FAILURE">Failed</option>
              </Select>
              <Button
                type="button"
                variant={advanced ? "primary" : "secondary"}
                onClick={() => setAdvanced((value) => !value)}
              >
                <Filter aria-hidden="true" className="size-4" />
                Advanced
                {activeCount ? (
                  <span className="bg-brand-soft text-brand rounded-full px-1.5 text-xs">
                    {activeCount}
                  </span>
                ) : null}
              </Button>
              {activeCount ? (
                <Button type="button" variant="secondary" onClick={reset}>
                  <RotateCcw aria-hidden="true" className="size-4" />
                  Reset
                </Button>
              ) : null}
              {canExport ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!pagination?.total}
                  onClick={() => {
                    setExportErrors({ scope: "", reason: "", request: "" });
                    exportDialog.current?.showModal();
                  }}
                >
                  <Download aria-hidden="true" className="size-4" />
                  Export logs
                </Button>
              ) : null}
            </div>
          </div>
          {advanced ? (
            <div className="border-border bg-neutral-soft/20 grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-5">
              <FilterInput
                id="log-event"
                label="Event type"
                value={eventType}
                placeholder="e.g. USER_UPDATED"
                onChange={setEventType}
              />
              <FilterInput
                id="log-source"
                label="Source"
                value={source}
                placeholder="e.g. User Management"
                onChange={setSource}
              />
              <FilterInput
                id="log-actor"
                label="Actor"
                value={actor}
                placeholder="Name, email, or system"
                onChange={setActor}
              />
              <DateFilter
                id="log-from"
                label="From date"
                value={from}
                onChange={(value) => {
                  setFrom(value);
                  setDateError("");
                }}
              />
              <DateFilter
                id="log-to"
                label="To date"
                {...(from ? { min: from } : {})}
                value={to}
                onChange={(value) => {
                  setTo(value);
                  setDateError("");
                }}
              />
            </div>
          ) : null}
          {dateError ? <Alert>{dateError}</Alert> : null}
        </div>
        <div className="p-4">
          {logs.isPending ? (
            <TableSkeleton
              headers={[
                ...(canExport ? ["Select"] : []),
                "Timestamp",
                "Event type",
                "Source",
                "Actor",
                "Processing status",
                "Actions",
              ]}
              rows={6}
              label="Loading system logs"
            />
          ) : logs.isError ? (
            <Alert>
              <div className="flex items-center justify-between gap-3">
                <span>
                  Unable to load system logs. Check your connection and try
                  again.
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void logs.refetch()}
                >
                  Retry
                </Button>
              </div>
            </Alert>
          ) : rows.length ? (
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(log) => log.id}
            />
          ) : (
            <div className="py-12 text-center">
              <Search
                aria-hidden="true"
                className="text-muted mx-auto mb-3 size-10"
              />
              <h3 className="text-foreground text-base font-semibold">
                No logs match the current criteria
              </h3>
              <p className="text-muted mx-auto mt-1 max-w-sm text-sm">
                Try adjusting the search terms, status, or advanced filters.
              </p>
              {activeCount ? (
                <Button
                  className="mt-4"
                  type="button"
                  variant="secondary"
                  onClick={reset}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          )}
        </div>
        {pagination ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={pagination.page}
              pageCount={pagination.pageCount}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </ProductPanel>
      <Dialog
        className="max-h-[calc(100dvh-2rem)] w-[min(72rem,calc(100%-2rem))] overflow-y-auto"
        dialogRef={dialog}
        title="System log details"
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="space-y-5">
            {/* Context bar */}
            <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
              <span className="flex items-center gap-1.5 font-mono font-semibold">
                <Activity className="size-3.5 text-brand" strokeWidth={1.8} />
                {selected.eventType}
              </span>
              <span className="text-border">·</span>
              <LogStatusBadge status={selected.status} />
              <span className="text-border">·</span>
              <time className="text-muted font-mono" dateTime={selected.occurredAt}>
                {formatTime(selected.occurredAt)}
              </time>
            </div>
            {/* Summary fact grid */}
            <dl className="border-border bg-neutral-soft/30 grid gap-x-6 gap-y-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="min-w-0">
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">Source</dt>
                <dd className="mt-1 text-sm font-medium break-words">{selected.source}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">Actor</dt>
                <dd className="mt-1 text-sm font-medium break-words">
                  {selected.actorDetail && selected.actorDetail !== selected.actor
                    ? selected.actor + " · " + selected.actorDetail
                    : selected.actor}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">Resource</dt>
                <dd className="mt-1 text-sm font-medium">{humanize(selected.resourceType)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">Correlation ID</dt>
                <dd className="mt-1 text-sm font-medium font-mono break-all">
                  {selected.correlationId ?? <span className="text-muted font-sans font-normal">Not recorded</span>}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">Error code</dt>
                <dd className="mt-1 text-sm font-medium">
                  {selected.errorCode ?? <span className="text-muted font-normal">None</span>}
                </dd>
              </div>
            </dl>
            {/* Detail sections */}
            {detail.isPending ? (
              <SystemLogDetailSkeleton />
            ) : detail.isError ? (
              <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3.5">
                <div className="flex gap-2.5">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.8} />
                  <p className="text-sm">Unable to load the complete log record.</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void detail.refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : detail.data ? (
              <CompleteSystemLogDetail log={detail.data} />
            ) : null}
            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => dialog.current?.close()}
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
            <Dialog dialogRef={exportDialog} title="Export Investigation Logs">
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            const scopeError =
              exportScope === "SELECTED" && selectedIds.length === 0
                ? "Select at least one log from the table or choose All matching results."
                : "";
            const reasonError =
              exportReason.trim().length < 10
                ? "Enter an investigation purpose of at least 10 characters."
                : "";
            setExportErrors({
              scope: scopeError,
              reason: reasonError,
              request: "",
            });
            if (scopeError || reasonError) {
              if (scopeError)
                exportDialog.current
                  ?.querySelector<HTMLInputElement>(
                    'input[name="export-scope"]',
                  )
                  ?.focus();
              else
                exportDialog.current
                  ?.querySelector<HTMLTextAreaElement>("#export-reason")
                  ?.focus();
              return;
            }
            setExporting(true);
            try {
              const exported = await exportInvestigationLogs({
                format: exportFormat,
                scope: exportScope,
                selectedIds,
                reason: exportReason.trim(),
                filters: {
                  ...(applied.query ? { q: applied.query } : {}),
                  ...(applied.eventType
                    ? { eventType: applied.eventType }
                    : {}),
                  ...(applied.source ? { source: applied.source } : {}),
                  ...(applied.actor ? { actor: applied.actor } : {}),
                  ...(applied.status ? { status: applied.status } : {}),
                  ...(applied.from ? { from: applied.from } : {}),
                  ...(applied.to ? { to: applied.to } : {}),
                },
              });
              exportDialog.current?.close();
              toast.success(
                "Export generated",
                exported.sha256
                  ? `${exported.filename} downloaded · SHA-256 ${exported.sha256}`
                  : `${exported.filename} downloaded.`,
              );
            } catch (error) {
              setExportErrors((current) => ({
                ...current,
                request:
                  error instanceof Error
                    ? error.message
                    : "Export failed. Please try again.",
              }));
            } finally {
              setExporting(false);
            }
          }}
        >
          {/* Request error banner */}
          {exportErrors.request ? (
            <div role="alert" className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.8} />
              <p className="text-sm text-danger">{exportErrors.request}</p>
            </div>
          ) : null}

          {/* Audit notice */}
          <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
            <Info className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
            <p className="text-xs text-muted">
              This export is logged as an audited investigation action. Provide an accurate investigation purpose — it will be stored with the export record.
            </p>
          </div>
          <fieldset
            className="space-y-3"
            aria-describedby={
              exportErrors.scope ? "export-scope-error" : undefined
            }
          >
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <Download className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
              <legend className="text-sm font-semibold">Export scope</legend>
            </div>
            <div className="border-border overflow-hidden rounded-xl border divide-y divide-border">
              <label
                className={cn(
                  "flex min-h-11 cursor-pointer items-start gap-3 p-3.5 transition-colors",
                  exportScope === "SELECTED" ? "bg-brand/5" : "hover:bg-neutral-soft/40",
                )}
              >
                <input
                  checked={exportScope === "SELECTED"}
                  name="export-scope"
                  type="radio"
                  className="mt-0.5 accent-brand"
                  onChange={() => {
                    setExportScope("SELECTED");
                    setExportErrors((current) => ({ ...current, scope: "" }));
                  }}
                />
                <span>
                  <span className="block text-sm font-medium">Selected logs</span>
                  <span className="text-muted text-xs">
                    {selectedIds.length} selected records
                  </span>
                </span>
              </label>
              <label
                className={cn(
                  "flex min-h-11 cursor-pointer items-start gap-3 p-3.5 transition-colors",
                  exportScope === "FILTERED" ? "bg-brand/5" : "hover:bg-neutral-soft/40",
                )}
              >
                <input
                  checked={exportScope === "FILTERED"}
                  name="export-scope"
                  type="radio"
                  className="mt-0.5 accent-brand"
                  onChange={() => {
                    setExportScope("FILTERED");
                    setExportErrors((current) => ({ ...current, scope: "" }));
                  }}
                />
                <span>
                  <span className="block text-sm font-medium">
                    All matching results
                  </span>
                  <span className="text-muted text-xs">
                    {pagination?.total ?? 0} records match the applied filters
                  </span>
                </span>
              </label>
            </div>
            {exportErrors.scope ? (
              <p
                id="export-scope-error"
                role="alert"
                className="text-danger text-sm"
              >
                {exportErrors.scope}
              </p>
            ) : null}
          </fieldset>
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <Filter className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
              <h3 className="text-sm font-semibold">File format</h3>
            </div>
            <Label className="space-y-1.5" htmlFor="export-format">
              <span className="text-xs font-medium text-muted">Select output format</span>
              <Select
                id="export-format"
                value={exportFormat}
                onChange={(event) =>
                  setExportFormat(
                    event.target.value as "CSV" | "JSON" | "XLSX" | "PDF",
                  )
                }
              >
                <option value="CSV">CSV</option>
                <option value="JSON">JSON</option>
                <option value="XLSX">XLSX — evidence workbook</option>
                <option value="PDF">PDF — formatted evidence report</option>
              </Select>
            </Label>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <Shield className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
              <h3 className="text-sm font-semibold">Investigation purpose</h3>
            </div>
            <Label className="space-y-1.5" htmlFor="export-reason">
              <span id="export-reason-label" className="text-xs font-medium text-muted">
                Investigation purpose
              </span>
              <Textarea
                id="export-reason"
                aria-labelledby="export-reason-label"
                aria-invalid={Boolean(exportErrors.reason)}
                aria-describedby={
                  exportErrors.reason
                    ? "export-reason-help export-reason-error"
                    : "export-reason-help"
                }
                maxLength={500}
                value={exportReason}
                onChange={(event) => {
                  setExportReason(event.target.value);
                  setExportErrors((current) => ({
                    ...current,
                    reason: "",
                    request: "",
                  }));
                }}
                placeholder="Explain why these logs are required for this investigation"
              />
              <span id="export-reason-help" className="text-muted block text-xs">
                Required · 10–500 characters
              </span>
              {exportErrors.reason ? (
                <span
                  id="export-reason-error"
                  role="alert"
                  className="text-danger block text-sm"
                >
                  {exportErrors.reason}
                </span>
              ) : null}
            </Label>
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="secondary"
              disabled={exporting}
              onClick={() => exportDialog.current?.close()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={exporting}>
              {exporting ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
                  Generating…
                </>
              ) : (
                "Generate export"
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

function FilterInput({
  id,
  label,
  onChange,
  ...props
}: { id: string; label: string; onChange: (value: string) => void } & Omit<
  ComponentProps<typeof Input>,
  "id" | "onChange"
>) {
  return (
    <Label className="space-y-1" htmlFor={id}>
      <span className="text-xs font-medium">{label}</span>
      <Input
        {...props}
        id={id}
        maxLength={props.maxLength ?? 150}
        onChange={(event) => onChange(event.target.value)}
      />
    </Label>
  );
}
function DateFilter({
  id,
  label,
  value,
  min,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
}) {
  const picker = useRef<HTMLInputElement>(null);
  const openPicker = () => {
    if (typeof picker.current?.showPicker === "function")
      picker.current.showPicker();
    else picker.current?.click();
  };
  return (
    <Label className="space-y-1" htmlFor={id}>
      <span className="text-xs font-medium">{label}</span>
      <div className="relative">
        <Input
          className="pr-20"
          id={id}
          placeholder="DD/MM/YYYY"
          readOnly
          value={value ? formatNativeDate(value) : ""}
          onClick={openPicker}
        />
        <div className="absolute inset-y-0 right-1 flex items-center gap-0.5">
          {value ? (
            <button
              aria-label={`Clear ${label.toLowerCase()}`}
              className="text-muted hover:text-foreground focus-visible:outline-brand rounded p-2 focus-visible:outline-2"
              type="button"
              onClick={() => onChange("")}
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          ) : null}
          <button
            aria-label={`Choose ${label.toLowerCase()}`}
            className="text-muted hover:text-foreground focus-visible:outline-brand rounded p-2 focus-visible:outline-2"
            type="button"
            onClick={openPicker}
          >
            <CalendarDays aria-hidden="true" className="size-4" />
          </button>
        </div>
        <input
          ref={picker}
          aria-hidden="true"
          className="pointer-events-none absolute size-px opacity-0"
          min={min}
          tabIndex={-1}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </Label>
  );
}
function LogStatusBadge({ status }: { status: SystemLogStatus }) {
  return (
    <StatusBadge
      tone={
        status === "SUCCESS"
          ? "success"
          : status === "DENIED"
            ? "warning"
            : "danger"
      }
    >
      {status === "SUCCESS"
        ? "Processed"
        : status === "DENIED"
          ? "Denied"
          : "Failed"}
    </StatusBadge>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted text-xs font-medium uppercase tracking-wide">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium break-words">{value}</dd>
    </div>
  );
}
function CompleteSystemLogDetail({ log }: { log: SystemLogDetail }) {
  return (
    <div className="space-y-5">
      <DetailSection title="Event overview" icon={Info}>
        <Detail label="Recorded at" value={formatTime(log.createdAt)} />
        <Detail label="Source" value={log.source ?? "Application"} />
        <Detail label="Resource ID" value={log.resourceId ?? "Not recorded"} />
      </DetailSection>
      <DetailSection title="Actor and request context" icon={User}>
        <Detail label="Actor" value={log.actor?.name ?? "Unknown actor"} />
        <Detail label="Actor type" value={humanize(log.actorType)} />
        <Detail
          label="Role"
          value={log.actor?.role ? humanize(log.actor.role) : "Not applicable"}
        />
        <Detail label="User ID" value={log.actorUserId ?? "Not applicable"} />
        <Detail
          label="API key ID"
          value={log.actorApiKeyId ?? "Not applicable"}
        />
        <Detail
          label="API key prefix"
          value={log.actor?.keyPrefix ?? "Not applicable"}
        />
        <Detail label="IP address" value={log.sourceIp ?? "Not recorded"} />
        <Detail label="User agent" value={log.userAgent ?? "Not recorded"} />
      </DetailSection>
      <div className="space-y-3">
        <div className="flex items-start gap-2 border-b border-border pb-2">
          <GitBranch className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
          <h3 className="text-sm font-semibold">Recorded changes</h3>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <JsonSnapshot label="Before" value={log.beforeData} />
          <JsonSnapshot label="After" value={log.afterData} />
        </div>
      </div>
      <DetailSection title="Integrity chain" icon={Shield}>
        <Detail label="Log ID" value={log.id} />
        <Detail
          label="Previous record hash"
          value={log.previousHash ?? "First record in chain"}
        />
        <Detail label="Record hash" value={log.recordHash} />
      </DetailSection>
    </div>
  );
}
function DetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 border-b border-border pb-2">
        <Icon className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <dl className="border-border bg-neutral-soft/30 grid gap-x-6 gap-y-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </dl>
    </div>
  );
}
function JsonSnapshot({ label, value }: { label: string; value: unknown }) {
  const content = value === null ? null : JSON.stringify(value, null, 2);
  return (
    <div className="border-border min-w-0 rounded-lg border">
      <h4 className="border-border bg-neutral-soft/50 border-b px-3 py-2 text-xs font-semibold uppercase">
        {label}
      </h4>
      {content ? (
        <pre className="max-h-72 overflow-auto p-3 font-mono text-xs break-all whitespace-pre-wrap">
          {content}
        </pre>
      ) : (
        <p className="text-muted p-3 text-sm">No state was recorded.</p>
      )}
    </div>
  );
}
function SystemLogDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading system log details"
      className="space-y-4"
      role="status"
    >
      <span className="sr-only">Loading system log details</span>
      {Array.from({ length: 2 }, (_, section) => (
        <div className="border-border rounded-lg border p-4" key={section}>
          <Skeleton className="mb-4 h-4 w-36" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, item) => (
              <div className="space-y-2" key={item}>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
function parseNativeDate(value: string, endOfDay: boolean) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0,
  );
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return null;
  return date;
}
function formatNativeDate(value: string) {
  const [year = "", month = "", day = ""] = value.split("-");
  return `${day}/${month}/${year}`;
}
function humanize(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
