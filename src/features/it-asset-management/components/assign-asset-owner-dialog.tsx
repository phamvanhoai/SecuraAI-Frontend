"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useToast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms/form-field";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/api-error";
import { useAssetCreateOptions } from "../hooks/use-asset-create-options";
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
  const options = useAssetCreateOptions(asset !== null);
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
        error instanceof Error
          ? error.message
          : "Unable to update owner. Please try again.",
      );
    }
  };

  const disposed = asset?.status === "disposed";
  const locked = asset?.status !== "active" || stale || mutation.isPending;
  const selectedOwner = useWatch({ control, name: "ownerUserId" });
  const removingOwner = Boolean(asset?.owner) && (selectedOwner === "" || selectedOwner === null);
  return (
    <Dialog
      title="Assign Asset Owner"
      dialogRef={dialogRef}
      onClose={close}
      className="w-[min(40rem,calc(100%-2rem))]"
    >
      {asset ? (
        <form className="space-y-4" noValidate onSubmit={handleSubmit(submit)}>
          <p className="text-sm">
            <strong>{asset.assetCode}</strong> – {asset.name}. Current owner: {asset.owner?.fullName ?? "Unassigned"}.
          </p>
          {disposed ? <Alert>Disposed assets cannot be assigned an owner.</Alert> : null}
          {asset.status === "archived" ? <Alert>Archived assets cannot be assigned an owner.</Alert> : null}
          {stale ? <Alert>Asset state or permissions changed. Close and reopen this form to review the latest data.</Alert> : null}
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">{message}</Alert>
          ) : null}
          <FormField id="asset-owner" label="New owner" error={errors.ownerUserId?.message}>
            <Select
              id="asset-owner"
              disabled={locked || options.isPending || options.isError}
              {...register("ownerUserId")}
              onChange={(event) => {
                setRemovalConfirmed(false);
                void register("ownerUserId").onChange(event);
              }}
            >
              <option value="">
                {options.isPending ? "Loading users…" : "Remove owner"}
              </option>
              {(options.data?.owners ?? []).map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.fullName}{owner.employeeCode ? ` – ${owner.employeeCode}` : ""}
                </option>
              ))}
            </Select>
          </FormField>
          {options.isError ? (
            <Alert className="border-warning/25 bg-warning/10">
              Unable to load users. Please try again later.
            </Alert>
          ) : null}
          <FormField id="owner-assignment-reason" label="Reason for change" error={errors.reason?.message}>
            <Textarea
              id="owner-assignment-reason"
              maxLength={1000}
              disabled={locked}
              {...register("reason")}
            />
          </FormField>
          <p className="text-muted text-xs">
            The owner is responsible for this asset. Changing ownership does not transfer ownership of related risks or controls.
          </p>
          {removingOwner ? (
            <div className="space-y-2 rounded-lg border border-warning/25 bg-warning/10 p-3">
              <p className="text-sm">Removing the owner leaves this asset unassigned.</p>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" checked={removalConfirmed} disabled={locked}
                  onChange={(event) => setRemovalConfirmed(event.target.checked)} />
                I confirm removing the current owner
              </label>
            </div>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              className="bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
              onClick={close}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={locked || options.isPending || options.isError || (removingOwner && !removalConfirmed)}
            >
              {mutation.isPending ? "Saving…" : "Save owner"}
            </Button>
          </div>
        </form>
      ) : null}
    </Dialog>
  );
}
