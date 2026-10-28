"use client";

import {
  AlertTriangle,
  Archive,
  FileText,
  HardDrive,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/feedback/toast";
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
    if (
      !asset ||
      asset.status !== "active" ||
      stale ||
      mutation.isPending ||
      confirmation.trim() !== asset.assetCode
    )
      return;
    const parsed = archiveAssetSchema.safeParse({ reason });
    if (!parsed.success) {
      setMessage("Enter an archive reason (1-1000 characters).");
      return;
    }
    setMessage(undefined);
    try {
      await mutation.mutateAsync({ assetId: asset.id, ...parsed.data });
      close();
      toast.success("Asset archived", `${asset.assetCode} - ${asset.name}`);
    } catch (error: unknown) {
      if (error instanceof ApiError && [403, 404].includes(error.status)) setStale(true);
      setMessage(
        error instanceof Error ? error.message : "Unable to archive asset. Please try again.",
      );
    }
  };

  const isActive = asset?.status === "active";
  const locked = !isActive || stale || mutation.isPending;
  const confirmationMatches = confirmation.trim() === (asset?.assetCode ?? "___");
  const canSubmit = confirmationMatches && reason.trim().length >= 1 && reason.trim().length <= 1000 && !locked;

  return (
    <Dialog
      title="Archive Asset"
      dialogRef={dialogRef}
      onClose={close}
      className="w-[min(32rem,calc(100%-2rem))]"
    >
      {asset ? (
        <div className="space-y-5">
          {/* Context bar */}
          <div className="border-border bg-neutral-soft/30 flex flex-wrap items-center gap-3 rounded-lg border p-3.5 text-xs">
            <HardDrive className="size-3.5 shrink-0 text-brand" strokeWidth={1.8} />
            <span className="font-semibold tabular-nums">{asset.assetCode}</span>
            <span className="text-muted">·</span>
            <span className="text-muted truncate">{asset.name}</span>
          </div>

          {/* What archiving does */}
          <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0 text-warning"
              strokeWidth={1.8}
            />
            <p className="text-xs leading-5">
              <strong className="text-foreground block mb-1">What archiving does</strong>
              <span className="text-muted">
                The asset becomes read-only and leaves the Active filter. Details and
                relationships are retained. This does not shut down infrastructure or stop
                event collection. Active dependent assets must be resolved first.
              </span>
            </p>
          </div>

          {/* Not-active banner */}
          {!isActive ? (
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-warning"
                strokeWidth={1.8}
              />
              <p className="text-muted text-xs leading-5">
                Only active assets can be archived.
              </p>
            </div>
          ) : null}

          {/* Stale banner */}
          {stale ? (
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-warning"
                strokeWidth={1.8}
              />
              <p className="text-muted text-xs leading-5">
                Close and reopen this form to review current access and asset state.
              </p>
            </div>
          ) : null}

          {/* Error banner */}
          {message ? (
            <div className="border-border bg-neutral-soft/30 flex gap-2.5 rounded-xl border p-3.5">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-danger"
                strokeWidth={1.8}
              />
              <p className="text-danger text-xs leading-5">{message}</p>
            </div>
          ) : null}

          {/* Confirmation code */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <Archive className="mt-0.5 size-4 shrink-0 text-brand" strokeWidth={1.8} />
              <h3 className="text-sm font-semibold">Confirm archive</h3>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="delete-asset-confirmation"
                className="block text-sm font-medium"
              >
                Enter code{" "}
                <strong className="font-semibold">{asset.assetCode}</strong> to confirm
              </label>
              <Input
                id="delete-asset-confirmation"
                autoComplete="off"
                value={confirmation}
                disabled={locked}
                aria-invalid={confirmation.length > 0 && !confirmationMatches}
                onChange={(event) => setConfirmation(event.target.value)}
              />
              {confirmation.length > 0 && !confirmationMatches ? (
                <p className="text-danger text-xs">
                  Code does not match. Enter exactly{" "}
                  <strong>{asset.assetCode}</strong>.
                </p>
              ) : null}
            </div>
          </div>

          {/* Archive reason */}
          <div className="space-y-3">
            <div className="flex items-start gap-2 border-b border-border pb-2">
              <FileText
                className="mt-0.5 size-4 shrink-0 text-brand"
                strokeWidth={1.8}
              />
              <h3 className="text-sm font-semibold">Archive reason</h3>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="archive-asset-reason"
                className="block text-sm font-medium"
              >
                Archive reason
                <span className="text-muted ml-1 font-normal">(required)</span>
              </label>
              <Textarea
                id="archive-asset-reason"
                value={reason}
                maxLength={1000}
                required
                rows={3}
                disabled={locked}
                onChange={(event) => setReason(event.target.value)}
              />
              <p className="text-muted text-xs">
                {reason.trim().length} / 1000 characters
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
            <Button onClick={close} variant="secondary">
              Cancel
            </Button>
            <Button
              className={cn(
                "bg-danger text-white hover:opacity-90",
                mutation.isPending && "opacity-80",
              )}
              disabled={!canSubmit}
              onClick={remove}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />
                  Archiving…
                </>
              ) : (
                "Archive Asset"
              )}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
