"use client";

import {
  AlertTriangle,
  BookOpenCheck,
  Eye,
  FileText,
  Files,
  History,
  Info,
  ScrollText,
  Tag,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-display/data-table";
import { ProductPageHeader, ProductPanel, StatusBadge } from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useSessionUser } from "@/features/authentication-account";
import { usePublishedPoliciesForNewVersion } from "../hooks/use-update-policy-version";
import type { PublishedPolicyForNewVersion } from "../schemas/update-policy-version-schema";
import { PolicyViewTabs } from "./policy-view-tabs";

function formatDate(value: string | null | undefined): string {
  return value
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
        new Date(value),
      )
    : "Not recorded";
}

export function PublishedPolicyManager({
  onViewDrafts,
  onViewHistory,
  hideHeader = false,
}: {
  onViewDrafts?: () => void;
  onViewHistory?: () => void;
  hideHeader?: boolean;
}) {
  const session = useSessionUser();
  const allowed = session.data?.permissions.includes("policies.update") ?? false;
  const policies = usePublishedPoliciesForNewVersion(allowed);
  const [selected, setSelected] = useState<PublishedPolicyForNewVersion>();
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
  }, [selected]);

  const columns: readonly DataTableColumn<PublishedPolicyForNewVersion>[] = [
    {
      key: "policy",
      header: "Policy",
      cell: (policy) => (
        <span className="block min-w-56">
          <strong className="block">{policy.title}</strong>
          <span className="text-muted text-xs">{policy.policyCode}</span>
        </span>
      ),
    },
    { key: "version", header: "Version", cell: (policy) => `v${policy.currentVersion ?? "—"}` },
    { key: "status", header: "Status", cell: () => <StatusBadge tone="success">Published</StatusBadge> },
    { key: "published", header: "Published", cell: (policy) => formatDate(policy.publishedAt) },
    {
      key: "action",
      header: "Action",
      cell: (policy) => (
        <Button
          className="min-h-8 gap-1.5 px-2.5 text-xs font-medium"
          variant="secondary"
          onClick={() => setSelected(policy)}
        >
          <Eye aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
          View policy
        </Button>
      ),
    },
  ];

  if (session.isPending)
    return <div aria-label="Checking policy access" className="bg-neutral-soft h-56 animate-pulse rounded-xl" />;
  if (!allowed) return <Alert>Insufficient permissions</Alert>;

  return (
    <>
      {!hideHeader && (
        <ProductPageHeader
          title="Published policies"
          description="View the current official versions of policies you own."
          showSampleNotice={false}
          additionalActions={
            onViewHistory ? (
              <Button variant="secondary" onClick={onViewHistory}>
                <History aria-hidden="true" className="size-4" strokeWidth={1.8} />
                Version history
              </Button>
            ) : undefined
          }
        />
      )}
      {!hideHeader && onViewDrafts ? (
        <div className="mb-5">
          <PolicyViewTabs
            activeId="published"
            tabs={[
              {
                id: "draft-workspace",
                label: "Draft workspace",
                icon: <Files aria-hidden="true" className="size-4" strokeWidth={2} />,
                onSelect: onViewDrafts,
              },
              {
                id: "published",
                label: "Published policies",
                icon: <BookOpenCheck aria-hidden="true" className="size-4" strokeWidth={2} />,
                onSelect: () => undefined,
              },
            ]}
          />
        </div>
      ) : null}
      <ProductPanel
        title="Official policy versions"
        description={policies.data ? `${policies.data.length} policies found` : "Loading backend data"}
      >
        <div className="p-4">
          {policies.isPending ? (
            <div aria-label="Loading published policies" className="bg-neutral-soft h-56 animate-pulse rounded-xl" />
          ) : policies.isError ? (
            <Alert>Unable to load published policies.</Alert>
          ) : policies.data?.length ? (
            <DataTable columns={columns} rows={policies.data} getRowKey={(policy) => policy.id} />
          ) : (
            <EmptyState title="No published policies" description="No owned policy has an official published version yet." />
          )}
        </div>
      </ProductPanel>

      {/* ── Published policy details dialog ── */}
      <Dialog
        className="max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100%-2rem))] overflow-y-auto"
        dialogRef={dialogRef}
        title="Published policy details"
        onClose={() => setSelected(undefined)}
      >
        {selected ? (
          <div className="space-y-5">
            {/* Context bar */}
            <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <FileText className="size-3.5 text-brand" strokeWidth={1.8} />
                {selected.policyCode}
              </span>
              <span className="text-border">·</span>
              <span className="text-muted">
                v{selected.currentVersion ?? "—"}
              </span>
              <span className="text-border">·</span>
              <StatusBadge tone="success">Published</StatusBadge>
            </div>

            {/* Title & description */}
            <div className="min-w-0">
              <h3 className="text-xl font-semibold">{selected.title}</h3>
              {selected.description ? (
                <p className="text-muted mt-1.5 text-sm leading-relaxed">
                  {selected.description}
                </p>
              ) : null}
            </div>

            {/* Metadata fact grid */}
            <dl className="border-border bg-neutral-soft/30 grid gap-x-6 gap-y-4 rounded-xl border p-4 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                  Policy code
                </dt>
                <dd className="mt-1 text-sm font-medium break-all">
                  {selected.policyCode}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                  Current version
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  v{selected.currentVersion ?? "—"}
                </dd>
              </div>
              <div className="min-w-0 sm:col-span-2">
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                  Published at
                </dt>
                <dd className="mt-1 text-sm font-medium">
                  {formatDate(selected.publishedAt)}
                </dd>
              </div>
            </dl>

            {/* Change summary section */}
            <div className="space-y-2">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <Tag
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-semibold">Change summary</h3>
              </div>
              {selected.changeSummary ? (
                <p className="text-sm leading-relaxed">{selected.changeSummary}</p>
              ) : (
                <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                  <Info className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
                  <p className="text-sm text-muted">No change summary was recorded for this version.</p>
                </div>
              )}
            </div>

            {/* Policy content section */}
            <div className="space-y-2">
              <div className="flex items-start gap-2 border-b border-border pb-2">
                <ScrollText
                  className="mt-0.5 size-4 shrink-0 text-brand"
                  strokeWidth={1.8}
                />
                <h3 className="text-sm font-semibold">Policy content</h3>
              </div>
              {selected.content ? (
                <pre className="border-border bg-background max-h-96 overflow-y-auto rounded-lg border p-4 font-sans text-sm leading-6 whitespace-pre-wrap">
                  {selected.content}
                </pre>
              ) : (
                <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-warning"
                    strokeWidth={1.8}
                  />
                  <p className="text-sm text-muted">No policy content is available for this version.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <Button variant="secondary" onClick={() => setSelected(undefined)}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
