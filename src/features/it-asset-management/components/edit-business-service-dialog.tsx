"use client";
import { useEffect, useRef } from "react";
import { Building2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinessService } from "../hooks/use-business-services";
import { BusinessServiceError } from "./business-service-feedback";
import { CreateBusinessServiceDialog } from "./create-business-service-dialog";

export function EditBusinessServiceDialog({
  serviceId,
  onClose,
}: {
  serviceId: string;
  onClose: () => void;
}) {
  const detail = useBusinessService(serviceId, true, true);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (
      !detail.isFetchedAfterMount ||
      !detail.data ||
      detail.data.status !== "active" ||
      detail.isError
    )
      ref.current?.showModal();
  }, [detail.data, detail.isFetchedAfterMount, detail.isError]);

  if (detail.isFetchedAfterMount && detail.data?.status === "active" && !detail.isError)
    return (
      <CreateBusinessServiceDialog
        editingService={detail.data}
        onEditClose={onClose}
        onCreated={() => {}}
      />
    );

  return (
    <Dialog
      title="Edit Business Service"
      dialogRef={ref}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] w-[min(40rem,calc(100%-2rem))] overflow-y-auto"
    >
      {detail.isError ? (
        <BusinessServiceError
          error={detail.error}
          onRetry={() => void detail.refetch()}
        />
      ) : !detail.isFetchedAfterMount || detail.isPending ? (
        <div
          role="status"
          aria-busy="true"
          aria-label="Loading business service"
          className="space-y-5"
        >
          <span className="sr-only">Loading business service…</span>
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      ) : (
        <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
          <Building2 className="mt-0.5 size-4 shrink-0 text-muted" strokeWidth={1.8} />
          <p className="text-muted text-xs leading-5">
            Inactive business services are read-only and cannot be edited.
          </p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-end border-t border-border pt-4">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
}