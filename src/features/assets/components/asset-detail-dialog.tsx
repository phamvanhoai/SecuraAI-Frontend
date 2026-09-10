"use client";

import { useEffect, useRef } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useAssetDetail } from "../hooks/use-asset-detail";

const criticalityLabels = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Rất cao",
} as const;
const statusLabels = {
  active: "Đang hoạt động",
  inactive: "Không hoạt động",
  retired: "Đã ngừng sử dụng",
  disposed: "Đã thanh lý",
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
      title="Chi tiết tài sản"
      dialogRef={dialogRef}
      onClose={onClose}
      className="w-[min(44rem,calc(100%-2rem))]"
    >
      {detail.isPending ? (
        <p className="text-muted py-8 text-center">
          Đang tải chi tiết tài sản…
        </p>
      ) : null}
      {detail.isError ? (
        <Alert>
          <strong className="block">Không thể tải chi tiết tài sản</strong>
          <span>
            Tài sản có thể không tồn tại hoặc bạn không có quyền truy cập.
          </span>
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
            <Detail label="Loại tài sản" value={detail.data.assetType} />
            <Detail
              label="Mức quan trọng"
              value={criticalityLabels[detail.data.criticality]}
            />
            <Detail
              label="Trạng thái"
              value={statusLabels[detail.data.status]}
            />
            <Detail label="Hostname" value={detail.data.hostname} />
            <Detail label="Địa chỉ IP" value={detail.data.ipAddress} />
            <Detail label="Vị trí" value={detail.data.location} />
            <Detail label="Đơn vị" value={detail.data.department?.name} />
            <Detail label="Chủ sở hữu" value={detail.data.owner?.fullName} />
            <Detail
              label="Ngày tạo"
              value={formatDate(detail.data.createdAt)}
            />
            <Detail
              label="Cập nhật gần nhất"
              value={formatDate(detail.data.updatedAt)}
            />
          </dl>
        </div>
      ) : null}
      <div className="mt-6 flex justify-end">
        <Button onClick={() => dialogRef.current?.close()} variant="secondary">
          Đóng
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
      <dd className="mt-1 text-sm font-medium">
        {value ?? "Chưa có thông tin"}
      </dd>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
