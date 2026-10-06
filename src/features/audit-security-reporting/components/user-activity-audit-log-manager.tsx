"use client";

import { Eye, Info, Search, ShieldCheck, X } from "lucide-react";
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
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type AuditOutcome = "success" | "denied" | "failed";
type AuditRecord = {
  id: string;
  actor: string;
  actorEmail: string;
  action: string;
  module: string;
  resource: string;
  timestamp: string;
  outcome: AuditOutcome;
  sourceIp: string;
  details: string;
};

const pageSize = 5;

const exampleRecords: readonly AuditRecord[] = [
  {
    id: "AUD-2026-0041",
    actor: "SecuraAI Administrator",
    actorEmail: "admin@gmail.com",
    action: "Updated user permissions",
    module: "User Management",
    resource: "User account · EMP-0024",
    timestamp: "2026-10-06T08:42:00.000Z",
    outcome: "success",
    sourceIp: "192.0.2.24",
    details: "Changed the account's assigned permission set.",
  },
  {
    id: "AUD-2026-0040",
    actor: "Security Officer",
    actorEmail: "securityofficer@gmail.com",
    action: "Confirmed alert as true positive",
    module: "AI Alerts",
    resource: "Alert · ALT-C16E63BD",
    timestamp: "2026-10-06T08:18:00.000Z",
    outcome: "success",
    sourceIp: "192.0.2.31",
    details: "Completed analyst triage and created a linked incident draft.",
  },
  {
    id: "AUD-2026-0039",
    actor: "Employee User",
    actorEmail: "employee@gmail.com",
    action: "Viewed restricted audit route",
    module: "Authorization",
    resource: "Route · /audits",
    timestamp: "2026-10-06T07:57:00.000Z",
    outcome: "denied",
    sourceIp: "192.0.2.46",
    details:
      "Access was rejected because the account did not have administrator privileges.",
  },
  {
    id: "AUD-2026-0038",
    actor: "Unknown user",
    actorEmail: "unknown@example.com",
    action: "Attempted sign-in",
    module: "Authentication",
    resource: "Account · unknown@example.com",
    timestamp: "2026-10-06T07:31:00.000Z",
    outcome: "failed",
    sourceIp: "203.0.113.42",
    details:
      "Authentication failed. No sensitive credential details were retained.",
  },
  {
    id: "AUD-2026-0037",
    actor: "SecuraAI Administrator",
    actorEmail: "admin@gmail.com",
    action: "Deactivated user account",
    module: "User Management",
    resource: "User account · EMP-0018",
    timestamp: "2026-10-06T07:12:00.000Z",
    outcome: "success",
    sourceIp: "192.0.2.24",
    details: "The account was deactivated with an administrative reason.",
  },
  {
    id: "AUD-2026-0036",
    actor: "Security Officer",
    actorEmail: "securityofficer@gmail.com",
    action: "Linked incident to asset",
    module: "Incident Management",
    resource: "Incident · INC-E628C39D70D94FF5",
    timestamp: "2026-10-06T06:48:00.000Z",
    outcome: "success",
    sourceIp: "192.0.2.31",
    details: "Associated an active IT asset with the incident investigation.",
  },
  {
    id: "AUD-2026-0035",
    actor: "Executive User",
    actorEmail: "executive@gmail.com",
    action: "Attempted policy approval",
    module: "Policy Management",
    resource: "Policy version · POL-2026-010 v2",
    timestamp: "2026-10-06T06:20:00.000Z",
    outcome: "denied",
    sourceIp: "192.0.2.52",
    details:
      "The requested policy transition was not allowed for this account.",
  },
];

export function UserActivityAuditLogManager() {
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("all");
  const [outcome, setOutcome] = useState<"all" | AuditOutcome>("all");
  const [selected, setSelected] = useState<AuditRecord | null>(null);
  const detailDialog = useRef<HTMLDialogElement>(null);
  const records = useMemo(() => {
    const term = search.toLocaleLowerCase();
    return exampleRecords.filter((record) => {
      const matchesSearch =
        !term ||
        [
          record.id,
          record.actor,
          record.actorEmail,
          record.action,
          record.resource,
        ]
          .join(" ")
          .toLocaleLowerCase()
          .includes(term);
      return (
        matchesSearch &&
        (module === "all" || record.module === module) &&
        (outcome === "all" || record.outcome === outcome)
      );
    });
  }, [module, outcome, search]);
  const pageCount = Math.max(1, Math.ceil(records.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedRecords = records.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const isFiltered = Boolean(search || module !== "all" || outcome !== "all");

  const columns: readonly DataTableColumn<AuditRecord>[] = [
    {
      key: "actor",
      header: "Actor",
      cell: (record) => (
        <div className="min-w-40">
          <p className="font-medium">{record.actor}</p>
          <p className="text-muted mt-0.5 text-xs">{record.actorEmail}</p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      cell: (record) => (
        <div className="min-w-48">
          <p className="font-medium">{record.action}</p>
          <p className="text-muted mt-0.5 text-xs">{record.module}</p>
        </div>
      ),
    },
    {
      key: "resource",
      header: "Affected resource",
      cell: (record) => (
        <span className="min-w-44 break-words">{record.resource}</span>
      ),
    },
    {
      key: "timestamp",
      header: "Timestamp",
      cell: (record) => (
        <time className="whitespace-nowrap" dateTime={record.timestamp}>
          {formatTimestamp(record.timestamp)}
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
          aria-label={`View details for ${record.id}`}
          onClick={() => {
            setSelected(record);
            detailDialog.current?.showModal();
          }}
          type="button"
          variant="secondary"
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
            UI preview for UC42. The records below are labeled examples; live
            audit retrieval will be connected when the backend API is
            implemented.
          </p>
        </div>
      </Alert>
      <ProductPanel
        title="User activity records"
        description={`${records.length} example audit records found`}
      >
        <div className="border-border flex flex-wrap items-center gap-2 border-b p-4">
          <form
            className="contents"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(searchDraft.trim());
              setPage(1);
            }}
          >
            <Label
              className="relative max-w-md min-w-[220px] flex-1"
              htmlFor="audit-search"
            >
              <span className="sr-only">Search audit records</span>
              <Search
                aria-hidden="true"
                className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
              <Input
                className="bg-background min-h-10 pl-9"
                id="audit-search"
                maxLength={100}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Search actor, action, resource, or ID"
                value={searchDraft}
              />
            </Label>
            <Select
              aria-label="Filter audit records by module"
              className="min-h-10 w-44"
              onChange={(event) => {
                setModule(event.target.value);
                setPage(1);
              }}
              value={module}
            >
              <option value="all">All modules</option>
              {[...new Set(exampleRecords.map((record) => record.module))].map(
                (item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ),
              )}
            </Select>
            <Select
              aria-label="Filter audit records by outcome"
              className="min-h-10 w-40"
              onChange={(event) => {
                setOutcome(event.target.value as "all" | AuditOutcome);
                setPage(1);
              }}
              value={outcome}
            >
              <option value="all">All outcomes</option>
              <option value="success">Success</option>
              <option value="denied">Denied</option>
              <option value="failed">Failed</option>
            </Select>
            <Button className="min-h-10" type="submit">
              Search
            </Button>
          </form>
          {isFiltered ? (
            <Button
              className="min-h-10"
              onClick={() => {
                setSearchDraft("");
                setSearch("");
                setModule("all");
                setOutcome("all");
                setPage(1);
              }}
              type="button"
              variant="secondary"
            >
              <X aria-hidden="true" className="size-4" />
              Clear
            </Button>
          ) : null}
        </div>
        <div className="p-4">
          {records.length ? (
            <DataTable
              columns={columns}
              getRowKey={(record) => record.id}
              rows={pagedRecords}
            />
          ) : (
            <div className="py-12 text-center">
              <ShieldCheck
                aria-hidden="true"
                className="text-muted mx-auto size-6"
              />
              <p className="mt-3 font-medium">
                No example records match your filters
              </p>
              <p className="text-muted mt-1 text-sm">
                Change or clear the filters to view other records.
              </p>
            </div>
          )}
        </div>
        <div className="border-border border-t p-4">
          <Pagination
            onPageChange={setPage}
            page={currentPage}
            pageCount={pageCount}
          />
        </div>
      </ProductPanel>
      <Dialog
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        dialogRef={detailDialog}
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
                value={`${selected.actor} · ${selected.actorEmail}`}
              />
              <Detail
                label="Timestamp"
                value={formatTimestamp(selected.timestamp)}
              />
              <Detail label="Action" value={selected.action} />
              <Detail label="Module" value={selected.module} />
              <Detail label="Affected resource" value={selected.resource} />
              <Detail label="Source IP" value={selected.sourceIp} />
              <div className="sm:col-span-2">
                <Detail label="Details" value={selected.details} />
              </div>
            </dl>
            <div className="flex justify-end">
              <Button
                onClick={() => detailDialog.current?.close()}
                type="button"
                variant="secondary"
              >
                <X aria-hidden="true" className="size-4" />
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
        outcome === "success"
          ? "success"
          : outcome === "denied"
            ? "warning"
            : "danger"
      }
    >
      {outcome === "success"
        ? "Success"
        : outcome === "denied"
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
      <dd className="mt-1 text-sm leading-6 break-words">{value}</dd>
    </div>
  );
}

function formatTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}
