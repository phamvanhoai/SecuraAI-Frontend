"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, HardDrive, Info, Loader2, Tag } from "lucide-react";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAssetDetail } from "../hooks/use-asset-detail";
import { useUpdateAsset } from "../hooks/use-update-asset";
import { assetTypes, assetTypeLabels } from "../schemas/asset-type-schema";
import {
  updateAssetSchema,
  type UpdateAssetInput,
  type UpdateAssetRequest,
} from "../schemas/update-asset-schema";

export function EditAssetDialog({
  assetId,
  onClose,
}: {
  assetId: string | null;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
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
    const element = dialog.current;
    if (!element) return;
    if (assetId && !element.open) element.showModal();
    if (!assetId && element.open) element.close();
  }, [assetId]);

  useEffect(() => {
    if (!detail.data) return;
    reset({
      name: detail.data.name,
      assetType: detail.data.assetType,
      description: detail.data.description ?? "",
    });
  }, [detail.data, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      const asset = await mutation.mutateAsync(values);
      onClose();
      toast.success("Asset updated", `${asset.assetCode} - ${asset.name}`);
    } catch (error: unknown) {
      toast.error(
        "Unable to update asset",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  });

  return (
    <Dialog
      dialogRef={dialog}
      title="Edit IT Asset"
      onClose={onClose}
      className="w-[min(36rem,calc(100%-2rem))]"
    >
      {detail.isPending ? (
        <div
          role="status"
          aria-label="Loading asset information"
          aria-busy="true"
          className="space-y-5"
        >
          <span className="sr-only">Loading asset information…</span>
          {/* Context bar skeleton */}
          <Skeleton className="h-11 w-full rounded-lg" />
          {/* Fields skeleton */}
          <Skeleton className="h-5 w-32 rounded" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-5 w-32 rounded" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : detail.isError ? (
        <div className="border-border bg-neutral-soft/30 rounded-xl border p-6 text-center space-y-3">
          <HardDrive
            className="text-muted mx-auto mb-1 size-8"
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium">Unable to load asset</p>
          <p className="text-muted text-xs">
            The selected asset may not exist or you may not have access.
          </p>
          <Button
            variant="secondary"
            className="mt-1"
            onClick={() => void detail.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : detail.data ? (
        <form className="space-y-5" noValidate onSubmit={submit}>
          {/* Context bar */}
          <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
            <HardDrive
              className="size-3.5 shrink-0 text-brand"
              strokeWidth={1.8}
            />
            <span className="font-semibold tabular-nums">
              {detail.data.assetCode}
            </span>
            <span className="text-muted">·</span>
            <span className="text-muted">{detail.data.name}</span>
          </div>

          {/* Asset name & type */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <Tag
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={1.8}
              />
              <h3 className="text-sm font-semibold">Identity</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Asset name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="edit-name"
                  className="block text-sm font-medium"
                >
                  Asset name
                </label>
                <Input
                  id="edit-name"
                  maxLength={255}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "edit-name-error" : undefined}
                  {...register("name")}
                />
                {errors.name && (
                  <p
                    id="edit-name-error"
                    role="alert"
                    className="text-danger text-xs"
                  >
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Asset type */}
              <div className="space-y-1.5">
                <label
                  htmlFor="edit-type"
                  className="block text-sm font-medium"
                >
                  Asset type
                </label>
                <Select
                  id="edit-type"
                  aria-required="true"
                  aria-invalid={Boolean(errors.assetType)}
                  aria-describedby={
                    errors.assetType ? "edit-type-error" : undefined
                  }
                  {...register("assetType")}
                >
                  <option value="" disabled>
                    Select asset type
                  </option>
                  {!assetTypes.some(
                    (value) => value === detail.data.assetType,
                  ) ? (
                    <option value={detail.data.assetType} disabled>
                      {detail.data.assetType} (legacy — select a supported type)
                    </option>
                  ) : null}
                  {assetTypes.map((value) => (
                    <option key={value} value={value}>
                      {assetTypeLabels[value]}
                    </option>
                  ))}
                </Select>
                {errors.assetType && (
                  <p
                    id="edit-type-error"
                    role="alert"
                    className="text-danger text-xs"
                  >
                    {errors.assetType.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <FileText
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={1.8}
              />
              <h3 className="text-sm font-semibold">Description</h3>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="edit-description"
                className="block text-sm font-medium"
              >
                Description
                <span className="text-muted ml-1 font-normal">(optional)</span>
              </label>
              <Textarea
                id="edit-description"
                maxLength={10_000}
                rows={4}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? "edit-description-error" : undefined
                }
                {...register("description")}
              />
              {errors.description && (
                <p
                  id="edit-description-error"
                  role="alert"
                  className="text-danger text-xs"
                >
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Info hint */}
          <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
            <Info
              className="mt-0.5 size-4 shrink-0 text-brand"
              strokeWidth={1.8}
            />
            <p className="text-muted text-xs leading-5">
              Use{" "}
              <strong className="text-foreground">Assign owner</strong>,{" "}
              <strong className="text-foreground">Classify asset</strong>, and{" "}
              <strong className="text-foreground">Manage links</strong> for
              ownership, classification, and relationship changes.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className={cn(mutation.isPending && "opacity-80")}
            >
              {mutation.isPending ? (
                <>
                  <Loader2
                    className="mr-1.5 size-3.5 animate-spin"
                    strokeWidth={2}
                  />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}