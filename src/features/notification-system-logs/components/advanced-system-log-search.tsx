"use client";

import {
  CalendarDays,
  Download,
  Eye,
  Filter,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useRef, useState, type ComponentProps } from "react";
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
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useSystemLogSearch } from "../hooks/use-system-log-search";
import type {
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
  const dialog = useRef<HTMLDialogElement>(null);
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
                  disabled
                  title="Export is implemented in UC43"
                >
                  <Download aria-hidden="true" className="size-4" />
                  Export logs
                </Button>
              ) : null}
            </div>
          </div>
          {advanced ? (
            <div className="border-border bg-neutral-soft/40 grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-5">
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
            <div
              aria-label="Loading system logs"
              className="bg-neutral-soft h-64 animate-pulse rounded-lg"
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
                Clear filters
              </Button>
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
      <Dialog dialogRef={dialog} title="System log details">
        {selected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-sm font-semibold">
                {selected.eventType}
              </span>
              <LogStatusBadge status={selected.status} />
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail
                label="Timestamp"
                value={formatTime(selected.occurredAt)}
              />
              <Detail label="Source" value={selected.source} />
              <Detail
                label="Actor"
                value={
                  selected.actorDetail
                    ? `${selected.actor} · ${selected.actorDetail}`
                    : selected.actor
                }
              />
              <Detail
                label="Resource"
                value={humanize(selected.resourceType)}
              />
              <Detail
                label="Correlation ID"
                value={selected.correlationId ?? "Not recorded"}
              />
              <Detail label="Error code" value={selected.errorCode ?? "None"} />
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
