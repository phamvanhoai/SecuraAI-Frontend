"use client";
import {
  AlertTriangle,
  Eye,
  GitCompare,
  RotateCcw,
  Search,
  Settings2,
  User,
} from "lucide-react";
import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { TableSkeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api/api-client";

type RecordItem = {
  id: string;
  setting: string;
  action: string;
  resourceId: string | null;
  resourceDetails: { name: string; email: string; role: string } | null;
  actor: string;
  actorEmail: string | null;
  actorRole: string | null;
  changedAt: string;
  previousValue: unknown;
  newValue: unknown;
  outcome: "SUCCESS" | "FAILURE" | "DENIED";
};
type Result = {
  items: RecordItem[];
  pagination: { page: number; pageCount: number; total: number };
};

const text = (v: unknown) =>
  v == null
    ? "Not recorded"
    : typeof v === "string"
      ? v
      : JSON.stringify(v, null, 2);

const time = (v: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(v));

async function load(page: number, q: string, actor: string) {
  const value = await apiRequest<unknown>(
    "/api/system-logs/configuration-history",
    {
      target: "same-origin",
      query: {
        page,
        limit: 10,
        ...(q ? { q } : {}),
        ...(actor ? { actor } : {}),
      },
    },
  );
  if (
    !value ||
    typeof value !== "object" ||
    !("items" in value) ||
    !("pagination" in value)
  )
    throw new Error("Invalid response");
  return value as Result;
}

function outcomeTone(outcome: RecordItem["outcome"]) {
  return outcome === "SUCCESS"
    ? ("success" as const)
    : outcome === "DENIED"
      ? ("warning" as const)
      : ("danger" as const);
}

export function SystemConfigurationHistory() {
  const [page, setPage] = useState(1),
    [draft, setDraft] = useState(""),
    [q, setQ] = useState(""),
    [actor, setActor] = useState(""),
    [selected, setSelected] = useState<RecordItem | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const query = useQuery({
    queryKey: ["configuration-history", page, q, actor],
    queryFn: () => load(page, q, actor),
  });
  const rows = query.data?.items ?? [];

  const cols: readonly DataTableColumn<RecordItem>[] = [
    {
      key: "setting",
      header: "Affected setting",
      cell: (r) => (
        <div className="min-w-48">
          <p className="font-medium">{r.setting}</p>
          <p className="mt-1 text-sm">
            {r.resourceDetails
              ? r.resourceDetails.name + " · " + r.resourceDetails.email + " · " + r.resourceDetails.role
              : r.action}
          </p>
          {r.resourceId ? (
            <p className="text-muted mt-1 text-xs">
              Technical resource ID: {r.resourceId}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      cell: (r) => (
        <div>
          <p>{r.actor}</p>
          <p className="text-muted text-xs">{r.actorEmail ?? "No email"}</p>
        </div>
      ),
    },
    {
      key: "time",
      header: "Timestamp",
      cell: (r) => <time dateTime={r.changedAt}>{time(r.changedAt)}</time>,
    },
    {
      key: "change",
      header: "Recorded change",
      cell: (r) => (
        <div className="min-w-64 text-sm">
          <span className="text-muted line-through">{text(r.previousValue)}</span>
          <span className="mx-2">→</span>
          <span className="font-medium">{text(r.newValue)}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <StatusBadge tone={outcomeTone(r.outcome)}>{r.outcome}</StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <Button
          className="min-h-8 gap-1.5 px-2.5 text-xs font-medium"
          type="button"
          variant="secondary"
          onClick={() => {
            setSelected(r);
            dialog.current?.showModal();
          }}
        >
          <Eye className="size-3.5" strokeWidth={1.8} />
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <ProductPanel
        title="Configuration change history"
        description={
          query.data
            ? query.data.pagination.total + " append-only configuration changes found"
            : "Append-only configuration changes from the backend audit trail"
        }
      >
        <form
          className="border-border flex flex-wrap gap-2 border-b p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setQ(draft.trim());
            setPage(1);
          }}
        >
          <Label
            className="relative min-w-[220px] flex-1"
            htmlFor="configuration-history-search"
          >
            <span className="sr-only">Search configuration changes</span>
            <Search
              className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
              strokeWidth={1.8}
            />
            <Input
              id="configuration-history-search"
              className="pl-9"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Setting, action, or resource ID"
            />
          </Label>
          <Input
            aria-label="Filter by actor"
            className="w-52"
            value={actor}
            onChange={(e) => {
              setActor(e.target.value);
              setPage(1);
            }}
            placeholder="Actor name or email"
          />
          <Button type="submit">Search</Button>
          {q || actor ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDraft("");
                setQ("");
                setActor("");
                setPage(1);
              }}
            >
              <RotateCcw aria-hidden="true" className="size-4" strokeWidth={1.8} />
              Reset
            </Button>
          ) : null}
        </form>
        <div className="p-4">
          {query.isPending ? (
            <TableSkeleton
              headers={[
                "Affected setting",
                "Actor",
                "Timestamp",
                "Recorded change",
                "Status",
                "Actions",
              ]}
              rows={6}
              label="Loading configuration change history"
            />
          ) : query.isError ? (
            <Alert>Unable to load configuration history. Try again.</Alert>
          ) : rows.length ? (
            <DataTable columns={cols} rows={rows} getRowKey={(r) => r.id} />
          ) : (
            <div className="py-12 text-center">
              <Settings2
                aria-hidden="true"
                className="text-muted mx-auto mb-3 size-10 stroke-1"
              />
              <h3 className="text-foreground text-base font-semibold">
                {q || actor
                  ? "No configuration changes match your filters"
                  : "No configuration changes recorded"}
              </h3>
              <p className="text-muted mx-auto mt-1 max-w-sm text-sm">
                {q || actor
                  ? "Try another setting, action, resource, or actor."
                  : "Auditable system configuration changes will appear here."}
              </p>
              {q || actor ? (
                <Button
                  className="mt-4"
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setDraft("");
                    setQ("");
                    setActor("");
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          )}
        </div>
        {query.data?.pagination ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={query.data.pagination.page}
              pageCount={query.data.pagination.pageCount}
              onPageChange={setPage}
            />
          </div>
        ) : null}
      </ProductPanel>

      {/* ── Configuration change details dialog ── */}
      <Dialog
        className="max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100%-2rem))] overflow-y-auto"
        dialogRef={dialog}
        title="Configuration change details"
        onClose={() => setSelected(null)}
      >
        {selected ? (
          <div className="space-y-5">
            {/* Context bar */}
            <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <Settings2 className="size-3.5 text-brand" strokeWidth={1.8} />
                {selected.setting}
              </span>
              <span className="text-border">·</span>
              <span className="text-muted font-mono">{selected.action}</span>
              <span className="text-border">·</span>
              <StatusBadge tone={outcomeTone(selected.outcome)}>
                {selected.outcome}
              </StatusBadge>
            </div>

            {/* Metadata fact grid */}
            <dl className="border-border bg-neutral-soft/30 grid gap-x-6 gap-y-4 rounded-xl border p-4 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                  Affected setting
                </dt>
                <dd className="mt-1 text-sm font-medium break-words">
                  {selected.setting}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                  Action
                </dt>
                <dd className="mt-1 text-sm font-medium font-mono">
                  {selected.action}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                  Timestamp
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  <time dateTime={selected.changedAt}>{time(selected.changedAt)}</time>
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                  Record ID
                </dt>
                <dd className="mt-1 text-sm font-medium font-mono break-all">
                  {selected.id}
                </dd>
              </div>
            </dl>

            {/* Actor section */}
            <div className="space-y-2">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <User
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-semibold">Actor</h3>
              </div>
              <dl className="border-border bg-neutral-soft/30 grid gap-x-6 gap-y-4 rounded-xl border p-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                    Name
                  </dt>
                  <dd className="mt-1 text-sm font-medium">{selected.actor}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                    Email
                  </dt>
                  <dd className="mt-1 text-sm font-medium">
                    {selected.actorEmail ?? (
                      <span className="text-muted font-normal">Not recorded</span>
                    )}
                  </dd>
                </div>
                {selected.actorRole ? (
                  <div className="min-w-0">
                    <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                      Role
                    </dt>
                    <dd className="mt-1 text-sm font-medium">{selected.actorRole}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            {/* Affected resource section (conditional) */}
            {selected.resourceDetails || selected.resourceId ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2 border-b border-border pb-2">
                  <Settings2
                    className="mt-0.5 size-4 shrink-0 text-brand"
                    strokeWidth={1.8}
                  />
                  <h3 className="text-sm font-semibold">Affected resource</h3>
                </div>
                <dl className="border-border bg-neutral-soft/30 grid gap-x-6 gap-y-4 rounded-xl border p-4 sm:grid-cols-2">
                  {selected.resourceDetails ? (
                    <>
                      <div className="min-w-0">
                        <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                          Name
                        </dt>
                        <dd className="mt-1 text-sm font-medium">
                          {selected.resourceDetails.name}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                          Email
                        </dt>
                        <dd className="mt-1 text-sm font-medium">
                          {selected.resourceDetails.email}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                          Role
                        </dt>
                        <dd className="mt-1 text-sm font-medium">
                          {selected.resourceDetails.role}
                        </dd>
                      </div>
                    </>
                  ) : null}
                  {selected.resourceId ? (
                    <div className="min-w-0 sm:col-span-2">
                      <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                        Technical resource ID
                      </dt>
                      <dd className="mt-1 text-sm font-medium font-mono break-all">
                        {selected.resourceId}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : null}

            {/* Recorded change section */}
            <div className="space-y-2">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <GitCompare
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-semibold">Recorded change</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Previous value */}
                <div className="border-border overflow-hidden rounded-xl border">
                  <div className="border-border bg-neutral-soft/30 border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide">
                    Previous value
                  </div>
                  <pre className="max-h-48 overflow-auto p-3 text-xs break-all whitespace-pre-wrap text-muted">
                    {text(selected.previousValue)}
                  </pre>
                </div>
                {/* New value */}
                <div className="border-border overflow-hidden rounded-xl border">
                  <div className="border-border bg-neutral-soft/30 border-b px-3 py-2 text-xs font-semibold uppercase tracking-wide">
                    New value
                  </div>
                  <pre className="max-h-48 overflow-auto p-3 text-xs break-all whitespace-pre-wrap font-medium">
                    {text(selected.newValue)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Warning for failed/denied outcomes */}
            {selected.outcome !== "SUCCESS" ? (
              <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-warning"
                  strokeWidth={1.8}
                />
                <p className="text-sm leading-relaxed">
                  This change attempt was recorded with outcome{" "}
                  <strong>{selected.outcome}</strong>. The configuration may not
                  have been applied.
                </p>
              </div>
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
    </>
  );
}
