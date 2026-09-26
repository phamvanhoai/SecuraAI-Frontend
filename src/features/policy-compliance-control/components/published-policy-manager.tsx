"use client";

import { Eye, History } from "lucide-react";
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
}: {
  onViewDrafts?: () => void;
  onViewHistory?: () => void;
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
        <Button variant="secondary" onClick={() => setSelected(policy)}>
          <Eye aria-hidden="true" className="size-4" strokeWidth={1.8} />
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
      <ProductPanel
        title="Official policy versions"
        description={policies.data ? `${policies.data.length} policies found` : "Loading backend data"}
      >
        <PolicyViewTabs
          activeId="published"
          tabs={[
            ...(onViewDrafts
              ? [{ id: "drafts", label: "Drafts", onSelect: onViewDrafts }]
              : []),
            { id: "published", label: "Published", onSelect: () => undefined },
          ]}
        />
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
      <Dialog
        className="max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100%-2rem))] overflow-y-auto"
        dialogRef={dialogRef}
        title="Published policy details"
        onClose={() => setSelected(undefined)}
      >
        {selected ? (
          <div className="space-y-5">
            <div>
              <p className="text-muted text-xs font-semibold uppercase">
                {selected.policyCode} · v{selected.currentVersion ?? "—"}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{selected.title}</h3>
              {selected.description ? <p className="text-muted mt-2 text-sm">{selected.description}</p> : null}
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted">Published</dt>
              <dd>{formatDate(selected.publishedAt)}</dd>
              <dt className="text-muted">Change summary</dt>
              <dd>{selected.changeSummary ?? "No change summary provided"}</dd>
            </dl>
            <section aria-label="Policy content" className="border-border bg-background max-h-96 overflow-y-auto rounded-lg border p-4 text-sm leading-6 whitespace-pre-wrap">
              {selected.content ?? "No policy content is available."}
            </section>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setSelected(undefined)}>Close</Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </>
  );
}
