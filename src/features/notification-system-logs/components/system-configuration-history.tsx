"use client";
import { Eye, Info, Search, Settings2, X } from "lucide-react";
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
              ? `${r.resourceDetails.name} · ${r.resourceDetails.email} · ${r.resourceDetails.role}`
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
          <span className="text-muted line-through">
            {text(r.previousValue)}
          </span>
          <span className="mx-2">→</span>
          <span className="font-medium">{text(r.newValue)}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <StatusBadge tone={r.outcome === "SUCCESS" ? "success" : "danger"}>
          {r.outcome}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setSelected(r);
            dialog.current?.showModal();
          }}
        >
          <Eye className="size-4" />
          View
        </Button>
      ),
    },
  ];
  return (
    <>
      <Alert className="border-info/25 bg-info-soft text-info">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 size-4" />
          <p>Append-only configuration changes from the backend audit trail.</p>
        </div>
      </Alert>
      <ProductPanel
        title="Configuration change history"
        description={`${query.data?.pagination.total ?? 0} recorded changes found`}
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
            <Search className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" />
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
              <X className="size-4" />
              Clear
            </Button>
          ) : null}
        </form>
        <div className="p-4">
          {query.isPending ? (
            <div className="bg-neutral-soft h-64 animate-pulse rounded-lg" />
          ) : query.isError ? (
            <Alert>Unable to load configuration history. Try again.</Alert>
          ) : rows.length ? (
            <DataTable columns={cols} rows={rows} getRowKey={(r) => r.id} />
          ) : (
            <div className="py-12 text-center">
              <Settings2 className="text-muted mx-auto size-7" />
              <p className="mt-3 font-medium">
                No configuration changes match your filters
              </p>
            </div>
          )}
        </div>
        <div className="border-border border-t p-4">
          <Pagination
            page={query.data?.pagination.page ?? page}
            pageCount={query.data?.pagination.pageCount ?? 1}
            onPageChange={setPage}
          />
        </div>
      </ProductPanel>
      <Dialog dialogRef={dialog} title="Configuration change details">
        {selected ? (
          <div className="space-y-5">
            <div className="flex justify-between">
              <span className="font-mono text-sm">{selected.id}</span>
              <StatusBadge
                tone={selected.outcome === "SUCCESS" ? "success" : "danger"}
              >
                {selected.outcome}
              </StatusBadge>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Affected setting" value={selected.setting} />
              <Detail label="Action" value={selected.action} />
              {selected.resourceDetails ? (
                <Detail
                  label="Affected user"
                  value={`${selected.resourceDetails.name} · ${selected.resourceDetails.email} · ${selected.resourceDetails.role}`}
                />
              ) : null}
              {selected.resourceId ? (
                <Detail label="Technical resource ID" value={selected.resourceId} />
              ) : null}
              <Detail
                label="Actor"
                value={`${selected.actor}${selected.actorRole ? ` (${selected.actorRole})` : ""}`}
              />
              <Detail label="Timestamp" value={time(selected.changedAt)} />
              <Detail
                label="Previous value"
                value={text(selected.previousValue)}
              />
              <Detail label="New value" value={text(selected.newValue)} />
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
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted text-xs font-medium uppercase">{label}</dt>
      <dd className="mt-1 max-h-40 overflow-auto text-sm break-words whitespace-pre-wrap">
        {value}
      </dd>
    </div>
  );
}
