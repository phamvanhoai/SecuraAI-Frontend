"use client";

import {
  Ban,
  CheckCircle2,
  Copy,
  Eye,
  Info,
  KeyRound,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
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
import { useToast } from "@/components/feedback/toast";

type ApiKeyStatus = "active" | "expires_soon" | "expired" | "revoked";
type ExpirationFilter = "all" | "30_days" | "expired" | "never";
type ApiKeyRecord = {
  id: string;
  name: string;
  integration: string;
  scopes: readonly string[];
  status: ApiKeyStatus;
  creator: string;
  createdAt: string;
  expiresAt: string | null;
  usage: {
    lastUsedAt: string | null;
    lastUsedFrom: string | null;
    requestsLast30Days: number;
  };
};

const records: readonly ApiKeyRecord[] = [
  {
    id: "KEY-7F2A",
    name: "Wazuh production ingest",
    integration: "Wazuh Manager",
    scopes: ["events:write", "sources:read"],
    status: "active",
    creator: "admin@gmail.com",
    createdAt: "2026-08-15T08:30:00Z",
    expiresAt: "2027-08-15T08:30:00Z",
    usage: {
      lastUsedAt: "2026-10-06T09:18:00Z",
      lastUsedFrom: "10.20.1.15",
      requestsLast30Days: 18420,
    },
  },
  {
    id: "KEY-91C4",
    name: "Splunk investigation export",
    integration: "Splunk Enterprise",
    scopes: ["events:read", "incidents:read"],
    status: "expires_soon",
    creator: "admin@gmail.com",
    createdAt: "2026-01-20T04:15:00Z",
    expiresAt: "2026-10-28T04:15:00Z",
    usage: {
      lastUsedAt: "2026-10-05T14:42:00Z",
      lastUsedFrom: "10.20.2.40",
      requestsLast30Days: 682,
    },
  },
  {
    id: "KEY-C16E",
    name: "FortiGate event collector",
    integration: "FortiGate Firewall",
    scopes: ["events:write"],
    status: "active",
    creator: "nhi.admin@securaai.local",
    createdAt: "2026-09-02T11:45:00Z",
    expiresAt: null,
    usage: {
      lastUsedAt: "2026-10-06T08:52:00Z",
      lastUsedFrom: "10.20.3.21",
      requestsLast30Days: 9314,
    },
  },
  {
    id: "KEY-18D0",
    name: "Legacy SIEM connector",
    integration: "Legacy SIEM",
    scopes: ["events:write", "events:read"],
    status: "revoked",
    creator: "admin@gmail.com",
    createdAt: "2025-12-10T02:20:00Z",
    expiresAt: "2026-12-10T02:20:00Z",
    usage: {
      lastUsedAt: "2026-07-14T03:20:00Z",
      lastUsedFrom: "10.20.5.10",
      requestsLast30Days: 0,
    },
  },
  {
    id: "KEY-4B21",
    name: "Expired test collector",
    integration: "Test Collector",
    scopes: ["events:write"],
    status: "expired",
    creator: "admin@gmail.com",
    createdAt: "2025-09-01T07:00:00Z",
    expiresAt: "2026-09-01T07:00:00Z",
    usage: {
      lastUsedAt: null,
      lastUsedFrom: null,
      requestsLast30Days: 0,
    },
  },
];

const pageSize = 3;

export function IntegrationApiKeyList() {
  const detailDialog = useRef<HTMLDialogElement>(null);
  const createDialog = useRef<HTMLDialogElement>(null);
  const editDialog = useRef<HTMLDialogElement>(null);
  const rotateDialog = useRef<HTMLDialogElement>(null);
  const revokeDialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<ApiKeyRecord | null>(null);
  const [createStep, setCreateStep] = useState<"form" | "generated">("form");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    "events:write",
  ]);
  const [scopeError, setScopeError] = useState("");
  const [editScopes, setEditScopes] = useState<string[]>([]);
  const [editExpiration, setEditExpiration] = useState("");
  const [editError, setEditError] = useState("");
  const [rotateStep, setRotateStep] = useState<"confirm" | "generated">(
    "confirm",
  );
  const [rotationMode, setRotationMode] = useState<"immediate" | "grace">(
    "grace",
  );
  const [draftQuery, setDraftQuery] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ApiKeyStatus>(
    "all",
  );
  const [expirationFilter, setExpirationFilter] =
    useState<ExpirationFilter>("all");
  const [scopeFilter, setScopeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const toast = useToast();
  const filteredRecords = useMemo(() => {
    const previewNow = new Date("2026-10-06T00:00:00Z").getTime();
    const thirtyDaysFromNow = previewNow + 30 * 24 * 60 * 60 * 1000;
    const term = query.trim().toLowerCase();
    return records.filter((record) => {
      const expirationTime = record.expiresAt
        ? new Date(record.expiresAt).getTime()
        : null;
      const matchesExpiration =
        expirationFilter === "all" ||
        (expirationFilter === "never" && expirationTime === null) ||
        (expirationFilter === "expired" &&
          expirationTime !== null &&
          expirationTime < previewNow) ||
        (expirationFilter === "30_days" &&
          expirationTime !== null &&
          expirationTime >= previewNow &&
          expirationTime <= thirtyDaysFromNow);
      return (
        (!term ||
          `${record.name} ${record.creator}`.toLowerCase().includes(term)) &&
        (statusFilter === "all" || record.status === statusFilter) &&
        (scopeFilter === "all" || record.scopes.includes(scopeFilter)) &&
        matchesExpiration
      );
    });
  }, [expirationFilter, query, scopeFilter, statusFilter]);
  const isFiltered = Boolean(
    query ||
      statusFilter !== "all" ||
      expirationFilter !== "all" ||
      scopeFilter !== "all",
  );
  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const clearFilters = () => {
    setDraftQuery("");
    setQuery("");
    setStatusFilter("all");
    setExpirationFilter("all");
    setScopeFilter("all");
    setPage(1);
  };
  const columns: readonly DataTableColumn<ApiKeyRecord>[] = [
    {
      key: "name",
      header: "Key name",
      cell: (record) => (
        <div className="min-w-52">
          <div className="flex items-center gap-2">
            <KeyRound aria-hidden="true" className="text-muted size-4 shrink-0" />
            <span className="font-medium">{record.name}</span>
          </div>
          <p className="text-muted mt-1 font-mono text-xs">{record.id}</p>
        </div>
      ),
    },
    {
      key: "integration",
      header: "Integration",
      cell: (record) => record.integration,
    },
    {
      key: "scopes",
      header: "Assigned scopes",
      cell: (record) => (
        <div className="flex min-w-48 flex-wrap gap-1.5">
          {record.scopes.map((scope) => (
            <StatusBadge key={scope} tone="neutral">
              {scope}
            </StatusBadge>
          ))}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (record) => <ApiKeyStatusBadge status={record.status} />,
    },
    {
      key: "creator",
      header: "Created by",
      cell: (record) => (
        <div className="min-w-44">
          <p className="break-words">{record.creator}</p>
          <time
            className="text-muted mt-1 block text-xs"
            dateTime={record.createdAt}
          >
            {formatDate(record.createdAt)}
          </time>
        </div>
      ),
    },
    {
      key: "expiresAt",
      header: "Expiration",
      cell: (record) =>
        record.expiresAt ? (
          <time className="whitespace-nowrap" dateTime={record.expiresAt}>
            {formatDate(record.expiresAt)}
          </time>
        ) : (
          <span className="text-muted">Never</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (record) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setSelected(record);
              detailDialog.current?.showModal();
            }}
          >
            <Eye aria-hidden="true" className="size-4" />
            View
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setSelected(record);
              setEditScopes([...record.scopes]);
              setEditExpiration(record.expiresAt?.slice(0, 10) ?? "");
              setEditError("");
              editDialog.current?.showModal();
            }}
          >
            <Pencil aria-hidden="true" className="size-4" />
            Edit access
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setSelected(record);
              setRotateStep("confirm");
              setRotationMode("grace");
              rotateDialog.current?.showModal();
            }}
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            Rotate
          </Button>
          {record.status === "revoked" ? (
            <Button disabled type="button" variant="secondary">
              <Ban aria-hidden="true" className="size-4" />
              Revoked
            </Button>
          ) : (
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                setSelected(record);
                revokeDialog.current?.showModal();
              }}
            >
              <Ban aria-hidden="true" className="size-4" />
              Revoke
            </Button>
          )}
        </div>
      ),
    },
  ];
  return (
    <>
      <div className="space-y-5">
      <Alert className="border-info/25 bg-info-soft text-info">
        <div className="flex items-start gap-2">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>
            UI preview for UC84. These example keys will be replaced by the
            cross-integration API key list when its backend contract is
            available.
          </p>
        </div>
      </Alert>
      <Alert>
        <div className="flex items-start gap-2">
          <LockKeyhole aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>
            Secret key values are never shown in this list. Only non-sensitive
            identifiers and governance metadata are displayed.
          </p>
        </div>
      </Alert>
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => {
            setCreateStep("form");
            setSelectedScopes(["events:write"]);
            setScopeError("");
            createDialog.current?.showModal();
          }}
        >
          <Plus aria-hidden="true" className="size-4" />
          Generate API key
        </Button>
      </div>
      <ProductPanel
        title="Integration API keys"
        description={`${filteredRecords.length} of ${records.length} example keys shown`}
      >
        <form
          className="border-border grid gap-4 border-b p-4 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_repeat(3,minmax(10rem,0.55fr))_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(draftQuery.trim());
            setPage(1);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="api-key-list-search">Key name or creator</Label>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
              <Input
                className="pl-9"
                id="api-key-list-search"
                placeholder="Search key name or creator"
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="api-key-status-filter">Status</Label>
            <Select
              id="api-key-status-filter"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as "all" | ApiKeyStatus);
                setPage(1);
              }}
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="expires_soon">Expires soon</option>
              <option value="expired">Expired</option>
              <option value="revoked">Revoked</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="api-key-expiration-filter">Expiration</Label>
            <Select
              id="api-key-expiration-filter"
              value={expirationFilter}
              onChange={(event) => {
                setExpirationFilter(event.target.value as ExpirationFilter);
                setPage(1);
              }}
            >
              <option value="all">Any expiration</option>
              <option value="30_days">Expires within 30 days</option>
              <option value="expired">Already expired</option>
              <option value="never">No expiration</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="api-key-scope-filter">Assigned scope</Label>
            <Select
              id="api-key-scope-filter"
              value={scopeFilter}
              onChange={(event) => {
                setScopeFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All scopes</option>
              <option value="events:write">events:write</option>
              <option value="events:read">events:read</option>
              <option value="sources:read">sources:read</option>
              <option value="incidents:read">incidents:read</option>
            </Select>
          </div>
          <div className="flex items-end gap-2 md:col-span-2 xl:col-span-1">
            <Button type="submit">Search</Button>
            {isFiltered ? (
              <Button type="button" variant="secondary" onClick={clearFilters}>
                <X aria-hidden="true" className="size-4" />
                Clear
              </Button>
            ) : null}
          </div>
        </form>
        <div className="p-4">
          {filteredRecords.length ? (
            <DataTable
              columns={columns}
              rows={paginatedRecords}
              getRowKey={(record) => record.id}
            />
          ) : (
            <div className="py-12 text-center">
              <KeyRound aria-hidden="true" className="text-muted mx-auto size-7" />
              <p className="mt-3 font-medium">
                No API keys match your filters
              </p>
              <p className="text-muted mt-1 text-sm">
                Adjust the search criteria or clear all filters.
              </p>
              <Button
                className="mt-4"
                type="button"
                variant="secondary"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
        {filteredRecords.length ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={currentPage}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </ProductPanel>
      </div>
      <Dialog
        className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto"
        dialogRef={detailDialog}
        title="Integration API key details"
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{selected.name}</p>
                <p className="text-muted mt-1 font-mono text-xs">{selected.id}</p>
              </div>
              <ApiKeyStatusBadge status={selected.status} />
            </div>
            <Alert>
              Secret material is not available from this view and cannot be
              recovered from stored metadata.
            </Alert>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Integration" value={selected.integration} />
              <Detail label="Created by" value={selected.creator} />
              <Detail
                label="Created at"
                value={formatDateTime(selected.createdAt)}
              />
              <Detail
                label="Expires at"
                value={
                  selected.expiresAt
                    ? formatDateTime(selected.expiresAt)
                    : "Never"
                }
              />
            </dl>
            <section aria-labelledby="api-key-scopes-heading">
              <h3
                className="border-border border-b pb-2 text-sm font-semibold"
                id="api-key-scopes-heading"
              >
                Permission scopes
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {selected.scopes.map((scope) => (
                  <StatusBadge key={scope} tone="neutral">
                    {scope}
                  </StatusBadge>
                ))}
              </div>
            </section>
            <section aria-labelledby="api-key-usage-heading">
              <h3
                className="border-border border-b pb-2 text-sm font-semibold"
                id="api-key-usage-heading"
              >
                Available usage information
              </h3>
              <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                <Detail
                  label="Last used"
                  value={
                    selected.usage.lastUsedAt
                      ? formatDateTime(selected.usage.lastUsedAt)
                      : "Never used"
                  }
                />
                <Detail
                  label="Last source IP"
                  value={selected.usage.lastUsedFrom ?? "Not available"}
                />
                <Detail
                  label="Requests (30 days)"
                  value={selected.usage.requestsLast30Days.toLocaleString("en-US")}
                />
              </dl>
            </section>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => detailDialog.current?.close()}
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
      <Dialog
        className="max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto"
        dialogRef={revokeDialog}
        title="Revoke integration API key"
      >
        {selected ? (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              revokeDialog.current?.close();
              toast.warning(
                "API key revocation validated",
                "UI preview only. The credential remains unchanged in the backend.",
              );
            }}
          >
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              Revocation stops this key from authenticating immediately in the
              production workflow. Update the integration first to avoid data
              ingestion interruption.
            </Alert>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Key name" value={selected.name} />
              <Detail label="Key ID" value={selected.id} />
              <Detail label="Integration" value={selected.integration} />
              <Detail label="Current status" value={statusLabel(selected.status)} />
            </dl>
            <div className="space-y-1.5">
              <Label htmlFor="api-key-revocation-reason">
                Revocation reason
              </Label>
              <Textarea
                id="api-key-revocation-reason"
                maxLength={500}
                minLength={10}
                placeholder="Explain why this credential is being revoked"
                required
              />
              <p className="text-muted text-xs">
                The reason, administrator, and timestamp will be recorded in
                the audit log.
              </p>
            </div>
            <label className="border-danger/30 flex min-h-11 items-start gap-3 rounded-lg border p-3 text-sm">
              <Checkbox required />
              <span>
                <span className="block font-medium">
                  I confirm this key must no longer authenticate
                </span>
                <span className="text-muted mt-1 block leading-5">
                  This action cannot be undone. A new key must be generated if
                  access is needed again.
                </span>
              </span>
            </label>
            <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => revokeDialog.current?.close()}
              >
                Cancel
              </Button>
              <Button type="submit" variant="danger">
                <Ban aria-hidden="true" className="size-4" />
                Revoke API key
              </Button>
            </div>
          </form>
        ) : null}
      </Dialog>
      <Dialog
        className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto"
        dialogRef={rotateDialog}
        title={
          rotateStep === "confirm"
            ? "Rotate integration API key"
            : "Replacement key generated"
        }
      >
        {selected && rotateStep === "confirm" ? (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              setRotateStep("generated");
            }}
          >
            <Alert>
              UI preview for UC88. This validates the rotation workflow but
              does not generate or invalidate a real credential.
            </Alert>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Current key" value={selected.name} />
              <Detail label="Key ID" value={selected.id} />
              <Detail label="Integration" value={selected.integration} />
              <Detail
                label="Scopes retained"
                value={selected.scopes.join(", ")}
              />
            </dl>
            <div className="space-y-1.5">
              <Label htmlFor="rotation-invalidation-mode">
                Previous key invalidation
              </Label>
              <Select
                id="rotation-invalidation-mode"
                value={rotationMode}
                onChange={(event) =>
                  setRotationMode(event.target.value as "immediate" | "grace")
                }
              >
                <option value="grace">After a grace period</option>
                <option value="immediate">Immediately</option>
              </Select>
              <p className="text-muted text-xs">
                A grace period allows the integration to switch credentials
                without interrupting event ingestion.
              </p>
            </div>
            {rotationMode === "grace" ? (
              <div className="space-y-1.5">
                <Label htmlFor="rotation-grace-hours">Grace period (hours)</Label>
                <Input
                  defaultValue="24"
                  id="rotation-grace-hours"
                  max="168"
                  min="1"
                  required
                  type="number"
                />
                <p className="text-muted text-xs">
                  Allowed range: 1–168 hours. The previous key is invalidated
                  when this period ends.
                </p>
              </div>
            ) : (
              <Alert className="border-warning/25 bg-warning-soft text-warning">
                Immediate invalidation can interrupt the integration until the
                replacement secret is installed.
              </Alert>
            )}
            <label className="border-border flex min-h-11 items-start gap-3 rounded-lg border p-3 text-sm">
              <Checkbox required />
              <span>
                <span className="block font-medium">
                  I understand the previous key will be invalidated
                </span>
                <span className="text-muted mt-1 block leading-5">
                  The rotation and invalidation schedule will be recorded for
                  audit purposes.
                </span>
              </span>
            </label>
            <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => rotateDialog.current?.close()}
              >
                Cancel
              </Button>
              <Button type="submit">Generate replacement key</Button>
            </div>
          </form>
        ) : null}
        {selected && rotateStep === "generated" ? (
          <div className="space-y-5">
            <div className="bg-success-soft text-success flex items-start gap-3 rounded-lg p-4">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">
                  Preview replacement key generated
                </p>
                <p className="mt-1 text-sm leading-5">
                  {rotationMode === "immediate"
                    ? "The production workflow would invalidate the previous key immediately."
                    : "The production workflow would keep the previous key active for the configured grace period."}
                </p>
              </div>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Previous key" value={selected.id} />
              <Detail
                label="Previous key status"
                value={
                  rotationMode === "immediate"
                    ? "Invalidated"
                    : "Pending invalidation"
                }
              />
              <Detail label="Replacement key ID" value="KEY-ROT-6E91" />
              <Detail label="Scopes copied" value={selected.scopes.join(", ")} />
            </dl>
            <div className="space-y-1.5">
              <Label htmlFor="rotated-preview-secret">Replacement secret</Label>
              <div className="flex gap-2">
                <Input
                  className="font-mono"
                  id="rotated-preview-secret"
                  readOnly
                  value="sec_demo_rotated_6e91_not_a_real_credential"
                />
                <Button
                  aria-label="Copy preview replacement secret"
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      "sec_demo_rotated_6e91_not_a_real_credential",
                    );
                    toast.info("Preview replacement secret copied");
                  }}
                >
                  <Copy aria-hidden="true" className="size-4" />
                </Button>
              </div>
              <p className="text-warning text-sm">
                Store the production replacement secret now. It cannot be
                viewed again after this dialog closes.
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={() => rotateDialog.current?.close()}>
                Done
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
      <Dialog
        className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto"
        dialogRef={editDialog}
        title="Update API key access"
      >
        {selected ? (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (editScopes.length === 0) {
                setEditError("Select at least one authorized scope.");
                return;
              }
              setEditError("");
              editDialog.current?.close();
              toast.info(
                "API key changes validated",
                "UI preview only. Updated access restrictions were not saved to the backend.",
              );
            }}
          >
            <Alert>
              Updating scopes changes what this credential can access. Existing
              secret material is not displayed or regenerated.
            </Alert>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Key name" value={selected.name} />
              <Detail label="Integration" value={selected.integration} />
            </dl>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Authorized scopes</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {([
                  ["events:write", "Ingest normalized events"],
                  ["events:read", "Read eligible events"],
                  ["sources:read", "Read event source metadata"],
                  ["incidents:read", "Read incident metadata"],
                ] as const).map(([scope, description]) => (
                  <label
                    className="border-border flex min-h-11 items-start gap-3 rounded-lg border p-3 text-sm"
                    key={scope}
                  >
                    <Checkbox
                      checked={editScopes.includes(scope)}
                      onChange={(event) => {
                        setEditScopes((current) =>
                          event.target.checked
                            ? [...current, scope]
                            : current.filter((item) => item !== scope),
                        );
                        setEditError("");
                      }}
                    />
                    <span>
                      <span className="block font-mono text-xs font-semibold">
                        {scope}
                      </span>
                      <span className="text-muted mt-1 block text-xs">
                        {description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {editError ? (
                <p className="text-danger text-sm" role="alert">
                  {editError}
                </p>
              ) : null}
            </fieldset>
            <div className="space-y-1.5">
              <Label htmlFor="edit-api-key-expiration">Expiration date</Label>
              <Input
                id="edit-api-key-expiration"
                min="2026-10-07"
                type="date"
                value={editExpiration}
                onChange={(event) => setEditExpiration(event.target.value)}
              />
              <p className="text-muted text-xs">
                Leave blank for no expiration. Past dates must be replaced
                before saving.
              </p>
            </div>
            <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => editDialog.current?.close()}
              >
                Cancel
              </Button>
              <Button type="submit">Save access changes</Button>
            </div>
          </form>
        ) : null}
      </Dialog>
      <Dialog
        className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto"
        dialogRef={createDialog}
        title={
          createStep === "form"
            ? "Generate integration API key"
            : "API key generated"
        }
      >
        {createStep === "form" ? (
          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (selectedScopes.length === 0) {
                setScopeError("Select at least one authorized scope.");
                return;
              }
              setScopeError("");
              setCreateStep("generated");
            }}
          >
            <Alert>
              UI preview for UC86. Submitting validates the workflow locally
              and does not create a usable credential.
            </Alert>
            <div className="space-y-1.5">
              <Label htmlFor="new-api-key-name">Key name</Label>
              <Input
                id="new-api-key-name"
                maxLength={80}
                minLength={3}
                placeholder="e.g. Wazuh production ingest"
                required
              />
              <p className="text-muted text-xs">
                Use a name that identifies the system and purpose.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-api-key-integration">Integration</Label>
              <Select id="new-api-key-integration" defaultValue="wazuh" required>
                <option value="wazuh">Wazuh Manager</option>
                <option value="splunk">Splunk Enterprise</option>
                <option value="fortigate">FortiGate Firewall</option>
              </Select>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Authorized scopes</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {([
                  ["events:write", "Ingest normalized events"],
                  ["events:read", "Read eligible events"],
                  ["sources:read", "Read event source metadata"],
                  ["incidents:read", "Read incident metadata"],
                ] as const).map(([scope, description]) => (
                  <label
                    className="border-border flex min-h-11 items-start gap-3 rounded-lg border p-3 text-sm"
                    key={scope}
                  >
                    <Checkbox
                      checked={selectedScopes.includes(scope)}
                      onChange={(event) => {
                        setSelectedScopes((current) =>
                          event.target.checked
                            ? [...current, scope]
                            : current.filter((item) => item !== scope),
                        );
                        setScopeError("");
                      }}
                    />
                    <span>
                      <span className="block font-mono text-xs font-semibold">
                        {scope}
                      </span>
                      <span className="text-muted mt-1 block text-xs">
                        {description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              {scopeError ? (
                <p className="text-danger text-sm" role="alert">
                  {scopeError}
                </p>
              ) : null}
            </fieldset>
            <div className="space-y-1.5">
              <Label htmlFor="new-api-key-expiration">Expiration</Label>
              <Select id="new-api-key-expiration" defaultValue="365" required>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
                <option value="365">1 year</option>
                <option value="never">No expiration</option>
              </Select>
              <p className="text-muted text-xs">
                Expiring credentials are recommended for production integrations.
              </p>
            </div>
            <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => createDialog.current?.close()}
              >
                Cancel
              </Button>
              <Button type="submit">Generate key</Button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="bg-success-soft text-success flex items-start gap-3 rounded-lg p-4">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">Preview key generated</p>
                <p className="mt-1 text-sm leading-5">
                  In the production workflow, metadata is recorded and this
                  secret is displayed only once.
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="generated-preview-secret">Secret key</Label>
              <div className="flex gap-2">
                <Input
                  className="font-mono"
                  id="generated-preview-secret"
                  readOnly
                  value="sec_demo_7f2a91c4_not_a_real_credential"
                />
                <Button
                  aria-label="Copy preview secret key"
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      "sec_demo_7f2a91c4_not_a_real_credential",
                    );
                    toast.info("Preview secret copied");
                  }}
                >
                  <Copy aria-hidden="true" className="size-4" />
                </Button>
              </div>
              <p className="text-warning text-sm">
                Copy and store the production secret securely before closing.
                It cannot be viewed again.
              </p>
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={() => createDialog.current?.close()}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
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

function ApiKeyStatusBadge({ status }: { status: ApiKeyStatus }) {
  return (
    <StatusBadge
      tone={
        status === "active"
          ? "success"
          : status === "expires_soon"
            ? "warning"
            : status === "expired"
              ? "neutral"
              : "danger"
      }
    >
      {statusLabel(status)}
    </StatusBadge>
  );
}

function statusLabel(status: ApiKeyStatus) {
  const labels: Record<ApiKeyStatus, string> = {
    active: "Active",
    expires_soon: "Expires soon",
    expired: "Expired",
    revoked: "Revoked",
  };
  return labels[status];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}
