"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/api-error";
import { useDeleteLogSource } from "../hooks/use-log-sources";
import type { LogSource } from "../schemas/log-source-schema";

export function DeleteLogSourceDialog({
  source,
  onClose,
}: {
  source: LogSource | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string>();
  const mutation = useDeleteLogSource();
  const toast = useToast();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (source && !dialog.open) dialog.showModal();
    if (!source && dialog.open) dialog.close();
    setConfirmation("");
    setMessage(undefined);
  }, [source]);

  function close(): void {
    if (mutation.isPending) return;
    setConfirmation("");
    setMessage(undefined);
    onClose();
  }

  async function remove(): Promise<void> {
    if (!source || confirmation.trim() !== source.name) return;
    setMessage(undefined);
    try {
      await mutation.mutateAsync(source.id);
      onClose();
      toast.success("Log source deleted", source.name);
    } catch (error: unknown) {
      setMessage(
        error instanceof ApiError && error.status === 409
          ? "This log source has security events or alerts. Deactivate it instead to preserve its history."
          : "Unable to delete the log source. Check your permissions and try again.",
      );
    }
  }

  return (
    <Dialog
      className="w-[min(32rem,calc(100%-2rem))]"
      dialogRef={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={close}
      title="Delete log source"
    >
      {source ? (
        <div className="space-y-4">
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            This permanently deletes the log source. Sources with security
            events or alerts cannot be deleted.
          </Alert>
          <label className="block space-y-2" htmlFor="delete-log-source-name">
            <span className="text-sm font-medium">
              Enter <strong>{source.name}</strong> to confirm
            </span>
            <Input
              autoComplete="off"
              id="delete-log-source-name"
              onChange={(event) => setConfirmation(event.target.value)}
              value={confirmation}
            />
          </label>
          {message ? (
            <Alert className="border-danger/25 bg-danger-soft text-danger">
              {message}
            </Alert>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              disabled={mutation.isPending}
              onClick={close}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={
                confirmation.trim() !== source.name || mutation.isPending
              }
              onClick={remove}
              variant="danger"
            >
              {mutation.isPending ? "Deleting..." : "Delete log source"}
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
