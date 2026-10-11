"use client";

import { Eye, Search, ShieldCheck, X } from "lucide-react";
import { useRef, useState } from "react";
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
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        dialogRef={dialog}
        title="Audit record details"
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-sm font-semibold">
                {selected.id}
              </span>
              <OutcomeBadge outcome={selected.outcome} />
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail
                label="Actor"
                value={`${selected.actor.name}${selected.actor.email ? ` · ${selected.actor.email}` : ""}`}
              />
              <Detail
                label="Timestamp"
                value={formatTime(selected.occurredAt)}
              />
              <Detail label="Action" value={selected.action} />
              <Detail
                label="Affected resource"
                value={resourceLabel(selected)}
              />
              <Detail
                label="Source"
                value={selected.source ?? "Not recorded"}
              />
              <Detail
                label="Source IP"
                value={selected.sourceIp ?? "Not recorded"}
              />
              {selected.errorCode ? (
                <Detail label="Error code" value={selected.errorCode} />
              ) : null}
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
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm leading-6 break-words">{value}</dd>
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
