"use client";
import { useEffect, useRef, useState } from "react";
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
  { key: "type", header: "Type", cell: (item) => item.assetType },
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
        <p>Business service access is no longer available.</p>
      ) : detail.isPending ? (
        <div
          role="status"
          aria-label="Loading business service details"
          className="space-y-4"
        >
          <Skeleton className="h-16" />
          <Skeleton className="h-32" />
        </div>
      ) : detail.isError ? (
        <BusinessServiceError
          error={detail.error}
          onRetry={() => void detail.refetch()}
        />
      ) : service ? (
        <div className="space-y-5">
          <p className="text-muted [overflow-wrap:anywhere] whitespace-pre-wrap">
            {service.description || "No description provided."}
          </p>
          <dl className="border-border bg-neutral-soft/40 grid gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-muted text-xs">Status</dt>
              <dd className="mt-1">
                <StatusBadge
                  tone={service.status === "active" ? "success" : "neutral"}
                >
                  {service.status === "active" ? "Active" : "Inactive"}
                </StatusBadge>
              </dd>
            </div>
            <div>
              <dt className="text-muted text-xs">Responsible owner</dt>
              <dd className="mt-1 break-words">
                {service.owner?.fullName ?? "Unassigned"}
                {service.owner?.inactive ? " (Inactive)" : ""}
              </dd>
            </div>
            <div>
              <dt className="text-muted text-xs">
                Linked assets (all statuses)
              </dt>
              <dd className="mt-1 tabular-nums">{service.linkedAssetsCount}</dd>
            </div>
            <div>
              <dt className="text-muted text-xs">Created at (UTC+7)</dt>
              <dd className="mt-1 tabular-nums">{date(service.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-muted text-xs">Last updated (UTC+7)</dt>
              <dd className="mt-1 tabular-nums">{date(service.updatedAt)}</dd>
            </div>
          </dl>
          {service.status === "inactive" ? (
            <p className="text-muted text-sm">
              Inactive services remain available for review, but cannot be newly
              selected in Link Asset Context.
            </p>
          ) : null}
          <section aria-labelledby="linked-service-assets">
            <h3 id="linked-service-assets" className="mb-2 font-semibold">
              Linked assets
            </h3>
            <p className="text-muted mb-3 text-sm">
              Current links, including archived assets. Viewing this list does
              not update any existing Risk scope or asset snapshot.
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
      <div className="mt-5 flex justify-end">
        <Button variant="secondary" onClick={() => ref.current?.close()}>
          Close
        </Button>
      </div>
    </Dialog>
  );
}
