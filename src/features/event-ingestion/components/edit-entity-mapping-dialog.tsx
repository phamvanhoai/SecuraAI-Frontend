"use client";

import { CheckCircle2, HardDrive, Info, Loader2, ShieldCheck, UserCheck } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  useMappingOptions,
  useUpdateEventMapping,
} from "../hooks/use-normalized-events";
import type { NormalizedEventDetail } from "../schemas/normalized-event-schema";

interface EditEntityMappingDialogProps {
  event: NormalizedEventDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (() => void) | undefined;
}

function EditEntityMappingForm({
  event,
  onClose,
  onSuccess,
}: {
  event: NormalizedEventDetail;
  onClose: () => void;
  onSuccess?: (() => void) | undefined;
}) {
  const toast = useToast();
  const optionsQuery = useMappingOptions();
  const updateMutation = useUpdateEventMapping(event.id);

  const [selectedUserId, setSelectedUserId] = useState<string>(
    () => event.activeMapping?.userId ?? event.mappedUser?.id ?? "NONE",
  );
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    () => event.activeMapping?.assetId ?? event.mappedAsset?.id ?? "NONE",
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    () => event.activeMapping?.monitoredAccountId ?? "NONE",
  );
  const [confidencePercent, setConfidencePercent] = useState<number>(() =>
    event.activeMapping?.confidence !== null && event.activeMapping?.confidence !== undefined
      ? Math.round(event.activeMapping.confidence * 100)
      : 0,
  );
  const [reason, setReason] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const userSelectId = useId();
  const assetSelectId = useId();
  const accountSelectId = useId();
  const confidenceInputId = useId();
  const reasonTextareaId = useId();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const hasEntity =
      selectedUserId !== "NONE" ||
      selectedAssetId !== "NONE" ||
      selectedAccountId !== "NONE";

    if (!hasEntity) {
      setFormError(
        "Please select at least one entity (User, Asset, or Monitored Account) to map.",
      );
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setFormError("Reason for mapping correction is required.");
      return;
    }

    try {
      const numericPercent = Number(confidencePercent);
      const normalizedConfidence = isNaN(numericPercent)
        ? 0
        : Math.min(1.0, Math.max(0, numericPercent / 100));

      await updateMutation.mutateAsync({
        userId: selectedUserId !== "NONE" ? selectedUserId : null,
        assetId: selectedAssetId !== "NONE" ? selectedAssetId : null,
        monitoredAccountId: selectedAccountId !== "NONE" ? selectedAccountId : null,
        reason: trimmedReason,
        confidence: normalizedConfidence,
      });

      toast.success(
        "Mapping updated",
        "Entity associations have been recorded successfully.",
      );

      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update entity mapping. Please try again.";
      setFormError(message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {formError ? <Alert>{formError}</Alert> : null}

        {/* Event Context Box */}
        <div className="rounded-lg border border-border bg-neutral-soft/30 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted font-medium">Event:</span>
            <span className="font-mono font-semibold text-foreground">
              {event.eventType}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted font-medium">Extracted Account:</span>
            <span className="font-mono text-foreground">
              {event.accountIdentifier ?? "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted font-medium">Source IP:</span>
            <span className="font-mono text-foreground">
              {event.sourceIp ?? "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted font-medium">Current Status:</span>
            <StatusBadge tone="neutral">
              {event.mappingStatus.replace(/_/g, " ")}
            </StatusBadge>
          </div>
          {event.activeMapping ? (
            <div className="flex items-center justify-between">
              <span className="text-muted font-medium">Mapping Method:</span>
              <span className="font-semibold text-brand text-[11px]">
                {event.activeMapping.mappingMethod === "AUTO"
                  ? "System Auto-Mapped"
                  : "Manual Override"}
              </span>
            </div>
          ) : null}
        </div>

        {/* User Association */}
        <div className="space-y-1">
          <label
            htmlFor={userSelectId}
            className="text-foreground flex items-center gap-1.5 text-xs font-semibold"
          >
            <UserCheck className="size-3.5 text-brand" />
            <span>Associated User</span>
          </label>
          <Select
            id={userSelectId}
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={optionsQuery.isPending}
            className="text-xs"
          >
            <option value="NONE">— No User Mapped (Unassigned) —</option>
            {optionsQuery.data?.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName ? `${u.fullName} (${u.email})` : u.email}
              </option>
            ))}
          </Select>
        </div>

        {/* Asset Association */}
        <div className="space-y-1">
          <label
            htmlFor={assetSelectId}
            className="text-foreground flex items-center gap-1.5 text-xs font-semibold"
          >
            <HardDrive className="size-3.5 text-brand" />
            <span>Associated Asset / Device</span>
          </label>
          <Select
            id={assetSelectId}
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            disabled={optionsQuery.isPending}
            className="text-xs"
          >
            <option value="NONE">— No Asset Mapped (Unassigned) —</option>
            {optionsQuery.data?.assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} [{a.assetCode}] — {a.assetType}
                {a.criticality ? ` (${a.criticality})` : ""}
              </option>
            ))}
          </Select>
        </div>

        {/* Monitored Account Association */}
        <div className="space-y-1">
          <label
            htmlFor={accountSelectId}
            className="text-foreground flex items-center gap-1.5 text-xs font-semibold"
          >
            <ShieldCheck className="size-3.5 text-brand" />
            <span>Monitored Account Link</span>
          </label>
          <Select
            id={accountSelectId}
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            disabled={optionsQuery.isPending}
            className="text-xs"
          >
            <option value="NONE">— No Monitored Account Link —</option>
            {optionsQuery.data?.monitoredAccounts.map((m) => (
              <option key={m.id} value={m.id}>
                {m.accountIdentifier} ({m.sourceSystem})
                {m.displayName ? ` — ${m.displayName}` : ""}
              </option>
            ))}
          </Select>
        </div>

        {/* Confidence Level */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor={confidenceInputId}
              className="text-foreground block text-xs font-semibold"
            >
              Mapping Confidence Score (0% – 100%)
            </label>
            <span className="text-muted text-[11px] font-mono font-medium">
              {confidencePercent}%{" "}
              {confidencePercent >= 90
                ? "— Confirmed / High"
                : confidencePercent >= 70
                  ? "— Probable"
                  : confidencePercent >= 50
                    ? "— Moderate"
                    : "— Tentative"}
            </span>
          </div>
          <div className="relative w-32">
            <Input
              id={confidenceInputId}
              type="number"
              step="5"
              min="0"
              max="100"
              value={confidencePercent}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setConfidencePercent(isNaN(val) ? 0 : Math.min(100, Math.max(0, val)));
              }}
              className="h-8 pr-7 text-xs font-mono"
            />
            <span className="text-muted pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium">
              %
            </span>
          </div>
        </div>

        {/* Reason / Justification */}
        <div className="space-y-1">
          <label
            htmlFor={reasonTextareaId}
            className="text-foreground flex items-center justify-between text-xs font-semibold"
          >
            <span>Reason for Correction *</span>
            <span className="text-muted font-normal text-[11px]">Required for audit trail</span>
          </label>
          <textarea
            id={reasonTextareaId}
            rows={3}
            required
            placeholder="Explain why this mapping was updated (e.g. verified Active Directory logon IP mapping with user)..."
            className="border-border bg-surface text-foreground placeholder:text-muted focus:border-brand focus:ring-brand/15 w-full rounded-lg border p-2.5 text-xs outline-none focus:ring-3"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="text-muted flex items-start gap-1.5 text-[11px]">
          <Info className="size-3.5 shrink-0 mt-0.5" />
          <span>
            Saving this correction marks the mapping as <strong>MANUAL</strong> and archives the previous association in the event audit history.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="secondary"
            className="text-xs px-3 py-1.5"
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="text-xs px-3.5 py-1.5 flex items-center gap-1.5"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="size-3.5" />
            )}
            <span>Save Corrected Mapping</span>
          </Button>
        </div>
      </form>
  );
}

export function EditEntityMappingDialog({
  event,
  isOpen,
  onClose,
  onSuccess,
}: EditEntityMappingDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  if (!event) return null;

  return (
    <Dialog
      className="w-[min(36rem,calc(100%-2rem))]"
      dialogRef={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={onClose}
      title="Review & Correct Entity Mapping"
    >
      {isOpen ? (
        <EditEntityMappingForm
          key={`${event.id}-${event.activeMapping?.id ?? "none"}`}
          event={event}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      ) : null}
    </Dialog>
  );
}
