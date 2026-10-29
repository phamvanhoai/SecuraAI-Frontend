"use client";

import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Copy,
  Eye,
  Globe,
  Hash,
  Search,
  Server,
  ShieldCheck,
  User,
  X,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
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
import { useUserActivityAudit } from "../hooks/use-user-activity-audit";
import type {
  AuditOutcome,
  UserActivityAuditRecord,
} from "../schemas/user-activity-audit-schema";

export function UserActivityAuditLogManager() {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [outcome, setOutcome] = useState<"all" | AuditOutcome>("all");
  const [resourceType, setResourceType] = useState("");
  const [selected, setSelected] = useState<UserActivityAuditRecord | null>(
    null,
  );
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const toast = useToast();
  const dialog = useRef<HTMLDialogElement>(null);
  const audit = useUserActivityAudit({
    page,
    limit: 20,
    ...(search ? { q: search } : {}),
    ...(outcome !== "all" ? { outcome } : {}),
    ...(resourceType ? { resourceType } : {}),
  });
  const clear = () => {
    setDraft("");
    setSearch("");
    setOutcome("all");
    setResourceType("");
    setPage(1);
  };
  const handleCopy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(key);
      setTimeout(() => setCopiedField((current) => current === key ? null : current), 2000);
    } catch {
      toast.error("Unable to copy", "Select and copy the value manually.");
    }
  };

  const columns: readonly DataTableColumn<UserActivityAuditRecord>[] = [
    {
      key: "actor",
      header: "Actor",
      cell: (record) => (
        <div className="min-w-40">
          <p className="font-medium">{record.actor.name}</p>
          <p className="text-muted mt-0.5 text-xs">
            {record.actor.email ?? "Email unavailable"}
          </p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (record) => (
        <span className="font-mono text-xs font-semibold">{record.action}</span>
      ),
    },
    {
      key: "resource",
      header: "Affected resource",
      cell: (record) => (
        <div className="min-w-40">
          <p className="font-medium">{resourceLabel(record)}</p>
          <p className="text-muted mt-0.5 text-xs">
            {formatResourceType(record.resource.type)}
          </p>
        </div>
      ),
    },
    {
      key: "time",
      header: "Timestamp",
      cell: (record) => (
        <time className="whitespace-nowrap" dateTime={record.occurredAt}>
          {formatTime(record.occurredAt)}
        </time>
      ),
    },
    {
      key: "outcome",
      header: "Outcome",
      cell: (record) => <OutcomeBadge outcome={record.outcome} />,
    },
    {
      key: "actions",
      header: "Actions",
      cell: (record) => (
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setSelected(record);
            dialog.current?.showModal();
          }}
        >
          <Eye aria-hidden="true" className="size-4" />
          View
        </Button>
      ),
    },
  ];
  const filtered = Boolean(search || outcome !== "all" || resourceType);

  return (
    <>
      <ProductPanel
        title="User activity records"
        description={
          audit.data
            ? `${audit.data.pagination.total} audit records found`
            : "Loading audit records"
        }
      >
        <div className="border-border flex flex-wrap items-end gap-3 border-b p-4">
          <form
            className="flex min-w-[220px] flex-1 gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(draft.trim());
              setPage(1);
            }}
          >
            <Label className="relative flex-1" htmlFor="audit-search">
              <span className="sr-only">
                Search user activity audit records
              </span>
              <Search
                aria-hidden="true"
                className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
              <Input
                id="audit-search"
                className="pl-9"
                maxLength={100}
                placeholder="Actor, action, or resource"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
            </Label>
            <Button type="submit">Search</Button>
          </form>
          <Select
            aria-label="Filter by outcome"
            className="w-40"
            value={outcome}
            onChange={(event) => {
              setOutcome(event.target.value as "all" | AuditOutcome);
              setPage(1);
            }}
          >
            <option value="all">All outcomes</option>
            <option value="SUCCESS">Success</option>
            <option value="DENIED">Denied</option>
            <option value="FAILURE">Failure</option>
          </Select>
          <Label className="w-48" htmlFor="audit-resource-type">
            <span className="sr-only">Resource type</span>
            <Input
              id="audit-resource-type"
              maxLength={100}
              placeholder="Resource type"
              value={resourceType}
              onChange={(event) => {
                setResourceType(event.target.value);
                setPage(1);
              }}
            />
          </Label>
          {filtered ? (
            <Button type="button" variant="secondary" onClick={clear}>
              <X aria-hidden="true" className="size-4" />
              Clear
            </Button>
          ) : null}
        </div>
        <div className="p-4">
          {audit.isPending ? (
            <div
              aria-label="Loading user activity records"
              className="bg-neutral-soft h-72 animate-pulse rounded-xl"
            />
          ) : audit.isError ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              Unable to load audit records. Retry the request.
            </Alert>
          ) : audit.data.items.length ? (
            <DataTable
              columns={columns}
              rows={audit.data.items}
              getRowKey={(record) => record.id}
            />
          ) : (
            <div className="py-12 text-center">
              <ShieldCheck
                aria-hidden="true"
                className="text-muted mx-auto size-7"
              />
              <p className="mt-3 font-medium">
                No audit records match your filters
              </p>
              <Button
                className="mt-3"
                type="button"
                variant="secondary"
                onClick={clear}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
        <div className="border-border border-t p-4">
          <Pagination
            page={audit.data?.pagination.page ?? page}
            pageCount={audit.data?.pagination.pageCount ?? 1}
            onPageChange={setPage}
          />
        </div>
      </ProductPanel>
      <Dialog
        className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
        dialogRef={dialog}
        title="Audit record details"
      >
        {selected ? (
          <div className="space-y-6">

            {/* ── Rich header ── */}
            <div className="border-border flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-foreground break-all font-mono text-xl font-semibold">
                    {selected.action}
                  </h3>
                  <OutcomeBadge outcome={selected.outcome} />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Hash className="size-3 shrink-0" strokeWidth={1.8} />
                    {selected.id}
                    <button
                      type="button"
                      className="text-muted hover:text-foreground p-0.5 transition-colors"
                      onClick={() => handleCopy(selected.id, "record-id")}
                      title="Copy record ID"
                    >
                      {copiedField === "record-id" ? (
                        <Check className="size-3 text-success" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  </span>
                </div>
              </div>
              {selected.outcome === "SUCCESS" ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-success/30 bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
                  <ShieldCheck className="size-3.5" strokeWidth={1.8} />
                    Successful
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-danger/30 bg-danger-soft px-2.5 py-1 text-xs font-semibold text-danger">
                  <AlertTriangle className="size-3.5" strokeWidth={1.8} />
                  {selected.outcome === "DENIED" ? "Access Denied" : "Failed"}
                </span>
              )}
            </div>

            {/* ── Timestamp / context bar ── */}
            <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border p-3.5 text-xs">
              <span className="inline-flex items-center gap-1.5 text-muted">
                <Zap className="size-3.5 shrink-0 text-brand" strokeWidth={1.8} />
                <span>
                  Occurred:{" "}
                  <strong className="text-foreground font-semibold">
                    {formatTime(selected.occurredAt)}
                  </strong>
                </span>
              </span>
              {selected.source ? (
                <>
                  <span className="text-border hidden sm:inline">·</span>
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <Globe className="size-3.5 shrink-0" strokeWidth={1.8} />
                    <span>
                      Source:{" "}
                      <strong className="text-foreground font-semibold">
                        {selected.source}
                      </strong>
                    </span>
                  </span>
                </>
              ) : null}
              {selected.sourceIp ? (
                <>
                  <span className="text-border hidden sm:inline">·</span>
                  <span className="inline-flex items-center gap-1.5 font-mono text-muted">
                    <span>IP:</span>
                    <strong className="text-foreground">{selected.sourceIp}</strong>
                  </span>
                </>
              ) : null}
            </div>

            {/* ── 2-col: Actor + Resource ── */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              {/* Actor */}
              <div className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <User className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
                  <h3 className="text-sm font-semibold">Actor Information</h3>
                </div>
                <dl className="border-border bg-neutral-soft/30 grid gap-y-4 rounded-xl border p-4">
                  <div>
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide">Name</dt>
                    <dd className="mt-1 truncate text-sm font-medium">{selected.actor.name}</dd>
                  </div>
                  {selected.actor.email ? (
                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide">Email</dt>
                      <dd className="mt-1 truncate text-sm font-medium">{selected.actor.email}</dd>
                    </div>
                  ) : null}
                  {selected.actor.id ? (
                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide">User ID</dt>
                      <dd className="mt-1 flex items-center gap-1.5 font-mono text-xs text-muted truncate" title={selected.actor.id}>
                        <span className="truncate">{selected.actor.id}</span>
                        <button
                          type="button"
                          className="text-muted hover:text-foreground shrink-0 p-0.5 transition-colors"
                          onClick={() => handleCopy(selected.actor.id ?? "", "actor-id")}
                          title="Copy user ID"
                        >
                          {copiedField === "actor-id" ? (
                            <Check className="size-3 text-success" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide">Timestamp</dt>
                    <dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium">
                      <Calendar className="size-3.5 shrink-0 text-muted" strokeWidth={1.8} />
                      {formatTime(selected.occurredAt)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Resource */}
              <div className="space-y-3">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <Server className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
                  <h3 className="text-sm font-semibold">Resource &amp; Context</h3>
                </div>
                <dl className="border-border bg-neutral-soft/30 grid gap-y-4 rounded-xl border p-4">
                  <div>
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide">Resource Type</dt>
                    <dd className="mt-1">
                      <span className="bg-neutral-soft border-border rounded border px-2 py-0.5 font-mono text-xs font-semibold">
                        {selected.resource.type}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide">Affected Resource</dt>
                    <dd className="mt-1 text-sm font-medium">{resourceLabel(selected)}</dd>
                  </div>
                  {selected.resource.id ? (
                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide">Resource ID</dt>
                      <dd className="mt-1 flex items-center gap-1.5 font-mono text-xs text-muted truncate" title={selected.resource.id}>
                        <span className="truncate">{selected.resource.id}</span>
                        <button
                          type="button"
                          className="text-muted hover:text-foreground shrink-0 p-0.5 transition-colors"
                          onClick={() => handleCopy(selected.resource.id ?? "", "resource-id")}
                          title="Copy resource ID"
                        >
                          {copiedField === "resource-id" ? (
                            <Check className="size-3 text-success" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </dd>
                    </div>
                  ) : null}
                  {selected.errorCode ? (
                    <div>
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide">Error Code</dt>
                      <dd className="mt-1">
                        <span className="bg-danger-soft border-danger/20 text-danger rounded border px-2 py-0.5 font-mono text-xs font-semibold">
                          {selected.errorCode}
                        </span>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            </div>

            {/* ── Metadata footer bar ── */}
            <div className="border-border bg-neutral-soft/20 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 shrink-0" strokeWidth={1.8} />
                <span>
                  Occurred:{" "}
                  <strong className="text-foreground font-medium">
                    {formatTime(selected.occurredAt)}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono">{selected.id}</span>
              </div>
            </div>

            {/* ── Footer ── */}
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
    </>
  );
}

function OutcomeBadge({ outcome }: { outcome: AuditOutcome }) {
  return (
    <StatusBadge
      tone={
        outcome === "SUCCESS"
          ? "success"
          : outcome === "DENIED"
            ? "warning"
            : "danger"
      }
    >
      {outcome === "SUCCESS"
        ? "Success"
        : outcome === "DENIED"
          ? "Denied"
          : "Failure"}
    </StatusBadge>
  );
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatResourceType(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function resourceLabel(record: UserActivityAuditRecord) {
  if (record.resource.type === "USER_NOTIFICATION_PREFERENCES")
    return `Notification preferences · ${record.actor.name}`;
  if (record.resource.type === "USER")
    return `User account · ${record.actor.name}`;
  return formatResourceType(record.resource.type);
}
