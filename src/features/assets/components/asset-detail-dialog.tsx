"use client";

import { useEffect, useRef } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useAssetDetail } from "../hooks/use-asset-detail";

const criticalityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
} as const;
const statusLabels = {
  active: "Active",
  inactive: "Inactive",
  retired: "Retired",
  disposed: "Disposed",
} as const;

export function AssetDetailDialog({
  assetId,
  onClose,
}: {
  assetId: string | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const detail = useAssetDetail(assetId);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (assetId && !dialog.open) dialog.showModal();
    if (!assetId && dialog.open) dialog.close();
  }, [assetId]);

  return (
    <Dialog
      title="Asset Details"
      dialogRef={dialogRef}
      onClose={onClose}
      className="w-[min(44rem,calc(100%-2rem))]"
    >
      {detail.isPending ? (
        <p className="text-muted py-8 text-center">Loading asset details…</p>
      ) : null}
      {detail.isError ? (
        <Alert>
          <strong className="block">Unable to load asset details</strong>
          <span>The asset may not exist or you do not have access.</span>
        </Alert>
      ) : null}
      {detail.data ? (
        <div className="space-y-5">
          <div>
            <p className="text-muted text-sm">{detail.data.assetCode}</p>
            <h3 className="mt-1 text-xl font-semibold">{detail.data.name}</h3>
            {detail.data.description ? (
              <p className="text-muted mt-2 text-sm leading-6">
                {detail.data.description}
              </p>
            ) : null}
          </div>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <Detail label="Asset type" value={detail.data.assetType} />
            <Detail
              label="Criticality"
              value={criticalityLabels[detail.data.criticality]}
            />
            <Detail label="Status" value={statusLabels[detail.data.status]} />
            <Detail label="Hostname" value={detail.data.hostname} />
            <Detail label="IP address" value={detail.data.ipAddress} />
            <Detail label="Location" value={detail.data.location} />
            <Detail label="Department" value={detail.data.department?.name} />
            <Detail label="Owner" value={detail.data.owner?.fullName} />
            <Detail
              label="Created at"
              value={formatDate(detail.data.createdAt)}
            />
            <Detail
              label="Last updated"
              value={formatDate(detail.data.updatedAt)}
            />
          </dl>
        </div>
      ) : null}
      <div className="mt-6 flex justify-end">
        <Button onClick={() => dialogRef.current?.close()} variant="secondary">
          Close
        </Button>
      </div>
    </Dialog>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value ?? "Not available"}</dd>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
