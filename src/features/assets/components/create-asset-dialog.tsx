"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateAsset } from "../hooks/use-create-asset";
import {
  createAssetSchema,
  type CreateAssetInput,
  type CreateAssetRequest,
} from "../schemas/create-asset-schema";

const defaults: CreateAssetInput = {
  assetCode: "",
  name: "",
  assetType: "",
  description: "",
  criticality: "medium",
  hostname: "",
  ipAddress: "",
  location: "",
};

export function CreateAssetDialog() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const mutation = useCreateAsset();
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAssetInput, unknown, CreateAssetRequest>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  const close = (): void => {
    setOpen(false);
    setMessage(undefined);
  };
  const submit = async (values: CreateAssetRequest): Promise<void> => {
    setMessage(undefined);
    try {
      const asset = await mutation.mutateAsync(values);
      reset(defaults);
      close();
      toast.success("Đã tạo tài sản", `${asset.assetCode} – ${asset.name}`);
    } catch (error: unknown) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Không thể tạo tài sản. Vui lòng thử lại.",
      );
    }
  };

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />
        Thêm tài sản
      </Button>
      <Dialog dialogRef={dialog} title="Tạo tài sản CNTT" onClose={close}>
        <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              id="assetCode"
              label="Mã tài sản"
              error={errors.assetCode?.message}
            >
              <Input
                id="assetCode"
                maxLength={50}
                aria-invalid={Boolean(errors.assetCode)}
                aria-describedby={
                  errors.assetCode ? "assetCode-error" : undefined
                }
                {...register("assetCode")}
              />
            </FormField>
            <FormField
              id="name"
              label="Tên tài sản"
              error={errors.name?.message}
            >
              <Input
                id="name"
                maxLength={150}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "name-error" : undefined}
                {...register("name")}
              />
            </FormField>
            <FormField
              id="assetType"
              label="Loại tài sản"
              error={errors.assetType?.message}
            >
              <Input
                id="assetType"
                maxLength={50}
                placeholder="server, laptop..."
                aria-invalid={Boolean(errors.assetType)}
                aria-describedby={
                  errors.assetType ? "assetType-error" : undefined
                }
                {...register("assetType")}
              />
            </FormField>
            <FormField
              id="criticality"
              label="Mức quan trọng"
              error={errors.criticality?.message}
            >
              <Select id="criticality" {...register("criticality")}>
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="critical">Rất cao</option>
              </Select>
            </FormField>
            <FormField
              id="hostname"
              label="Hostname"
              error={errors.hostname?.message}
            >
              <Input id="hostname" maxLength={255} {...register("hostname")} />
            </FormField>
            <FormField
              id="ipAddress"
              label="Địa chỉ IP"
              error={errors.ipAddress?.message}
            >
              <Input
                id="ipAddress"
                placeholder="192.168.1.10"
                aria-invalid={Boolean(errors.ipAddress)}
                aria-describedby={
                  errors.ipAddress ? "ipAddress-error" : undefined
                }
                {...register("ipAddress")}
              />
            </FormField>
            <FormField
              id="location"
              label="Vị trí"
              error={errors.location?.message}
            >
              <Input id="location" maxLength={255} {...register("location")} />
            </FormField>
          </div>
          <FormField
            id="description"
            label="Mô tả"
            error={errors.description?.message}
          >
            <Textarea
              id="description"
              maxLength={10_000}
              {...register("description")}
            />
          </FormField>
          <p className="text-muted text-xs">
            Phòng ban và chủ sở hữu có thể được gán sau khi tạo tài sản.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              className="bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
              type="button"
              onClick={close}
            >
              Hủy
            </Button>
            <Button disabled={mutation.isPending} type="submit">
              {mutation.isPending ? "Đang tạo…" : "Tạo tài sản"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
