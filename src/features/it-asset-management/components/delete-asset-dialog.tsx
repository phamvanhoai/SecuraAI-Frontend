"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/api-error";
import { useDeleteAsset } from "../hooks/use-delete-asset";
import type { AssetListItem } from "../schemas/asset-list-schema";
import { archiveAssetSchema } from "../schemas/archive-asset-schema";

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
  const [reason, setReason] = useState("");
  const [stale, setStale] = useState(false);
  const mutation = useDeleteAsset();
  const toast = useToast();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (asset && !dialog.open) dialog.showModal();
    if (!asset && dialog.open) dialog.close();
    setConfirmation("");
    setMessage(undefined);
    setReason("");
    setStale(false);
  }, [asset]);

  const close = (): void => {
    setConfirmation("");
    setMessage(undefined);
    setReason("");
    setStale(false);
    onClose();
  };
  const remove = async (): Promise<void> => {
    if (!asset || asset.status !== "active" || stale || mutation.isPending || confirmation.trim() !== asset.assetCode) return;
    const parsed = archiveAssetSchema.safeParse({ reason });
    if (!parsed.success) { setMessage("Enter an archive reason (1–1000 characters)."); return; }
    setMessage(undefined);
    try {
      await mutation.mutateAsync({ assetId: asset.id, ...parsed.data });
      close();
      toast.success("Asset archived", `${asset.assetCode} – ${asset.name}`);
    } catch (error: unknown) {
      if (error instanceof ApiError && [403, 404].includes(error.status)) setStale(true);
      setMessage(
        error instanceof Error
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
            The asset becomes read-only and leaves the Active filter. Details and relationships are retained. This does not shut down infrastructure or stop event collection. Active dependent assets must be resolved first.
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
              disabled={mutation.isPending || stale || asset.status !== "active"}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </label>
          <label className="block space-y-2" htmlFor="archive-asset-reason">
            <span className="text-sm font-medium">Archive reason (required)</span>
            <Textarea id="archive-asset-reason" value={reason} maxLength={1000} required
              disabled={mutation.isPending || stale || asset.status !== "active"}
              onChange={(event) => setReason(event.target.value)} />
          </label>
          {asset.status !== "active" ? <Alert>Only active assets can be archived.</Alert> : null}
          {stale ? <Alert>Close and reopen this form to review current access and asset state.</Alert> : null}
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
                confirmation.trim() !== asset.assetCode || !reason.trim() || reason.trim().length > 1000 || mutation.isPending || stale || asset.status !== "active"
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
