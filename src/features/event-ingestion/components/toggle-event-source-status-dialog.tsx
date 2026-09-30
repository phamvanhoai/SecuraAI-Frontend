"use client";

import { AlertCircle, CheckCircle2, Loader2, Power } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/api-error";
import { useUpdateEventSource } from "../hooks/use-event-sources";
import type { EventSourceResponse } from "../schemas/event-source-schema";

export function ToggleEventSourceStatusDialog({
  source,
  onClose,
  onSuccess,
}: {
  source: EventSourceResponse | null;
  onClose: () => void;
  onSuccess?: ((updated: EventSourceResponse) => void) | undefined;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const updateMutation = useUpdateEventSource();
  const toast = useToast();

  const isCurrentlyActive = source?.status === "ACTIVE";
  const targetStatus = isCurrentlyActive ? "INACTIVE" : "ACTIVE";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (source && !dialog.open) {
      setErrorMessage(null);
      dialog.showModal();
    }
    if (!source && dialog.open) {
      setErrorMessage(null);
      dialog.close();
    }
  }, [source]);

  function handleClose(): void {
    if (updateMutation.isPending) return;
    setErrorMessage(null);
    onClose();
  }

  async function handleConfirm(): Promise<void> {
    if (!source) return;
    setErrorMessage(null);

    try {
      const updated = await updateMutation.mutateAsync({
        id: source.id,
        values: {
          name: source.name,
          endpoint: source.endpoint ?? undefined,
          ingestionMethod: source.ingestionMethod,
          authenticationType: source.authenticationType ?? undefined,
          status: targetStatus,
          description: source.description ?? undefined,
          eventFamilies: source.eventFamilies,
        },
      });

      if (targetStatus === "ACTIVE") {
        toast.success(
          "Event source resumed",
          `"${source.name}" is now active and ingesting security events.`,
        );
      } else {
        toast.success(
          "Event source paused",
          `"${source.name}" event ingestion has been paused.`,
        );
      }

      onSuccess?.(updated);
      onClose();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage(
          isCurrentlyActive
            ? "Failed to pause event source. Please try again."
            : "Failed to resume event source. Please try again.",
        );
      }
    }
  }

  if (!source) return null;

  return (
    <Dialog
      className="w-[min(32rem,calc(100%-2rem))]"
      dialogRef={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      onClose={handleClose}
      title={isCurrentlyActive ? "Pause Event Ingestion" : "Resume Event Ingestion"}
    >
      <div className="space-y-4">
        {errorMessage && (
          <Alert>
            {errorMessage}
          </Alert>
        )}

        <div className="border-border bg-neutral-soft/50 rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted text-xs uppercase tracking-wider font-semibold">
              Event Source
            </span>
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${
                isCurrentlyActive
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-neutral-500/30 bg-neutral-500/10 text-neutral-600 dark:text-neutral-400"
              }`}
            >
              Current: {isCurrentlyActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div>
            <h4 className="text-foreground font-semibold text-base">
              {source.name}
            </h4>
            <p className="text-muted font-mono text-xs mt-0.5">
              {source.sourceType} • {source.ingestionMethod}
            </p>
          </div>
        </div>

        {isCurrentlyActive ? (
          <div className="border-border bg-amber-500/10 text-amber-800 dark:text-amber-300 rounded-lg border border-amber-500/20 p-3.5 flex items-start gap-3 text-xs leading-relaxed">
            <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Pausing Event Ingestion</p>
              <p className="text-amber-700/90 dark:text-amber-300/90">
                Incoming events and logs will not be processed while paused.
                Existing configuration and historical security records will remain intact.
              </p>
            </div>
          </div>
        ) : (
          <div className="border-border bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-500/20 p-3.5 flex items-start gap-3 text-xs leading-relaxed">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Resuming Event Ingestion</p>
              <p className="text-emerald-700/90 dark:text-emerald-300/90">
                The ingestion pipeline will immediately resume collecting and normalizing
                events from this source.
              </p>
            </div>
          </div>
        )}

        <div className="border-border flex items-center justify-end gap-3 border-t pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={updateMutation.isPending}
            className={`flex items-center gap-2 ${
              isCurrentlyActive
                ? "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
                : ""
            }`}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>{isCurrentlyActive ? "Pausing..." : "Resuming..."}</span>
              </>
            ) : (
              <>
                <Power className="size-4" />
                <span>{isCurrentlyActive ? "Pause Ingestion" : "Resume Ingestion"}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
