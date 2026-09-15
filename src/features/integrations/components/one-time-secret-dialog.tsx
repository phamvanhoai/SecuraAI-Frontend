"use client";

import { Check, Copy, Key, ShieldAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function OneTimeSecretDialog({
  keyName,
  secret,
  open,
  onClose,
}: {
  keyName: string;
  secret: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleClose() {
    setCopied(false);
    onClose();
  }

  if (!secret) return null;

  async function handleCopy() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      toast.success(
        "Đã sao chép Secret Token",
        "Khóa bí mật đã được lưu vào clipboard của bạn.",
      );
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error(
        "Không thể sao chép",
        "Vui lòng bôi đen và sao chép thủ công.",
      );
    }
  }

  return (
    <dialog
      aria-labelledby="one-time-secret-title"
      className="border-border bg-surface text-foreground m-auto max-h-[calc(100dvh-2rem)] w-[min(34rem,calc(100%-2rem))] overflow-y-auto rounded-xl border p-0 backdrop:bg-[#07110f]/55"
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      ref={dialogRef}
    >
      <div className="border-border bg-surface border-b p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="text-brand flex size-8 items-center justify-center rounded-lg bg-brand/10 border border-brand/20">
              <Key className="size-4" />
            </div>
            <div>
              <h3 id="one-time-secret-title" className="text-sm font-semibold tracking-tight">
                API Key Secret Token
              </h3>
              <p className="text-muted text-xs">
                Khóa: <span className="font-medium text-foreground">{keyName}</span>
              </p>
            </div>
          </div>
          <button
            aria-label="Đóng"
            className="text-muted hover:text-foreground rounded p-1"
            onClick={handleClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4 p-5 text-xs">
        <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-200">
          <div className="flex items-start gap-2">
            <ShieldAlert className="size-4 shrink-0 text-amber-400 mt-0.5" />
            <p className="text-xs leading-relaxed text-amber-200/90">
              Sao chép Secret ngay bây giờ. Bạn sẽ <strong>không thể xem lại</strong> khóa bí mật này sau khi đóng hộp thoại.
            </p>
          </div>
        </Alert>

        <div className="space-y-1.5">
          <label className="text-muted block text-xs font-medium" htmlFor="secret-token-display">
            Plaintext Secret Token
          </label>
          <div className="relative">
            <input
              className="border-border bg-neutral-soft/60 font-mono text-foreground w-full rounded-md border py-2.5 pr-24 pl-3 text-xs tracking-wider select-all"
              id="secret-token-display"
              readOnly
              type="text"
              value={secret}
            />
            <Button
              className="absolute top-1/2 right-1.5 -translate-y-1/2 min-h-7 h-7 px-2.5 text-xs"
              onClick={handleCopy}
              type="button"
              variant="secondary"
            >
              {copied ? (
                <>
                  <Check className="mr-1 size-3 text-emerald-400" />
                  Đã chép
                </>
              ) : (
                <>
                  <Copy className="mr-1 size-3" />
                  Sao chép
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="border-border flex justify-end gap-2 border-t pt-4">
          <Button
            className="min-h-8 px-4 text-xs font-medium"
            onClick={handleClose}
            type="button"
          >
            Tôi đã lưu Secret & Đóng
          </Button>
        </div>
      </div>
    </dialog>
  );
}
