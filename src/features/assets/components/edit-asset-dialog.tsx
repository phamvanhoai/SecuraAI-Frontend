"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAssetDetail } from "../hooks/use-asset-detail";
import { useUpdateAsset } from "../hooks/use-update-asset";
import {
  updateAssetSchema,
  type UpdateAssetInput,
  type UpdateAssetRequest,
} from "../schemas/update-asset-schema";
import type { AssetListItem } from "../schemas/asset-list-schema";

const statusLabels = {
  active: "Đang hoạt động",
  inactive: "Không hoạt động",
  retired: "Đã ngừng sử dụng",
  disposed: "Đã thanh lý",
} as const;
const allowedStatusTransitions: Readonly<
  Record<AssetListItem["status"], readonly AssetListItem["status"][]>
> = {
  active: ["active", "inactive", "retired", "disposed"],
  inactive: ["inactive", "active", "retired", "disposed"],
  retired: ["retired", "active", "disposed"],
  disposed: ["disposed"],
};

export function EditAssetDialog({
  assetId,
  onClose,
}: {
  assetId: string | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const detail = useAssetDetail(assetId);
  const mutation = useUpdateAsset(assetId);
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateAssetInput, unknown, UpdateAssetRequest>({
    resolver: zodResolver(updateAssetSchema),
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (assetId && !dialog.open) dialog.showModal();
    if (!assetId && dialog.open) dialog.close();
  }, [assetId]);

  useEffect(() => {
    if (!detail.data) return;
    reset({
      name: detail.data.name,
      assetType: detail.data.assetType,
      description: detail.data.description ?? "",
      hostname: detail.data.hostname ?? "",
      ipAddress: detail.data.ipAddress ?? "",
      location: detail.data.location ?? "",
      status: detail.data.status,
    });
  }, [detail.data, reset]);

  const close = (): void => {
    setMessage(undefined);
    onClose();
  };
  const submit = async (values: UpdateAssetRequest): Promise<void> => {
    setMessage(undefined);
    try {
      const asset = await mutation.mutateAsync(values);
      close();
      toast.success(
        "Đã cập nhật tài sản",
        `${asset.assetCode} – ${asset.name}`,
      );
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không thể cập nhật tài sản. Vui lòng thử lại.",
      );
    }
  };

  const disposed = detail.data?.status === "disposed";
  return (
    <Dialog
      title="Chỉnh sửa tài sản CNTT"
      dialogRef={dialogRef}
      onClose={close}
      className="w-[min(40rem,calc(100%-2rem))]"
    >
      {detail.isPending ? (
        <p className="text-muted py-8 text-center">
          Đang tải thông tin tài sản…
        </p>
      ) : null}
      {detail.isError ? (
        <Alert>
          <strong className="block">Không thể tải tài sản</strong>
          <span>
            Tài sản có thể không tồn tại hoặc bạn không có quyền truy cập.
          </span>
        </Alert>
      ) : null}
      {detail.data ? (
        <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          {disposed ? (
            <Alert>Tài sản đã thanh lý nên không thể chỉnh sửa.</Alert>
          ) : null}
          <p className="text-muted text-sm">
            Mã tài sản: {detail.data.assetCode}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="edit-name"
              label="Tên tài sản"
              error={errors.name?.message}
            >
              <Input
                id="edit-name"
                maxLength={150}
                disabled={disposed}
                {...register("name")}
              />
            </FormField>
            <FormField
              id="edit-assetType"
              label="Loại tài sản"
              error={errors.assetType?.message}
            >
              <Input
                id="edit-assetType"
                maxLength={50}
                disabled={disposed}
                {...register("assetType")}
              />
            </FormField>
            <FormField
              id="edit-hostname"
              label="Hostname"
              error={errors.hostname?.message}
            >
              <Input
                id="edit-hostname"
                maxLength={255}
                disabled={disposed}
                {...register("hostname")}
              />
            </FormField>
            <FormField
              id="edit-ipAddress"
              label="Địa chỉ IP"
              error={errors.ipAddress?.message}
            >
              <Input
                id="edit-ipAddress"
                disabled={disposed}
                {...register("ipAddress")}
              />
            </FormField>
            <FormField
              id="edit-location"
              label="Vị trí"
              error={errors.location?.message}
            >
              <Input
                id="edit-location"
                maxLength={255}
                disabled={disposed}
                {...register("location")}
              />
            </FormField>
            <FormField
              id="edit-status"
              label="Trạng thái"
              error={errors.status?.message}
            >
              <Select
                id="edit-status"
                disabled={disposed}
                {...register("status")}
              >
                {allowedStatusTransitions[detail.data.status].map((status) => (
                  <option value={status} key={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
          <FormField
            id="edit-description"
            label="Mô tả"
            error={errors.description?.message}
          >
            <Textarea
              id="edit-description"
              maxLength={10_000}
              disabled={disposed}
              {...register("description")}
            />
          </FormField>
          <p className="text-muted text-xs">
            Mức quan trọng được thay đổi bằng chức năng Classify Asset
            Criticality riêng.
          </p>
          <div className="flex justify-end gap-2">
            <Button onClick={close} variant="secondary">
              Hủy
            </Button>
            <Button type="submit" disabled={disposed || mutation.isPending}>
              {mutation.isPending ? "Đang lưu…" : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
