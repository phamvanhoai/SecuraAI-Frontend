"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/api-error";
import { useDeleteAsset } from "../hooks/use-delete-asset";
import type { AssetListItem } from "../schemas/asset-list-schema";

export function DeleteAssetDialog({
  asset,
  onClose,
}: {
  asset: AssetListItem | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string>();
  const mutation = useDeleteAsset();
  const toast = useToast();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (asset && !dialog.open) dialog.showModal();
    if (!asset && dialog.open) dialog.close();
    setConfirmation("");
    setMessage(undefined);
  }, [asset]);

  const close = (): void => {
    setConfirmation("");
    setMessage(undefined);
    onClose();
  };
  const remove = async (): Promise<void> => {
    if (!asset || confirmation.trim() !== asset.assetCode) return;
    setMessage(undefined);
    try {
      await mutation.mutateAsync(asset.id);
      close();
      toast.success("Đã xóa tài sản", `${asset.assetCode} – ${asset.name}`);
    } catch (error: unknown) {
      setMessage(
        error instanceof ApiError && error.status === 409
          ? "Không thể xóa vì tài sản đang được sử dụng bởi dữ liệu nghiệp vụ đang hoạt động."
          : error instanceof Error
            ? error.message
            : "Không thể xóa tài sản. Vui lòng thử lại.",
      );
    }
  };

  return (
    <Dialog
      title="Xóa tài sản"
      dialogRef={dialogRef}
      onClose={close}
      className="w-[min(32rem,calc(100%-2rem))]"
    >
      {asset ? (
        <div className="space-y-4">
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            Tài sản sẽ bị xóa khỏi danh sách. Hệ thống sẽ từ chối nếu tài sản còn liên kết nghiệp vụ đang hoạt động.
          </Alert>
          <p className="text-sm leading-6">
            Bạn đang xóa <strong>{asset.assetCode}</strong> – {asset.name}.
          </p>
          <label className="block space-y-2" htmlFor="delete-asset-confirmation">
            <span className="text-sm font-medium">
              Nhập mã <strong>{asset.assetCode}</strong> để xác nhận
            </span>
            <Input
              id="delete-asset-confirmation"
              autoComplete="off"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">{message}</Alert>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              className="bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
              onClick={close}
            >
              Hủy
            </Button>
            <Button
              className="bg-danger text-white hover:opacity-90"
              disabled={confirmation.trim() !== asset.assetCode || mutation.isPending}
              onClick={remove}
            >
              {mutation.isPending ? "Đang xóa…" : "Xóa tài sản"}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
