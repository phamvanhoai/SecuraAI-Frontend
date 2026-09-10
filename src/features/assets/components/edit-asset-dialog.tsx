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
import { useAssetCreateOptions } from "../hooks/use-asset-create-options";
import { useUpdateAsset } from "../hooks/use-update-asset";
import {
  updateAssetSchema,
  type UpdateAssetInput,
  type UpdateAssetRequest,
} from "../schemas/update-asset-schema";
import type { AssetListItem } from "../schemas/asset-list-schema";

const statusLabels = {
  active: "Active",
  inactive: "Inactive",
  retired: "Retired",
  disposed: "Disposed",
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
  const options = useAssetCreateOptions(assetId !== null);
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
      departmentId: detail.data.department?.id ?? "",
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
      toast.success("Đã cập nhật tài sản", `${asset.assetCode} – ${asset.name}`);
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
      title="Edit IT Asset"
      dialogRef={dialogRef}
      onClose={close}
      className="w-[min(40rem,calc(100%-2rem))]"
    >
      {detail.isPending ? (
        <p className="text-muted py-8 text-center">Loading asset information…</p>
      ) : null}
      {detail.isError ? (
        <Alert>
          <strong className="block">Unable to load asset</strong>
          <span>The asset may not exist or you do not have access.</span>
        </Alert>
      ) : null}
      {detail.data ? (
        <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">{message}</Alert>
          ) : null}
          {disposed ? (
            <Alert>Disposed assets cannot be edited.</Alert>
          ) : null}
          <p className="text-muted text-sm">Asset code: {detail.data.assetCode}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="edit-name" label="Asset name" error={errors.name?.message}>
              <Input id="edit-name" maxLength={150} disabled={disposed} {...register("name")} />
            </FormField>
            <FormField id="edit-assetType" label="Asset type" error={errors.assetType?.message}>
              <Input id="edit-assetType" maxLength={50} disabled={disposed} {...register("assetType")} />
            </FormField>
            <FormField id="edit-departmentId" label="Department" error={errors.departmentId?.message}>
              <Select
                id="edit-departmentId"
                disabled={disposed || options.isPending}
                {...register("departmentId")}
              >
                <option value="">
                  {options.isPending ? "Loading departments…" : "No department assigned"}
                </option>
                {(options.data?.departments ?? []).map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.code} – {department.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField id="edit-hostname" label="Hostname" error={errors.hostname?.message}>
              <Input id="edit-hostname" maxLength={255} disabled={disposed} {...register("hostname")} />
            </FormField>
            <FormField id="edit-ipAddress" label="IP address" error={errors.ipAddress?.message}>
              <Input id="edit-ipAddress" disabled={disposed} {...register("ipAddress")} />
            </FormField>
            <FormField id="edit-location" label="Location" error={errors.location?.message}>
              <Input id="edit-location" maxLength={255} disabled={disposed} {...register("location")} />
            </FormField>
            <FormField id="edit-status" label="Status" error={errors.status?.message}>
              <Select id="edit-status" disabled={disposed} {...register("status")}>
                {allowedStatusTransitions[detail.data.status].map((status) => (
                  <option value={status} key={status}>{statusLabels[status]}</option>
                ))}
              </Select>
            </FormField>
          </div>
          <FormField id="edit-description" label="Description" error={errors.description?.message}>
            <Textarea id="edit-description" maxLength={10_000} disabled={disposed} {...register("description")} />
          </FormField>
          {options.isError ? (
            <Alert className="border-warning/25 bg-warning/10">
              Unable to load departments. You can keep the current department.
            </Alert>
          ) : null}
          <p className="text-muted text-xs">
            Criticality can only be changed through Classify Asset Criticality.
          </p>
          <div className="flex justify-end gap-2">
            <Button className="bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={disposed || mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
