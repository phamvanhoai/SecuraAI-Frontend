"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { AiAlert } from "../schemas/ai-alert-schema";
import { AlertFeedbackHistoryPanel } from "./alert-feedback-history-panel";

export function AlertFeedbackHistoryDialog({
  alert,
  onClose,
}: {
  alert: AiAlert | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (alert && !dialog.open) dialog.showModal();
    if (!alert && dialog.open) dialog.close();
  }, [alert]);

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(64rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={onClose}
      title="Feedback history"
    >
      {alert ? (
        <div className="space-y-4">
          <div>
            <p className="font-medium">{alert.title}</p>
            <p className="text-muted mt-1 text-sm">{alert.alertCode}</p>
          </div>
          <AlertFeedbackHistoryPanel alertId={alert.id} />
          <div className="flex justify-end">
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
