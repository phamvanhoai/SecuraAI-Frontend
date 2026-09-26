"use client";
import { Eye, Search } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Pagination } from "@/components/data-display/pagination";
import {
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  usePolicyVersionHistory,
  usePolicyVersionHistoryDetail,
} from "../hooks/use-policy-version-history";
import type {
  PolicyVersionHistoryItem,
  PolicyVersionHistoryQuery,
} from "../schemas/policy-version-history-schema";
import { PolicyViewTabs } from "./policy-view-tabs";

const initialQuery: PolicyVersionHistoryQuery = {
  page: 1,
  limit: 20,
  status: "all",
};
const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
const tone = (status: string): "success" | "warning" | "neutral" =>
  status === "published"
    ? "success"
    : status === "draft"
      ? "warning"
      : "neutral";

export function PolicyVersionHistoryManager({
  onBack,
  backLabel = "Drafts",
}: {
  onBack?: () => void;
  backLabel?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{
    policyId: string;
    versionId: string;
  } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const list = usePolicyVersionHistory(query);
  const detail = usePolicyVersionHistoryDetail(
    selected?.policyId ?? null,
    selected?.versionId ?? null,
  );
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
  }, [selected]);
  const policyGroups = Array.from(
    (list.data?.items ?? [])
      .reduce(
        (groups, item) => {
          const existing = groups.get(item.policyId);
          if (existing) existing.versions.push(item);
          else
            groups.set(item.policyId, {
              policyId: item.policyId,
              policyCode: item.policyCode,
              title: item.title,
              description: item.description,
              versions: [item],
            });
          return groups;
        },
        new Map<
          string,
          {
            policyId: string;
            policyCode: string;
            title: string;
            description: string | null;
            versions: PolicyVersionHistoryItem[];
          }
        >(),
      )
      .values(),
  );
  function submit(event: FormEvent) {
    event.preventDefault();
    setQuery((current) => {
      const next = { ...current, page: 1 };
      const q = search.trim();
      if (q) next.q = q;
      else delete next.q;
      return next;
    });
  }
  return (
    <>
      <ProductPageHeader
        title="Policy version history"
        description="Review every recorded version of information security policies."
        showSampleNotice={false}
        additionalActions={
          onBack && backLabel !== "Published" ? (
            <Button variant="secondary" onClick={onBack}>
              Back to policy workspace
            </Button>
          ) : undefined
        }
      />
      <ProductPanel
        title="Version history"
        description={
          list.data
            ? `${policyGroups.length} policies · ${list.data.pagination.total} versions found`
            : "Search and review policy versions"
        }
      >
        {onBack && backLabel === "Published" ? (
          <PolicyViewTabs
            activeId="history"
            tabs={[
              ...(onBack
                ? [{ id: "default", label: backLabel, onSelect: onBack }]
                : []),
              { id: "history", label: "Version history", onSelect: () => undefined },
            ]}
          />
        ) : null}
        <form
          className="border-border flex flex-col gap-2 border-b p-4 sm:flex-row"
          onSubmit={submit}
        >
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search version history</span>
            <Search
              aria-hidden="true"
              className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              className="w-full pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by policy code or title"
            />
          </label>
          <Select
            className="w-full sm:w-52"
            aria-label="Version status"
            value={query.status}
            onChange={(event) =>
              setQuery((current) => ({
                ...current,
                page: 1,
                status: event.target
                  .value as PolicyVersionHistoryQuery["status"],
              }))
            }
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            {list.data?.canViewDrafts ? (
              <option value="draft">Draft</option>
            ) : null}
            <option value="archived">Archived</option>
          </Select>
          <Button type="submit">Search</Button>
        </form>
        <div className="p-4">
          {list.isPending ? (
            <div
              aria-label="Loading policy version history"
              className="bg-neutral-soft h-64 animate-pulse rounded-xl"
            />
          ) : list.isError ? (
            <Alert>
              Unable to load policy version history. Please try again.
            </Alert>
          ) : policyGroups.length ? (
            <div className="border-border overflow-x-auto rounded-xl border">
              <table className="w-full min-w-[52rem] table-fixed border-collapse text-left text-sm">
                <colgroup>
                  <col className="w-[10%]" />
                  <col className="w-[17%]" />
                  <col className="w-[17%]" />
                  <col className="w-[18%]" />
                  <col className="w-[23%]" />
                  <col className="w-[15%]" />
                </colgroup>
                <thead className="bg-neutral-soft">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Version</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Created by</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold">Change summary</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                {policyGroups.map((policy) => (
                  <tbody key={policy.policyId}>
                    <tr className="border-border bg-neutral-soft/50 border-t">
                      <th
                        className="px-4 py-3 text-left"
                        colSpan={6}
                        scope="rowgroup"
                      >
                        <span className="block font-semibold">
                          {policy.title}
                        </span>
                        <span className="text-muted mt-0.5 block text-xs font-normal">
                          {policy.policyCode} · {policy.versions.length}{" "}
                          {policy.versions.length === 1
                            ? "version"
                            : "versions"}
                        </span>
                      </th>
                    </tr>
                    {policy.versions.map((version) => (
                      <tr
                        className="border-border border-t"
                        key={version.versionId}
                      >
                        <td className="px-4 py-3 font-semibold">
                          v{version.versionNumber}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2">
                            <StatusBadge tone={tone(version.status)}>
                              {version.status}
                            </StatusBadge>
                            {version.status === "published" ? (
                              <span className="text-success text-xs font-medium">
                                Current
                              </span>
                            ) : null}
                          </span>
                        </td>
                        <td
                          className="truncate px-4 py-3"
                          title={version.createdBy?.name ?? "System"}
                        >
                          {version.createdBy?.name ?? "System"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatDate(version.createdAt)}
                        </td>
                        <td
                          className="text-muted truncate px-4 py-3"
                          title={version.changeSummary ?? undefined}
                        >
                          {version.changeSummary ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="secondary"
                            onClick={() =>
                              setSelected({
                                policyId: version.policyId,
                                versionId: version.versionId,
                              })
                            }
                          >
                            <Eye aria-hidden="true" className="size-4" />
                            View details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </div>
          ) : (
            <EmptyState
              title="No policy versions found"
              description="No versions match the current search and status filter."
            />
          )}
        </div>
        {list.data ? (
          <div className="border-border border-t p-4">
            <Pagination
              page={query.page}
              pageCount={list.data.pagination.totalPages}
              onPageChange={(page) =>
                setQuery((current) => ({ ...current, page }))
              }
            />
          </div>
        ) : null}
      </ProductPanel>
      <Dialog
        dialogRef={dialogRef}
        title="Policy version details"
        className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
        onClose={() => setSelected(null)}
      >
        {detail.isPending ? (
          <div className="bg-neutral-soft h-64 animate-pulse rounded-xl" />
        ) : detail.isError ? (
          <Alert>Unable to load this policy version.</Alert>
        ) : detail.data ? (
          <div className="space-y-5">
            <div>
              <p className="text-muted text-xs font-semibold uppercase">
                {detail.data.policyCode} · v{detail.data.version.versionNumber}
              </p>
              <h3 className="mt-1 text-lg font-semibold">
                {detail.data.title}
              </h3>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Status</dt>
                <dd className="mt-1">
                  <StatusBadge tone={tone(detail.data.version.status)}>
                    {detail.data.version.status}
                  </StatusBadge>
                </dd>
              </div>
              <div>
                <dt className="text-muted">Created</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(detail.data.version.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Created by</dt>
                <dd className="mt-1 font-medium">
                  {detail.data.version.createdBy?.name ?? "System"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Published</dt>
                <dd className="mt-1 font-medium">
                  {formatDate(detail.data.version.publishedAt)}
                </dd>
              </div>
            </dl>
            {detail.data.version.changeSummary ? (
              <section>
                <h4 className="text-sm font-semibold">Change summary</h4>
                <p className="text-muted mt-1 text-sm whitespace-pre-wrap">
                  {detail.data.version.changeSummary}
                </p>
              </section>
            ) : null}
            <section>
              <h4 className="text-sm font-semibold">Policy content</h4>
              <div className="border-border bg-background mt-2 max-h-80 overflow-y-auto rounded-lg border p-4 text-sm leading-6 whitespace-pre-wrap">
                {detail.data.version.content}
              </div>
            </section>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
