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
      toast.success("Asset archived", `${asset.assetCode} – ${asset.name}`);
    } catch (error: unknown) {
      setMessage(
        error instanceof ApiError && error.status === 409
          ? "The asset could not be archived in its current state."
          : error instanceof Error
            ? error.message
            : "Unable to archive asset. Please try again.",
      );
    }
  };

  return (
    <Dialog
      title="Archive Asset"
      dialogRef={dialogRef}
      onClose={close}
      className="w-[min(32rem,calc(100%-2rem))]"
    >
      {asset ? (
        <div className="space-y-4">
          <Alert className="border-warning/25 bg-warning/10">
            The asset will leave the active list. Its details and related records remain available for audit and review.
          </Alert>
          <p className="text-sm leading-6">
            You are archiving <strong>{asset.assetCode}</strong> – {asset.name}.
          </p>
          <label
            className="block space-y-2"
            htmlFor="delete-asset-confirmation"
          >
            <span className="text-sm font-medium">
              Enter code <strong>{asset.assetCode}</strong> to confirm
            </span>
            <Input
              id="delete-asset-confirmation"
              autoComplete="off"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button onClick={close} variant="secondary">
              Cancel
            </Button>
            <Button
              className="bg-danger text-white hover:opacity-90"
              disabled={
                confirmation.trim() !== asset.assetCode || mutation.isPending
              }
              onClick={remove}
            >
              {mutation.isPending ? "Archiving…" : "Archive Asset"}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
