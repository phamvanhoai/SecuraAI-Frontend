"use client";

import { Eye, Info, Search, Settings2, X } from "lucide-react";
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

type ChangeRecord = {
  id: string;
  setting: string;
  category: string;
  actor: string;
  changedAt: string;
  previousValue: string;
  newValue: string;
  reason: string;
};
const pageSize = 5;
const records: readonly ChangeRecord[] = [
  {
    id: "CFG-2026-031",
    setting: "Default anomaly threshold",
    category: "AI Detection",
    actor: "admin@gmail.com",
    changedAt: "2026-10-06T09:26:00Z",
    previousValue: "0.80",
    newValue: "0.85",
    reason: "Reduce low-confidence alert volume after model review.",
  },
  {
    id: "CFG-2026-030",
    setting: "Session inactivity timeout",
    category: "Authentication",
    actor: "admin@gmail.com",
    changedAt: "2026-10-06T08:40:00Z",
    previousValue: "30 minutes",
    newValue: "20 minutes",
    reason: "Align session controls with the updated access policy.",
  },
  {
    id: "CFG-2026-029",
    setting: "Event retention period",
    category: "Event Ingestion",
    actor: "admin@gmail.com",
    changedAt: "2026-10-05T16:18:00Z",
    previousValue: "90 days",
    newValue: "180 days",
    reason: "Extend investigation coverage for security reviews.",
  },
  {
    id: "CFG-2026-028",
    setting: "Failed login lockout",
    category: "Authentication",
    actor: "admin@gmail.com",
    changedAt: "2026-10-05T14:02:00Z",
    previousValue: "10 attempts",
    newValue: "5 attempts",
    reason: "Harden account protection against repeated login attempts.",
  },
  {
    id: "CFG-2026-027",
    setting: "Email notification channel",
    category: "Notifications",
    actor: "admin@gmail.com",
    changedAt: "2026-10-04T11:35:00Z",
    previousValue: "Disabled",
    newValue: "Enabled",
    reason: "Enable email delivery for eligible security notifications.",
  },
  {
    id: "CFG-2026-026",
    setting: "Evidence maximum file size",
    category: "Compliance",
    actor: "admin@gmail.com",
    changedAt: "2026-10-03T10:12:00Z",
    previousValue: "5 MB",
    newValue: "10 MB",
    reason: "Support larger audit evidence documents.",
  },
  {
    id: "CFG-2026-025",
    setting: "Integration health interval",
    category: "Integrations",
    actor: "admin@gmail.com",
    changedAt: "2026-10-02T07:55:00Z",
    previousValue: "15 minutes",
    newValue: "5 minutes",
    reason: "Detect unavailable integrations sooner.",
  },
];

export function SystemConfigurationHistory() {
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [actor, setActor] = useState("");
  const [selected, setSelected] = useState<ChangeRecord | null>(null);
  const detailDialog = useRef<HTMLDialogElement>(null);
  const filtered = useMemo(
    () =>
      records.filter((record) => {
        const term = query.toLowerCase();
        return (
          (!term ||
            `${record.id} ${record.setting} ${record.reason}`
              .toLowerCase()
              .includes(term)) &&
          (category === "all" || record.category === category) &&
          (!actor || record.actor.toLowerCase().includes(actor.toLowerCase()))
        );
      }),
    [actor, category, query],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const isFiltered = Boolean(query || category !== "all" || actor);
  const columns: readonly DataTableColumn<ChangeRecord>[] = [
    {
      key: "setting",
      header: "Affected setting",
      cell: (record) => (
        <div className="min-w-48">
          <p className="font-medium">{record.setting}</p>
          <p className="text-muted mt-1 text-xs">
            {record.id} · {record.category}
          </p>
        </div>
      ),
    },
    { key: "actor", header: "Actor", cell: (record) => record.actor },
    {
      key: "time",
      header: "Timestamp",
      cell: (record) => (
        <time className="whitespace-nowrap" dateTime={record.changedAt}>
          {formatTime(record.changedAt)}
        </time>
      ),
    },
    {
      key: "change",
      header: "Recorded change",
      cell: (record) => (
        <div className="min-w-52 text-sm">
          <span className="text-muted line-through">
            {record.previousValue}
          </span>
          <span aria-hidden="true" className="mx-2">
            →
          </span>
          <span className="font-medium">{record.newValue}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: () => <StatusBadge tone="success">Recorded</StatusBadge>,
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
            detailDialog.current?.showModal();
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
            UI preview for UC45. These are labeled example changes; live
            configuration history will be connected when the backend API is
            implemented.
          </p>
        </div>
      </Alert>
      <ProductPanel
        title="Configuration change history"
        description={`${filtered.length} example configuration changes found`}
      >
        <div className="border-border flex flex-wrap items-center gap-2 border-b p-4">
          <form
            className="contents"
            onSubmit={(event) => {
              event.preventDefault();
              setQuery(draft.trim());
              setPage(1);
            }}
          >
            <Label
              className="relative max-w-md min-w-[220px] flex-1"
              htmlFor="configuration-history-search"
            >
              <span className="sr-only">Search configuration changes</span>
              <Search
                aria-hidden="true"
                className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
              <Input
                id="configuration-history-search"
                className="min-h-10 pl-9"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Setting, change ID, or reason"
              />
            </Label>
            <Select
              aria-label="Configuration category"
              className="w-48"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All categories</option>
              {[...new Set(records.map((record) => record.category))].map(
                (value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ),
              )}
            </Select>
            <Input
              aria-label="Filter by actor"
              className="w-52"
              value={actor}
              onChange={(event) => {
                setActor(event.target.value);
                setPage(1);
              }}
              placeholder="Actor email"
            />
            <Button type="submit">Search</Button>
          </form>
          {isFiltered ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDraft("");
                setQuery("");
                setCategory("all");
                setActor("");
                setPage(1);
              }}
            >
              <X aria-hidden="true" className="size-4" />
              Clear
            </Button>
          ) : null}
        </div>
        <div className="p-4">
          {pageRows.length ? (
            <DataTable
              columns={columns}
              rows={pageRows}
              getRowKey={(record) => record.id}
            />
          ) : (
            <div className="py-12 text-center">
              <Settings2
                aria-hidden="true"
                className="text-muted mx-auto size-7"
              />
              <p className="mt-3 font-medium">
                No configuration changes match your filters
              </p>
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
        dialogRef={detailDialog}
        title="Configuration change details"
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-sm font-semibold">
                {selected.id}
              </span>
              <StatusBadge tone="success">Recorded</StatusBadge>
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail label="Affected setting" value={selected.setting} />
              <Detail label="Category" value={selected.category} />
              <Detail label="Actor" value={selected.actor} />
              <Detail
                label="Timestamp"
                value={formatTime(selected.changedAt)}
              />
              <Detail label="Previous value" value={selected.previousValue} />
              <Detail label="New value" value={selected.newValue} />
              <div className="sm:col-span-2">
                <Detail
                  label="Recorded change details"
                  value={selected.reason}
                />
              </div>
            </dl>
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
function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}
