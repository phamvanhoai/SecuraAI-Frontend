"use client";

import { Ellipsis, Eye, Search } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton";
import {
  usePolicyReview,
  usePublishablePolicies,
  usePublishPolicyVersion,
} from "../hooks/use-policy-publication";
import type {
  PublishablePolicy,
  PublishablePolicyQuery,
} from "../schemas/policy-publication-schema";

const initialQuery: PublishablePolicyQuery = {
  page: 1,
  limit: 20,
  sortBy: "updatedAt",
  sortOrder: "desc",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Please try again.";
}

export function PolicyPublicationManager() {
  const toast = useToast();
  const [query, setQuery] = useState(initialQuery);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{
    policyId: string;
    versionId: string;
  } | null>(null);
  const [effectiveDate, setEffectiveDate] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const policies = usePublishablePolicies(query);
  const review = usePolicyReview(
    selected?.policyId ?? null,
    selected?.versionId ?? null,
  );
  const publish = usePublishPolicyVersion();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
  }, [selected]);

  const columns = useMemo<readonly DataTableColumn<PublishablePolicy>[]>(
    () => [
      {
        key: "code",
        header: "Policy",
        cell: (item) => (
          <span>
            <strong className="block">{item.title}</strong>
            <span className="text-muted text-xs">{item.policyCode}</span>
          </span>
        ),
      },
      {
        key: "version",
        header: "Version",
        cell: (item) => `v${item.draftVersion.versionNumber}`,
      },
      {
        key: "status",
        header: "Status",
        cell: () => (
          <StatusBadge tone="warning">Pending publication</StatusBadge>
        ),
      },
      {
        key: "updatedAt",
        header: "Updated",
        cell: (item) => formatDate(item.updatedAt),
      },
      {
        key: "actions",
        header: "Actions",
        cell: (item) => (
          <DropdownMenu
            className="w-fit"
            label={
              <span className="grid size-6 place-items-center">
                <span className="sr-only">Actions for {item.title}</span>
                <Ellipsis
                  aria-hidden="true"
                  className="size-5"
                  strokeWidth={1.8}
                />
              </span>
            }
          >
            <button
              className="hover:bg-neutral-soft focus-visible:outline-brand flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2"
              onClick={(event) => {
                closeActionMenu(event);
                setSelected({
                  policyId: item.id,
                  versionId: item.draftVersion.id,
                });
              }}
              type="button"
            >
              <Eye aria-hidden="true" className="size-4" strokeWidth={1.8} />
              Review details
            </button>
          </DropdownMenu>
        ),
      },
    ],
    [],
  );

  function closeActionMenu(event: MouseEvent<HTMLButtonElement>): void {
    event.currentTarget.closest("details")?.removeAttribute("open");
  }

  function submitSearch(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const q = search.trim();
    setQuery((current) => {
      if (q) return { ...current, page: 1, q };
      const next = { ...current };
      delete next.q;
      return { ...next, page: 1 };
    });
  }

  async function confirmPublish(): Promise<void> {
    if (!selected) return;
    try {
      await publish.mutateAsync({
        ...selected,
        ...(effectiveDate ? { effectiveDate } : {}),
      });
      toast.success(
        "Policy published",
        "The official version was published and recorded in the audit log.",
      );
      setSelected(null);
      setEffectiveDate("");
    } catch (error: unknown) {
      toast.error("Unable to publish policy", errorMessage(error));
    }
  }

  const total = policies.data?.pagination.total ?? 0;
  const pageItems = policies.data?.items ?? [];
  const describedCount = pageItems.filter((item) => item.description).length;
  const ownerCount = new Set(
    pageItems.flatMap((item) => (item.ownerUserId ? [item.ownerUserId] : [])),
  ).size;
  return (
    <>
      <ProductPageHeader
        description="Review draft content and publish official information security policy versions."
        showSampleNotice={false}
        title="Publish official policy versions"
      />
      <MetricStrip
        ariaLabel="Policy publication metrics"
        metrics={[
          {
            label: "Pending publication",
            value: String(total),
            detail: "Draft versions ready for review",
            tone: "warning",
            loading: policies.isPending,
          },
          {
            label: "On this page",
            value: String(pageItems.length),
            detail: `Up to ${query.limit} policy drafts`,
            tone: "neutral",
            loading: policies.isPending,
          },
          {
            label: "With description",
            value: String(describedCount),
            detail: "On the current page",
            tone: "neutral",
            loading: policies.isPending,
          },
          {
            label: "Draft owners",
            value: String(ownerCount),
            detail: "Unique owners on this page",
            tone: "neutral",
            loading: policies.isPending,
          },
        ]}
      />
      <ProductPanel
        description={
          policies.data
            ? `${policies.data.pagination.total} policy drafts found`
            : "Backend-managed policy drafts ready for publication"
        }
        title="Policy drafts awaiting publication"
      >
        <form
          className="border-border flex gap-2 border-b p-4"
          onSubmit={submitSearch}
        >
          <label className="relative block w-full max-w-md">
            <span className="sr-only">Search policy drafts</span>
            <Search
              aria-hidden="true"
              className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              className="pl-9"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by policy code or title"
              value={search}
            />
          </label>
          <Button className="min-h-10" type="submit">
            Search
          </Button>
        </form>
        <div className="p-4">
          {policies.isPending ? (
            <TableSkeleton
              columns={5}
              label="Loading policy drafts awaiting publication"
            />
          ) : policies.isError ? (
            <Alert>
              <strong className="block">
                Unable to load policy drafts awaiting publication
              </strong>
              <span>{errorMessage(policies.error)}</span>
            </Alert>
          ) : policies.data?.items.length === 0 ? (
            <p className="text-muted py-10 text-center">
              No policy drafts awaiting publication were found.
            </p>
          ) : policies.data ? (
            <DataTable
              columns={columns}
              getRowKey={(item) => item.id}
              rows={policies.data.items}
            />
          ) : null}
        </div>
        {policies.data ? (
          <div className="border-border border-t p-4">
            <Pagination
              onPageChange={(page) =>
                setQuery((current) => ({ ...current, page }))
              }
              page={query.page}
              pageCount={policies.data?.pagination.totalPages ?? 0}
            />
          </div>
        ) : null}
      </ProductPanel>

      <Dialog
        className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
        dialogRef={dialogRef}
        onClose={() => setSelected(null)}
        title="Review policy version"
      >
        {review.isPending ? (
          <div aria-label="Loading policy content" className="space-y-3">
            <div className="bg-neutral-soft h-5 animate-pulse rounded" />
            <div className="bg-neutral-soft h-40 animate-pulse rounded" />
          </div>
        ) : review.isError ? (
          <Alert>{errorMessage(review.error)}</Alert>
        ) : review.data ? (
          <div className="space-y-5">
            <div>
              <p className="text-muted text-xs font-semibold uppercase">
                {review.data.policyCode} · v{review.data.version.versionNumber}
              </p>
              <h3 className="mt-1 text-base font-semibold">
                {review.data.title}
              </h3>
              {review.data.description ? (
                <p className="text-muted mt-1 text-sm">
                  {review.data.description}
                </p>
              ) : null}
            </div>
            <section
              aria-label="Policy content"
              className="border-border bg-background max-h-72 overflow-y-auto rounded-lg border p-4 text-sm leading-6 whitespace-pre-wrap"
            >
              {review.data.version.content}
            </section>
            {review.data.version.changeSummary ? (
              <p className="text-muted text-sm">
                <strong className="text-foreground">Change summary:</strong>{" "}
                {review.data.version.changeSummary}
              </p>
            ) : null}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">
                Effective date
              </span>
              <Input
                onChange={(event) => setEffectiveDate(event.target.value)}
                type="date"
                value={effectiveDate}
              />
              <span className="text-muted mt-1 block text-xs">
                Leave blank to use the current publication date.
              </span>
            </label>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button onClick={() => setSelected(null)} variant="secondary">
                Cancel
              </Button>
              <Button disabled={publish.isPending} onClick={confirmPublish}>
                {publish.isPending ? "Publishing..." : "Publish version"}
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
