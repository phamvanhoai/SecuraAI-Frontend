"use client";

import { useEffect, useRef } from "react";
import { Dialog } from "@/components/ui/dialog";
import type { EventSourceResponse } from "../schemas/event-source-schema";
import { RegisterEventSourceForm } from "./register-event-source-form";

export interface RegisterEventSourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: ((created: EventSourceResponse) => void) | undefined;
}

export function RegisterEventSourceDialog({
  isOpen,
  onClose,
  onSuccess,
}: RegisterEventSourceDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    }
    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <Dialog
      title="Register Wazuh SIEM Event Source"
      dialogRef={dialogRef}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
    >
      <div className="space-y-6">
        <p className="text-muted -mt-2 text-xs">
          Configure SecuraAI to accept Normalized Security Events pushed from Wazuh Edge Normalizer (custom-securaai).
        </p>

        <RegisterEventSourceForm
          hideHeader
          onCancel={onClose}
          onSuccess={(created) => {
            onSuccess?.(created);
            onClose();
          }}
        />
      </div>
    </Dialog>
  );
}
