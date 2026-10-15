"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/feedback/toast";
import { useRevokeExportReportMutation } from "../hooks/use-export-reports";
import type { ReportExportItem } from "../schemas/export-report-schema";

interface RevokeReportDialogProps {
  item: ReportExportItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RevokeReportDialog({ item, isOpen, onClose }: RevokeReportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();

  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const revokeMutation = useRevokeExportReportMutation();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      setReason("");
      setFormError(null);
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    } else if (!isOpen && dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
  }, [isOpen]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      setFormError("Revocation reason must be at least 5 characters long.");
      return;
    }

    try {
      await revokeMutation.mutateAsync({
        exportId: item.id,
        reason: trimmed,
      });

      toast.success(
        "Report export revoked",
        `Export #${item.id.slice(0, 8)} has been voided. Download links are now permanently deactivated.`,
      );

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to revoke report export.";
      setFormError(msg);
      toast.error("Failed to revoke export", msg);
    }
  };

  return (
    <Dialog
      title="Revoke Report Export"
      dialogRef={dialogRef}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert className="border-danger/30 bg-danger-soft text-danger">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="size-4 shrink-0 mt-0.5 text-danger" />
            <div className="text-xs space-y-1">
              <p className="font-semibold">Irreversible Compliance Action</p>
              <p className="text-foreground/80">
                Revoking this report marks it as voided in the audit log and permanently disables all download links (HTTP 410 Gone). Use this if incorrect dates or severity filters were exported.
              </p>
            </div>
          </div>
        </Alert>

        <div className="rounded-lg border border-border bg-surface-subtle/60 p-3 space-y-2 text-xs">
          <div className="flex justify-between items-center text-muted">
            <span>Report ID:</span>
            <span className="font-mono text-foreground font-medium">{item.id}</span>
          </div>
          <div className="flex justify-between items-center text-muted">
            <span>Report Type:</span>
            <span className="font-medium text-foreground">{item.reportType}</span>
          </div>
          <div className="flex justify-between items-center text-muted">
            <span>Requested By:</span>
            <span className="text-foreground">{item.requestedBy.fullName} ({item.requestedBy.role})</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label htmlFor="revocationReason" className="text-xs font-semibold">
              Revocation Reason <span className="text-danger">*</span>
            </Label>
            <span className="text-[11px] text-muted">Min 5 chars</span>
          </div>
          <Textarea
            id="revocationReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Filtered wrong date range (August instead of September), or exported outdated risk ratings."
            rows={3}
            disabled={revokeMutation.isPending}
            className="text-xs"
          />
          <p className="text-[11px] text-muted">
            This justification will be permanently recorded for compliance auditors and executive reviewers.
          </p>
        </div>

        {formError && (
          <Alert className="border-danger/30 bg-danger-soft text-danger py-2 text-xs">
            {formError}
          </Alert>
        )}

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={revokeMutation.isPending}
            className="min-h-9 px-3 text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={revokeMutation.isPending || reason.trim().length < 5}
            className="min-h-9 px-4 text-xs gap-1.5"
          >
            {revokeMutation.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Revoking...</span>
              </>
            ) : (
              <span>Confirm Revoke</span>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
