"use client";
import { assetTypeLabel } from "../schemas/asset-type-schema";
import { useEffect, useRef, useState } from "react";
import {
  Boxes,
  Building2,
  Clock,
  Info,
} from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import { StatusBadge } from "@/components/data-display/static-product";
import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import {
  useBusinessService,
  useBusinessServiceAssets,
} from "../hooks/use-business-services";
import type { BusinessServiceAsset } from "../schemas/business-service-schema";
import { BusinessServiceError } from "./business-service-feedback";

const columns: readonly DataTableColumn<BusinessServiceAsset>[] = [
  {
    key: "asset",
    header: "Asset",
    cell: (item) => (
      <span className="block min-w-44">
        <strong className="block break-words">{item.name}</strong>
        <span className="text-muted text-xs">{item.assetCode}</span>
      </span>
    ),
  },
  { key: "type", header: "Type", cell: (item) => assetTypeLabel(item.assetType) },
  {
    key: "status",
    header: "Status",
    cell: (item) => (
      <StatusBadge tone={item.status === "active" ? "success" : "neutral"}>
        {item.status === "active" ? "Active" : "Archived"}
      </StatusBadge>
    ),
  },
];

const date = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));

export function BusinessServiceDetailDialog({
  serviceId,
  enabled,
  onClose,
}: {
  serviceId: string;
  enabled: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [page, setPage] = useState(1);
  const detail = useBusinessService(serviceId, enabled);
  const assets = useBusinessServiceAssets(
    serviceId,
    page,
    enabled && detail.isSuccess === true,
  );

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const service = detail.data;

  return (
    <Dialog
      title={service?.name ?? "Business service details"}
      dialogRef={ref}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] w-[min(60rem,calc(100%-2rem))] overflow-y-auto [&>h2]:break-words"
    >
      {!enabled ? (
        <div className="border-border bg-neutral-soft/30 rounded-xl border p-6 text-center space-y-2">
          <Building2 className="text-muted mx-auto size-7" strokeWidth={1.5} />
          <p className="text-sm font-medium">Access unavailable</p>
          <p className="text-muted text-xs">
            Business service access is no longer available.
          </p>
        </div>
      ) : detail.isPending ? (
        <div
          role="status"
          aria-label="Loading business service details"
          aria-busy="true"
          className="space-y-5"
        >
          <span className="sr-only">Loading business service details…</span>
          {/* Context bar skeleton */}
          <Skeleton className="h-11 w-full rounded-lg" />
          {/* Fact grid skeleton */}
          <Skeleton className="h-6 w-40 rounded" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
          {/* Table skeleton */}
          <Skeleton className="h-6 w-32 rounded" />
          <TableSkeleton rows={4} columns={3} />
        </div>
      ) : detail.isError ? (
        <BusinessServiceError
          error={detail.error}
          onRetry={() => void detail.refetch()}
        />
      ) : service ? (
        <div className="space-y-5">
          {/* Context bar */}
          <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
            <Building2 className="size-3.5 shrink-0 text-brand" strokeWidth={1.8} />
            <span className="font-semibold">{service.name}</span>
            <span className="text-muted">·</span>
            <StatusBadge tone={service.status === "active" ? "success" : "neutral"}>
              {service.status === "active" ? "Active" : "Inactive"}
            </StatusBadge>
          </div>

          {/* Description */}
          {service.description ? (
            <p className="text-muted text-sm leading-6 [overflow-wrap:anywhere] whitespace-pre-wrap">
              {service.description}
            </p>
          ) : null}

          {/* Overview section */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <Building2
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={1.8}
              />
              <h3 className="text-sm font-semibold">Service overview</h3>
            </div>
            <dl className="border-border bg-neutral-soft/30 grid gap-x-6 gap-y-4 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="min-w-0">
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                  Status
                </dt>
                <dd className="mt-1">
                  <StatusBadge tone={service.status === "active" ? "success" : "neutral"}>
                    {service.status === "active" ? "Active" : "Inactive"}
                  </StatusBadge>
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                  Responsible owner
                </dt>
                <dd className="mt-1 text-sm font-medium break-words">
                  {service.owner?.fullName ?? "Unassigned"}
                  {service.owner?.inactive ? (
                    <span className="text-muted font-normal"> (Inactive)</span>
                  ) : null}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                  Linked assets
                </dt>
                <dd className="mt-1 text-sm font-medium tabular-nums">
                  {service.linkedAssetsCount}
                </dd>
              </div>
            </dl>
          </div>

          {/* Record information */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <Clock
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={1.8}
              />
              <h3 className="text-sm font-semibold">Record information</h3>
            </div>
            <dl className="border-border bg-neutral-soft/30 grid gap-x-6 gap-y-4 rounded-xl border p-4 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                  Created at (UTC+7)
                </dt>
                <dd className="mt-1 text-sm font-medium tabular-nums">
                  {date(service.createdAt)}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted text-xs font-medium uppercase tracking-wide">
                  Last updated (UTC+7)
                </dt>
                <dd className="mt-1 text-sm font-medium tabular-nums">
                  {date(service.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Inactive notice */}
          {service.status === "inactive" ? (
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <Info
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={1.8}
              />
              <p className="text-muted text-xs leading-5">
                Inactive services remain available for review, but cannot be newly
                selected in Link Asset Context.
              </p>
            </div>
          ) : null}

          {/* Linked assets section */}
          <section aria-labelledby="linked-service-assets" className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <Boxes
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={1.8}
              />
              <h3 id="linked-service-assets" className="text-sm font-semibold">
                Linked assets
              </h3>
            </div>
            <p className="text-muted text-xs leading-5">
              Current links, including archived assets. Viewing this list does not
              update any existing Risk scope or asset snapshot.
            </p>

            {assets.isPending ? (
              <TableSkeleton rows={4} columns={3} />
            ) : assets.isError ? (
              <BusinessServiceError
                error={assets.error}
                onRetry={() => void assets.refetch()}
              />
            ) : assets.data?.items.length ? (
              <>
                <DataTable
                  columns={columns}
                  rows={assets.data.items}
                  getRowKey={(item) => item.id}
                />
                <div className="mt-4">
                  <Pagination
                    page={assets.data.pagination.page}
                    pageCount={assets.data.pagination.totalPages}
                    onPageChange={setPage}
                  />
                </div>
              </>
            ) : (
              <EmptyState
                title="No linked assets on this page"
                description={
                  page > 1
                    ? "Links may have changed. Return to the first page to refresh the view."
                    : "No assets currently reference this business service. Links are managed through Link Asset Context."
                }
              />
            )}

            {page > 1 &&
            !assets.data?.items.length &&
            !assets.isPending &&
            !assets.isError ? (
              <Button variant="secondary" onClick={() => setPage(1)}>
                First page
              </Button>
            ) : null}
          </section>
        </div>
      ) : null}

      {/* Footer */}
      <div className="mt-5 flex items-center justify-end border-t border-border pt-4">
        <Button variant="secondary" onClick={() => ref.current?.close()}>
          Close
        </Button>
      </div>
    </Dialog>
  );
}