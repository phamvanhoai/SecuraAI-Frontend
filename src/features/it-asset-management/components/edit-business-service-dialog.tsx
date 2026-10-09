"use client";
import { useEffect, useRef } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
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
  if (
    detail.isFetchedAfterMount &&
    detail.data?.status === "active" &&
    !detail.isError
  )
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
      className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
    >
      {detail.isError ? (
        <BusinessServiceError
          error={detail.error}
          onRetry={() => void detail.refetch()}
        />
      ) : !detail.isFetchedAfterMount || detail.isPending ? (
        <TableSkeleton rows={3} columns={2} />
      ) : (
        <p>Inactive business services are read-only.</p>
      )}
      <Button variant="secondary" onClick={onClose}>
        Close
      </Button>
    </Dialog>
  );
}
