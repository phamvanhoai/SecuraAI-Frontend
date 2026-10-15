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

type AuditType = "user_action" | "configuration_change" | "system_access";
type AuditOutcome = "success" | "denied" | "failed";
type AuditListRecord = {
  id: string;
  correlationId: string;
  type: AuditType;
  activity: string;
  actor: string;
  resource: string;
  timestamp: string;
  outcome: AuditOutcome;
  details: string;
  requestContext: {
    requestId: string;
    method: string;
    path: string;
    sourceIp: string;
    userAgent: string;
  };
  parameters: readonly { name: string; value: string }[];
  changes?: readonly {
    property: string;
    before: string;
    after: string;
  }[];
};
const pageSize = 5;
const records: readonly AuditListRecord[] = [
  {
    id: "AUD-2026-0050",
    correlationId: "COR-THRESHOLD-7F2A",
    type: "configuration_change",
    activity: "Changed default anomaly threshold",
    actor: "admin@gmail.com",
    resource: "AI model configuration",
    timestamp: "2026-10-06T09:26:00Z",
    outcome: "success",
    details: "Default threshold changed from 0.80 to 0.85.",
    requestContext: {
      requestId: "REQ-85F1A2",
      method: "PATCH",
      path: "/api/v1/ai-models/deployed/threshold",
      sourceIp: "10.20.4.18",
      userAgent: "Chrome 141 / Windows 11",
    },
    parameters: [
      { name: "previousThreshold", value: "0.80" },
      { name: "newThreshold", value: "0.85" },
    ],
    changes: [
      {
        property: "Default anomaly threshold",
        before: "0.80",
        after: "0.85",
      },
      {
        property: "Updated by",
        before: "securityofficer@gmail.com",
        after: "admin@gmail.com",
      },
    ],
  },
  {
    id: "AUD-2026-0049",
    correlationId: "COR-LOGIN-91C4",
    type: "system_access",
    activity: "Administrator login",
    actor: "admin@gmail.com",
    resource: "Administrative console",
    timestamp: "2026-10-06T09:12:00Z",
    outcome: "success",
    details:
      "Administrator session established after successful authentication.",
    requestContext: {
      requestId: "REQ-219BA4",
      method: "POST",
      path: "/api/v1/auth/login",
      sourceIp: "10.20.4.18",
      userAgent: "Chrome 141 / Windows 11",
    },
    parameters: [{ name: "authenticationMethod", value: "Password" }],
  },
  {
    id: "AUD-2026-0048",
    correlationId: "COR-TRIAGE-C16E",
    type: "user_action",
    activity: "Confirmed alert as true positive",
    actor: "securityofficer@gmail.com",
    resource: "Alert · ALT-C16E63BD",
    timestamp: "2026-10-06T08:18:00Z",
    outcome: "success",
    details: "Analyst triage completed and an incident draft was created.",
    requestContext: {
      requestId: "REQ-C16E63",
      method: "POST",
      path: "/api/v1/ai-alerts/ALT-C16E63BD/confirm-incident",
      sourceIp: "10.20.7.31",
      userAgent: "Edge 141 / Windows 11",
    },
    parameters: [
      { name: "alertId", value: "ALT-C16E63BD" },
      { name: "classification", value: "TRUE_POSITIVE" },
    ],
  },
  {
    id: "AUD-2026-0047",
    correlationId: "COR-ACCESS-18D0",
    type: "system_access",
    activity: "Attempted restricted route access",
    actor: "employee@gmail.com",
    resource: "Route · /audits",
    timestamp: "2026-10-06T07:57:00Z",
    outcome: "denied",
    details: "Access denied because the account was not an administrator.",
    requestContext: {
      requestId: "REQ-A88D10",
      method: "GET",
      path: "/audits",
      sourceIp: "10.20.9.44",
      userAgent: "Firefox 143 / Ubuntu",
    },
    parameters: [{ name: "requiredCapability", value: "audits.read" }],
  },
  {
    id: "AUD-2026-0046",
    correlationId: "COR-SESSION-4B21",
    type: "configuration_change",
    activity: "Changed session inactivity timeout",
    actor: "admin@gmail.com",
    resource: "Authentication settings",
    timestamp: "2026-10-06T07:40:00Z",
    outcome: "success",
    details: "Session inactivity timeout changed from 30 to 20 minutes.",
    requestContext: {
      requestId: "REQ-0D42BE",
      method: "PATCH",
      path: "/api/v1/system-settings/session",
      sourceIp: "10.20.4.18",
      userAgent: "Chrome 141 / Windows 11",
    },
    parameters: [{ name: "inactivityTimeoutMinutes", value: "20" }],
    changes: [
      {
        property: "Session inactivity timeout",
        before: "30 minutes",
        after: "20 minutes",
      },
    ],
  },
  {
    id: "AUD-2026-0045",
    correlationId: "COR-LOGIN-6E33",
    type: "system_access",
    activity: "Failed login attempt",
    actor: "unknown@example.com",
    resource: "Authentication endpoint",
    timestamp: "2026-10-06T07:31:00Z",
    outcome: "failed",
    details: "Authentication failed; credential contents were not retained.",
    requestContext: {
      requestId: "REQ-713EC0",
      method: "POST",
      path: "/api/v1/auth/login",
      sourceIp: "203.0.113.42",
      userAgent: "Chrome 140 / macOS",
    },
    parameters: [
      { name: "email", value: "unknown@example.com" },
      { name: "password", value: "[REDACTED]" },
    ],
  },
  {
    id: "AUD-2026-0044",
    correlationId: "COR-USER-2A90",
    type: "user_action",
    activity: "Deactivated user account",
    actor: "admin@gmail.com",
    resource: "User · EMP-0018",
    timestamp: "2026-10-06T07:12:00Z",
    outcome: "success",
    details:
      "The account was deactivated with a recorded administrative reason.",
    requestContext: {
      requestId: "REQ-62B17F",
      method: "PATCH",
      path: "/api/v1/users/EMP-0018/deactivate",
      sourceIp: "10.20.4.18",
      userAgent: "Chrome 141 / Windows 11",
    },
    parameters: [
      { name: "userId", value: "EMP-0018" },
      { name: "reason", value: "Employment ended" },
    ],
    changes: [
      { property: "Account status", before: "Active", after: "Deactivated" },
      {
        property: "Deactivation reason",
        before: "Not recorded",
        after: "Employment ended",
      },
    ],
  },
];

export function AuditLogListManager() {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<"all" | AuditType>("all");
  const [outcome, setOutcome] = useState<"all" | AuditOutcome>("all");
  const [correlationId, setCorrelationId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selected, setSelected] = useState<AuditListRecord | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const filtered = useMemo(
    () =>
      records.filter((record) => {
        const term = query.toLowerCase();
        return (
          (!term ||
            `${record.id} ${record.activity} ${record.actor} ${record.resource}`
              .toLowerCase()
              .includes(term)) &&
          (type === "all" || record.type === type) &&
          (outcome === "all" || record.outcome === outcome) &&
          (!correlationId ||
            record.correlationId
              .toLowerCase()
              .includes(correlationId.toLowerCase())) &&
          (!fromDate || record.timestamp >= `${fromDate}T00:00:00Z`) &&
          (!toDate || record.timestamp <= `${toDate}T23:59:59Z`)
        );
      }),
    [correlationId, fromDate, outcome, query, toDate, type],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const isFiltered = Boolean(
    query ||
      type !== "all" ||
      outcome !== "all" ||
      correlationId ||
      fromDate ||
      toDate,
  );
  const columns: readonly DataTableColumn<AuditListRecord>[] = [
    {
      key: "activity",
      header: "Activity",
      cell: (record) => (
        <div className="min-w-52">
          <p className="font-medium">{record.activity}</p>
          <p className="text-muted mt-1 font-mono text-xs">{record.id}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Record type",
      cell: (record) => (
        <StatusBadge
          tone={
            record.type === "system_access"
              ? "warning"
              : record.type === "configuration_change"
                ? "info"
                : "neutral"
          }
        >
          {typeLabel(record.type)}
        </StatusBadge>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      cell: (record) => <span className="break-words">{record.actor}</span>,
    },
    {
      key: "resource",
      header: "Affected resource",
      cell: (record) => record.resource,
    },
    {
      key: "timestamp",
      header: "Timestamp",
      cell: (record) => (
        <time className="whitespace-nowrap" dateTime={record.timestamp}>
          {formatTime(record.timestamp)}
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
  const clear = () => {
    setDraft("");
    setQuery("");
    setType("all");
    setOutcome("all");
    setCorrelationId("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };
  return (
    <>
      <Alert className="border-info/25 bg-info-soft text-info">
        <div className="flex items-start gap-2">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>
            UI preview for UC78–UC81. These are labeled example records; the
            consolidated audit-list, filtering, detail, and change-comparison
            APIs will be connected when their backend contracts are
            implemented.
          </p>
        </div>
      </Alert>
      <ProductPanel
        title="Audit log list"
        description={`${filtered.length} example audit records found`}
      >
        <div className="border-border border-b p-4">
          <form
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(draft.trim());
              setPage(1);
            }}
          >
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="audit-list-search">Actor, action or resource</Label>
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <Input
                  className="min-h-10 pl-9"
                  id="audit-list-search"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Search actor, action, resource, or audit ID"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audit-correlation-id">Correlation ID</Label>
              <Input
                id="audit-correlation-id"
                value={correlationId}
                onChange={(event) => {
                  setCorrelationId(event.target.value);
                  setPage(1);
                }}
                placeholder="e.g. COR-LOGIN-91C4"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audit-record-type">Action type</Label>
              <Select
                id="audit-record-type"
                value={type}
                onChange={(event) => {
                  setType(event.target.value as "all" | AuditType);
                  setPage(1);
                }}
              >
                <option value="all">All action types</option>
                <option value="user_action">User actions</option>
                <option value="configuration_change">
                  Configuration changes
                </option>
                <option value="system_access">System access</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audit-from-date">From date</Label>
              <Input
                id="audit-from-date"
                type="date"
                value={fromDate}
                max={toDate || undefined}
                onChange={(event) => {
                  setFromDate(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audit-to-date">To date</Label>
              <Input
                id="audit-to-date"
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(event) => {
                  setToDate(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="audit-outcome">Outcome</Label>
              <Select
                id="audit-outcome"
                value={outcome}
                onChange={(event) => {
                  setOutcome(event.target.value as "all" | AuditOutcome);
                  setPage(1);
                }}
              >
                <option value="all">All outcomes</option>
                <option value="success">Success</option>
                <option value="denied">Denied</option>
                <option value="failed">Failed</option>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Apply filters</Button>
              {isFiltered ? (
                <Button type="button" variant="secondary" onClick={clear}>
                  <X aria-hidden="true" className="size-4" />
                  Clear
                </Button>
              ) : null}
            </div>
          </form>
        </div>
        <div className="p-4">
          {rows.length ? (
            <DataTable
              columns={columns}
              rows={rows}
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
            page={currentPage}
            pageCount={pageCount}
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
              <Detail label="Record type" value={typeLabel(selected.type)} />
              <Detail label="Correlation ID" value={selected.correlationId} />
              <Detail
                label="Timestamp"
                value={formatTime(selected.timestamp)}
              />
              <Detail label="Activity" value={selected.activity} />
              <Detail label="Actor" value={selected.actor} />
              <Detail label="Affected resource" value={selected.resource} />
              <div className="sm:col-span-2">
                <Detail label="Details" value={selected.details} />
              </div>
            </dl>
            <section aria-labelledby="request-context-heading">
              <h3
                className="border-border border-b pb-2 text-sm font-semibold"
                id="request-context-heading"
              >
                Request context
              </h3>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <Detail
                  label="Request ID"
                  value={selected.requestContext.requestId}
                />
                <Detail
                  label="Source IP"
                  value={selected.requestContext.sourceIp}
                />
                <Detail
                  label="HTTP method"
                  value={selected.requestContext.method}
                />
                <Detail
                  label="User agent"
                  value={selected.requestContext.userAgent}
                />
                <div className="sm:col-span-2">
                  <Detail
                    label="Request path"
                    value={selected.requestContext.path}
                  />
                </div>
              </dl>
            </section>
            <section aria-labelledby="recorded-parameters-heading">
              <div className="border-border flex items-center justify-between gap-3 border-b pb-2">
                <h3 className="text-sm font-semibold" id="recorded-parameters-heading">
                  Recorded parameters
                </h3>
                <span className="text-muted text-xs">
                  Sensitive values are redacted
                </span>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {selected.parameters.map((parameter) => (
                  <div
                    className="border-border bg-background rounded-lg border p-3"
                    key={parameter.name}
                  >
                    <Detail label={parameter.name} value={parameter.value} />
                  </div>
                ))}
              </dl>
            </section>
            <section aria-labelledby="change-comparison-heading">
              <div className="border-border flex items-center justify-between gap-3 border-b pb-2">
                <h3 className="text-sm font-semibold" id="change-comparison-heading">
                  Before / After changes
                </h3>
                {selected.changes?.length ? (
                  <StatusBadge tone="info">
                    {selected.changes.length} changed properties
                  </StatusBadge>
                ) : null}
              </div>
              {selected.changes?.length ? (
                <div className="border-border mt-4 overflow-hidden rounded-lg border">
                  <div className="bg-background text-muted hidden grid-cols-[minmax(10rem,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b px-4 py-2 text-xs font-medium tracking-wide uppercase sm:grid">
                    <span>Property</span>
                    <span>Before</span>
                    <span>After</span>
                  </div>
                  <div className="divide-border divide-y">
                    {selected.changes.map((change) => (
                      <dl
                        className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(10rem,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] sm:gap-4"
                        key={change.property}
                      >
                        <div>
                          <dt className="text-muted text-xs font-medium uppercase sm:sr-only">
                            Property
                          </dt>
                          <dd className="mt-1 text-sm font-medium sm:mt-0">
                            {change.property}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted text-xs font-medium uppercase sm:sr-only">
                            Before
                          </dt>
                          <dd className="mt-1 text-sm break-words sm:mt-0">
                            {change.before}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted text-xs font-medium uppercase sm:sr-only">
                            After
                          </dt>
                          <dd className="text-brand mt-1 text-sm font-medium break-words sm:mt-0">
                            {change.after}
                          </dd>
                        </div>
                      </dl>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted mt-4 text-sm">
                  This audit record did not change stored entity properties.
                </p>
              )}
            </section>
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
function typeLabel(type: AuditType) {
  return type === "user_action"
    ? "User Action"
    : type === "configuration_change"
      ? "Configuration Change"
      : "System Access";
}
function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}
