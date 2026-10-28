"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  FileText,
  HardDrive,
  Info,
  Loader2,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { AssetOwnerPicker } from "./asset-owner-picker";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/api-error";
import { useAssignAssetOwner } from "../hooks/use-assign-asset-owner";
import {
  assignAssetOwnerSchema,
  type AssignAssetOwnerInput,
  type AssignAssetOwnerRequest,
} from "../schemas/assign-asset-owner-schema";
import type { AssetListItem } from "../schemas/asset-list-schema";

const defaults: AssignAssetOwnerInput = { ownerUserId: "", reason: "" };

export function AssignAssetOwnerDialog({
  asset,
  onClose,
}: {
  asset: AssetListItem | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState<string>();
  const [removalConfirmed, setRemovalConfirmed] = useState(false);
  const [stale, setStale] = useState(false);
  const mutation = useAssignAssetOwner(asset?.id ?? null);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AssignAssetOwnerInput, unknown, AssignAssetOwnerRequest>({
    resolver: zodResolver(assignAssetOwnerSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (asset && !dialog.open) dialog.showModal();
    if (!asset && dialog.open) dialog.close();
  }, [asset]);

  useEffect(() => {
    if (!asset) return;
    reset({ ownerUserId: asset.owner?.id ?? "", reason: "" });
  }, [asset, reset]);

  const close = (): void => {
    reset(defaults);
    setMessage(undefined);
    setRemovalConfirmed(false);
    setStale(false);
    onClose();
  };

  const submit = async (values: AssignAssetOwnerRequest): Promise<void> => {
    if (!asset) return;
    if (asset.status !== "active" || stale || mutation.isPending) return;
    if (values.ownerUserId === null && asset.owner && !removalConfirmed) {
      setMessage("Confirm owner removal before saving.");
      return;
    }
    setMessage(undefined);
    try {
      const result = await mutation.mutateAsync(values);
      close();
      if (!result.changed) {
        toast.info("Owner unchanged", `${asset.assetCode} remains assigned to the same owner.`);
        return;
      }
      toast.success(
        result.owner ? "Owner updated" : "Owner removed",
        result.owner
          ? `${asset.assetCode}: ${result.owner.fullName}`
          : `${asset.assetCode} currently has no owner.`,
      );
    } catch (error: unknown) {
      if (error instanceof ApiError && [403, 404, 409].includes(error.status)) setStale(true);
      setMessage(
        error instanceof Error ? error.message : "Unable to update owner. Please try again.",
      );
    }
  };

  const disposed = asset?.status === "disposed";
  const locked = asset?.status !== "active" || stale || mutation.isPending;
  const selectedOwner = useWatch({ control, name: "ownerUserId" });
  const removingOwner =
    Boolean(asset?.owner) && (selectedOwner === "" || selectedOwner === null);

  return (
    <Dialog
      title="Assign Asset Owner"
      dialogRef={dialogRef}
      onClose={close}
      className="w-[min(40rem,calc(100%-2rem))]"
    >
      {asset ? (
        <form className="space-y-5" noValidate onSubmit={handleSubmit(submit)}>
          {/* Context bar */}
          <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
            <HardDrive className="size-3.5 shrink-0 text-brand" strokeWidth={1.8} />
            <span className="font-semibold tabular-nums">{asset.assetCode}</span>
            <span className="text-muted">·</span>
            <span className="text-muted truncate">{asset.name}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">
              Current owner:{" "}
              <strong className="text-foreground">
                {asset.owner?.fullName ?? "Unassigned"}
              </strong>
            </span>
          </div>

          {/* Status banners */}
          {disposed ? (
            <div role="alert" className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-warning"
                strokeWidth={1.8}
              />
              <p className="text-xs leading-5">
                <strong className="text-foreground block">Disposed asset</strong>
                <span className="text-muted">
                  Disposed assets cannot be assigned an owner.
                </span>
              </p>
            </div>
          ) : null}

          {asset.status === "archived" ? (
            <div role="alert" className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-warning"
                strokeWidth={1.8}
              />
              <p className="text-xs leading-5">
                <strong className="text-foreground block">Archived asset</strong>
                <span className="text-muted">
                  Archived assets cannot be assigned an owner.
                </span>
              </p>
            </div>
          ) : null}

          {stale ? (
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-warning"
                strokeWidth={1.8}
              />
              <p className="text-muted text-xs leading-5">
                Asset state or permissions changed. Close and reopen this form to review
                the latest data.
              </p>
            </div>
          ) : null}

          {message ? (
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-danger"
                strokeWidth={1.8}
              />
              <p className="text-danger text-xs leading-5">{message}</p>
            </div>
          ) : null}

          {/* Owner picker */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <User className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
              <h3 className="text-sm font-semibold">Owner assignment</h3>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="asset-owner" className="block text-sm font-medium">
                New owner
              </label>
              <Controller
                name="ownerUserId"
                control={control}
                render={({ field }) => (
                  <AssetOwnerPicker
                    key={asset.id}
                    id="asset-owner"
                    value={field.value ?? ""}
                    initialLabel={asset.owner?.fullName ?? ""}
                    enabled={!locked}
                    invalid={Boolean(errors.ownerUserId)}
                    inputRef={field.ref}
                    onBlur={field.onBlur}
                    onChange={(value) => {
                      setRemovalConfirmed(false);
                      field.onChange(value);
                    }}
                  />
                )}
              />
              {errors.ownerUserId && (
                <p role="alert" className="text-danger text-xs">
                  {errors.ownerUserId.message}
                </p>
              )}
            </div>
          </div>

          {/* Reason textarea */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <FileText
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={1.8}
              />
              <h3 className="text-sm font-semibold">Reason for change</h3>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="owner-assignment-reason"
                className="block text-sm font-medium"
              >
                Reason for change
              </label>
              <Textarea
                id="owner-assignment-reason"
                maxLength={1000}
                disabled={locked}
                aria-invalid={Boolean(errors.reason)}
                aria-describedby={errors.reason ? "owner-reason-error" : undefined}
                {...register("reason")}
              />
              {errors.reason && (
                <p id="owner-reason-error" role="alert" className="text-danger text-xs">
                  {errors.reason.message}
                </p>
              )}
            </div>
          </div>

          {/* Removal confirmation */}
          {removingOwner ? (
            <div className="border-border bg-neutral-soft/30 rounded-xl border p-3.5 space-y-3">
              <div className="flex gap-2.5">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-warning"
                  strokeWidth={1.8}
                />
                <p className="text-xs leading-5">
                  <strong className="text-foreground block">Remove current owner?</strong>
                  <span className="text-muted">
                    Removing the owner leaves this asset unassigned.
                  </span>
                </p>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium">
                <input
                  type="checkbox"
                  checked={removalConfirmed}
                  disabled={locked}
                  onChange={(event) => setRemovalConfirmed(event.target.checked)}
                  className="size-4 shrink-0"
                />
                I confirm removing the current owner
              </label>
            </div>
          ) : null}

          {/* Info hint */}
          <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
            <Info className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
            <p className="text-muted text-xs leading-5">
              The owner is responsible for this asset. Changing ownership does not transfer
              ownership of related risks or controls.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={locked || (removingOwner && !removalConfirmed)}
              className={cn(mutation.isPending && "opacity-80")}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
                  Saving…
                </>
              ) : (
                "Save owner"
              )}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
