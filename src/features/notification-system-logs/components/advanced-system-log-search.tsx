"use client";

import {
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Filter,
  Info,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";

type LogStatus = "processed" | "pending" | "failed";
type SystemLog = {
  id: string;
  occurredAt: string;
  eventType: string;
  source: string;
  actor: string;
  status: LogStatus;
  message: string;
  correlationId: string;
};
const pageSize = 5;
const sampleLogs: readonly SystemLog[] = [
  {
    id: "LOG-1047",
    occurredAt: "2026-10-06T09:42:00Z",
    eventType: "AUTH_LOGIN_SUCCESS",
    source: "Authentication API",
    actor: "admin@gmail.com",
    status: "processed",
    message: "Administrator session established.",
    correlationId: "COR-A81F",
  },
  {
    id: "LOG-1046",
    occurredAt: "2026-10-06T09:35:00Z",
    eventType: "NOTIFICATION_QUEUED",
    source: "Notification Service",
    actor: "admin@gmail.com",
    status: "pending",
    message: "Notification accepted for asynchronous processing.",
    correlationId: "COR-B24C",
  },
  {
    id: "LOG-1045",
    occurredAt: "2026-10-06T09:18:00Z",
    eventType: "ALERT_TRIAGE_STARTED",
    source: "AI Alert Service",
    actor: "securityofficer@gmail.com",
    status: "processed",
    message: "Analyst triage workflow started.",
    correlationId: "COR-C16E",
  },
  {
    id: "LOG-1044",
    occurredAt: "2026-10-06T08:57:00Z",
    eventType: "EMAIL_DELIVERY_FAILED",
    source: "Email Gateway",
    actor: "system",
    status: "failed",
    message: "Email gateway rejected the delivery request.",
    correlationId: "COR-D73A",
  },
  {
    id: "LOG-1043",
    occurredAt: "2026-10-06T08:31:00Z",
    eventType: "EVENT_IMPORT_COMPLETED",
    source: "Event Ingestion",
    actor: "securityofficer@gmail.com",
    status: "processed",
    message: "Normalized event batch processing completed.",
    correlationId: "COR-E91B",
  },
  {
    id: "LOG-1042",
    occurredAt: "2026-10-05T16:22:00Z",
    eventType: "RISK_REVIEW_UPDATED",
    source: "Risk Service",
    actor: "employee@gmail.com",
    status: "processed",
    message: "Risk reassessment review state updated.",
    correlationId: "COR-F42D",
  },
  {
    id: "LOG-1041",
    occurredAt: "2026-10-05T15:08:00Z",
    eventType: "POLICY_PUBLISH_REQUEST",
    source: "Policy Service",
    actor: "admin@gmail.com",
    status: "pending",
    message: "Policy publication request queued.",
    correlationId: "COR-G19A",
  },
];

export function AdvancedSystemLogSearch({ canExport }: { canExport: boolean }) {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [eventType, setEventType] = useState("all");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState<"all" | LogStatus>("all");
  const [actor, setActor] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [selected, setSelected] = useState<SystemLog | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [exportScope, setExportScope] = useState<"selected" | "filtered">(
    "selected",
  );
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [exportReason, setExportReason] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const exportDialog = useRef<HTMLDialogElement>(null);
  const filtered = useMemo(
    () =>
      sampleLogs.filter((log) => {
        const text = query.toLowerCase();
        return (
          (!text ||
            `${log.id} ${log.message} ${log.correlationId}`
              .toLowerCase()
              .includes(text)) &&
          (eventType === "all" || log.eventType === eventType) &&
          (source === "all" || log.source === source) &&
          (status === "all" || log.status === status) &&
          (!actor || log.actor.toLowerCase().includes(actor.toLowerCase())) &&
          (!from || log.occurredAt.slice(0, 10) >= from) &&
          (!to || log.occurredAt.slice(0, 10) <= to)
        );
      }),
    [actor, eventType, from, query, source, status, to],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const activeCount = [
    query,
    eventType !== "all",
    source !== "all",
    status !== "all",
    actor,
    from || to,
  ].filter(Boolean).length;
  const reset = () => {
    setDraft("");
    setQuery("");
    setEventType("all");
    setSource("all");
    setStatus("all");
    setActor("");
    setFrom("");
    setTo("");
    setPage(1);
    setSelectedIds([]);
  };
  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };
  const pageIds = rows.map((log) => log.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
  const columns: readonly DataTableColumn<SystemLog>[] = [
    {
      key: "select",
      header: "Select",
      cell: (log) => (
        <Checkbox
          aria-label={`Select ${log.id} for export`}
          checked={selectedIds.includes(log.id)}
          disabled={!canExport}
          onChange={() => toggleSelected(log.id)}
        />
      ),
    },
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
          <p className="text-muted mt-1 text-xs">{log.id}</p>
        </div>
      ),
    },
    { key: "source", header: "Source", cell: (log) => log.source },
    {
      key: "actor",
      header: "Actor",
      cell: (log) => <span className="break-words">{log.actor}</span>,
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
          variant="secondary"
          type="button"
          onClick={() => {
            setSelected(log);
            dialog.current?.showModal();
          }}
        >
          <Eye aria-hidden="true" className="size-4" />
          View
        </Button>
      ),
    },
  ];
  return (
    <>
      <Alert className="border-info/25 bg-info-soft text-info">
        <div className="flex items-start gap-2">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>
            UI preview for UC43. These are labeled example logs; live
            permission-scoped search will be connected when the backend System
            Log API is implemented.
          </p>
        </div>
      </Alert>
      <ProductPanel
        title="System log search"
        description={`${filtered.length} example logs match the current criteria`}
      >
        <div className="border-border space-y-3 border-b p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <form
              className="flex min-w-0 flex-1 gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setQuery(draft.trim());
                setPage(1);
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
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Message, log ID, or correlation ID"
                />
              </Label>
              <Button type="submit">Search</Button>
            </form>
            <div className="flex flex-wrap gap-2">
              <Select
                aria-label="Event type"
                className="w-48"
                value={eventType}
                onChange={(e) => {
                  setEventType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All event types</option>
                {[...new Set(sampleLogs.map((log) => log.eventType))].map(
                  (value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ),
                )}
              </Select>
              <Select
                aria-label="Log source"
                className="w-44"
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all">All sources</option>
                {[...new Set(sampleLogs.map((log) => log.source))].map(
                  (value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ),
                )}
              </Select>
              <Select
                aria-label="Processing status"
                className="w-40"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value as "all" | LogStatus);
                  setPage(1);
                }}
              >
                <option value="all">All statuses</option>
                <option value="processed">Processed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
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
                {advanced ? (
                  <ChevronUp aria-hidden="true" className="size-3" />
                ) : (
                  <ChevronDown aria-hidden="true" className="size-3" />
                )}
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
                  onClick={() => exportDialog.current?.showModal()}
                >
                  <Download aria-hidden="true" className="size-4" />
                  Export logs
                </Button>
              ) : null}
            </div>
          </div>
          {advanced ? (
            <div className="border-border bg-neutral-soft/40 grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
              <Label className="space-y-1" htmlFor="log-actor">
                <span className="text-xs font-medium">Actor</span>
                <Input
                  id="log-actor"
                  value={actor}
                  onChange={(e) => {
                    setActor(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Email or system"
                />
              </Label>
              <Label className="space-y-1" htmlFor="log-from">
                <span className="text-xs font-medium">From date</span>
                <Input
                  id="log-from"
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setPage(1);
                  }}
                />
              </Label>
              <Label className="space-y-1" htmlFor="log-to">
                <span className="text-xs font-medium">To date</span>
                <Input
                  id="log-to"
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setPage(1);
                  }}
                />
              </Label>
            </div>
          ) : null}
        </div>
        <div className="p-4">
          {canExport && rows.length ? (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={allPageSelected}
                  onChange={() =>
                    setSelectedIds((current) =>
                      allPageSelected
                        ? current.filter((id) => !pageIds.includes(id))
                        : [...new Set([...current, ...pageIds])],
                    )
                  }
                />
                Select all logs on this page
              </label>
              <span className="text-muted text-sm tabular-nums">
                {selectedIds.length} selected for export
              </span>
            </div>
          ) : null}
          {rows.length ? (
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(log) => log.id}
            />
          ) : (
            <div className="py-12 text-center">
              <Search
                aria-hidden="true"
                className="text-muted mx-auto size-7"
              />
              <p className="mt-3 font-medium">
                No logs match the current criteria
              </p>
              <Button
                className="mt-3"
                type="button"
                variant="secondary"
                onClick={reset}
              >
                <X aria-hidden="true" className="size-4" />
                Clear filters
              </Button>
            </div>
          )}
        </div>
        <div className="border-border border-t p-4">
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        </div>
      </ProductPanel>
      <Dialog dialogRef={dialog} title="System log details">
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-sm font-semibold">
                {selected.id}
              </span>
              <LogStatusBadge status={selected.status} />
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail
                label="Timestamp"
                value={formatTime(selected.occurredAt)}
              />
              <Detail label="Event type" value={selected.eventType} />
              <Detail label="Source" value={selected.source} />
              <Detail label="Actor" value={selected.actor} />
              <Detail label="Correlation ID" value={selected.correlationId} />
              <div className="sm:col-span-2">
                <Detail label="Message" value={selected.message} />
              </div>
            </dl>
            <div className="flex justify-end">
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
      <Dialog
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        dialogRef={exportDialog}
        title="Export Investigation Logs"
      >
        <div className="space-y-5">
          <Alert className="border-info/25 bg-info-soft text-info">
            Export generation is a UC44 UI preview. No file will be generated
            until the backend export API is available.
          </Alert>
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Export scope</legend>
            <label className="border-border flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <input
                checked={exportScope === "selected"}
                name="export-scope"
                onChange={() => setExportScope("selected")}
                type="radio"
              />
              <span>
                <span className="block text-sm font-medium">Selected logs</span>
                <span className="text-muted mt-1 block text-xs">
                  {selectedIds.length} manually selected records
                </span>
              </span>
            </label>
            <label className="border-border flex cursor-pointer items-start gap-3 rounded-lg border p-3">
              <input
                checked={exportScope === "filtered"}
                name="export-scope"
                onChange={() => setExportScope("filtered")}
                type="radio"
              />
              <span>
                <span className="block text-sm font-medium">
                  All matching results
                </span>
                <span className="text-muted mt-1 block text-xs">
                  {filtered.length} records matching the current filters
                </span>
              </span>
            </label>
          </fieldset>
          <Label className="space-y-1.5" htmlFor="export-format">
            <span className="text-sm font-medium">File format</span>
            <Select
              id="export-format"
              value={exportFormat}
              onChange={(event) =>
                setExportFormat(event.target.value as "csv" | "json")
              }
            >
              <option value="csv">CSV — spreadsheet analysis</option>
              <option value="json">JSON — technical investigation</option>
            </Select>
          </Label>
          <Label className="space-y-1.5" htmlFor="export-reason">
            <span className="text-sm font-medium">Investigation purpose</span>
            <Textarea
              id="export-reason"
              className="min-h-24"
              maxLength={500}
              value={exportReason}
              onChange={(event) => setExportReason(event.target.value)}
              placeholder="Explain why these logs are being exported"
            />
            <span className="text-muted block text-xs">
              Required for export traceability · {exportReason.length}/500
            </span>
          </Label>
          <div className="bg-neutral-soft border-border rounded-lg border p-3 text-sm">
            <p className="font-medium">Export summary</p>
            <p className="text-muted mt-1">
              {exportScope === "selected"
                ? selectedIds.length
                : filtered.length}{" "}
              records · {exportFormat.toUpperCase()} · current permission scope
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => exportDialog.current?.close()}
            >
              Cancel
            </Button>
            <Button type="button" disabled>
              Generate export
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

function LogStatusBadge({ status }: { status: LogStatus }) {
  return (
    <StatusBadge
      tone={
        status === "processed"
          ? "success"
          : status === "pending"
            ? "warning"
            : "danger"
      }
    >
      {status === "processed"
        ? "Processed"
        : status === "pending"
          ? "Pending"
          : "Failed"}
    </StatusBadge>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm break-words">{value}</dd>
    </div>
  );
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}
