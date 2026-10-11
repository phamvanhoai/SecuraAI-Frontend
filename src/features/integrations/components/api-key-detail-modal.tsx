"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Calendar,
  Check,
  Clock,
  Copy,
  Globe,
  Key,
  Layers,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { getApiKeyDetail } from "../api/integrations";
import {
  apiKeyScopeDetails,
  type ApiKeyDetail,
  type ApiKeyStatus,
  type StandardApiKeyScope,
} from "../schemas/integration-schema";
import { ApiKeyStatusBadge } from "./api-keys-tab";

export function ApiKeyDetailModal({
  keyId,
  integrationId,
  open,
  onClose,
  initialData,
}: {
  keyId: string | null;
  integrationId?: string | undefined;
  open: boolean;
  onClose: () => void;
  initialData?: Partial<ApiKeyDetail> | null | undefined;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

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

  const detailQuery = useQuery({
    queryKey: ["integration-api-key-detail", keyId, integrationId],
    queryFn: () => getApiKeyDetail(keyId!, integrationId),
    enabled: open && Boolean(keyId),
  });

  const keyData: ApiKeyDetail | null = detailQuery.data ?? (initialData as ApiKeyDetail | null) ?? null;

  async function handleCopyFingerprint() {
    const textToCopy = keyData?.keyFingerprint || keyData?.maskedKey || keyData?.keyPrefix;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedFingerprint(true);
      toast.success("Fingerprint Copied", "Masked API key fingerprint copied to clipboard.");
      setTimeout(() => setCopiedFingerprint(false), 2500);
    } catch {
      toast.error("Copy Failed", "Please select and copy the text manually.");
    }
  }

  function handleClose() {
    setCopiedFingerprint(false);
    onClose();
  }

  if (!open) return null;

  return (
    <dialog
      aria-labelledby="api-key-detail-title"
      className="border-border bg-surface text-foreground m-auto max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100%-2rem))] overflow-y-auto rounded-xl border p-0 shadow-2xl backdrop:bg-[#07110f]/55"
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      ref={dialogRef}
    >
      {/* Modal Header */}
      <div className="border-border bg-surface border-b p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-brand flex size-9 items-center justify-center rounded-lg bg-brand/10 border border-brand/20">
              <Key className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="api-key-detail-title" className="text-sm font-semibold tracking-tight">
                  {keyData?.keyName || keyData?.name || "Integration API Key Metadata"}
                </h3>
                {keyData ? <ApiKeyStatusBadge status={keyData.status as ApiKeyStatus} /> : null}
              </div>
              <p className="text-muted text-xs mt-0.5">
                Detailed metadata, security scopes, creator ownership, and usage telemetry.
              </p>
            </div>
          </div>
          <button
            aria-label="Close"
            className="text-muted hover:text-foreground rounded p-1.5 transition-colors"
            onClick={handleClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Modal Body */}
      <div className="space-y-5 p-5 text-xs">
        {detailQuery.isLoading && !keyData ? (
          <div className="space-y-3 py-6">
            <div className="h-6 w-1/3 animate-pulse rounded bg-neutral-soft/60" />
            <div className="h-20 animate-pulse rounded-lg bg-neutral-soft/40" />
            <div className="h-24 animate-pulse rounded-lg bg-neutral-soft/40" />
          </div>
        ) : detailQuery.isError && !keyData ? (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-danger flex items-center justify-between">
            <span>
              {detailQuery.error instanceof Error
                ? detailQuery.error.message
                : "Failed to load key metadata."}
            </span>
            <Button
              className="min-h-7 px-2.5 text-xs"
              onClick={() => detailQuery.refetch()}
              variant="secondary"
            >
              Retry
            </Button>
          </div>
        ) : keyData ? (
          <>
            {/* 1. Identification & Credentials Box */}
            <div className="rounded-lg border border-border bg-neutral-soft/30 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Key Identification
                </span>
                <span className="font-mono text-[10px] text-muted">ID: {keyData.id}</span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="text-muted block text-[11px]">Key Identifier Name</span>
                  <span className="font-medium text-foreground text-xs mt-0.5 block">
                    {keyData.keyName || keyData.name}
                  </span>
                </div>

                <div>
                  <span className="text-muted block text-[11px]">Associated Integration / Source</span>
                  <span className="font-medium text-foreground text-xs mt-0.5 block">
                    {keyData.eventSource?.name || "Global / Unassigned"}
                    {keyData.eventSource?.sourceType ? (
                      <span className="text-muted ml-1 text-[10px] font-normal">
                        ({keyData.eventSource.sourceType})
                      </span>
                    ) : null}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-muted block text-[11px] mb-1">
                  Key Fingerprint (Masked Secret Token)
                </span>
                <div className="flex items-center gap-2">
                  <span className="border-border bg-surface font-mono text-[11px] rounded-md border px-2.5 py-1.5 text-foreground select-all flex-1 tracking-wider">
                    {keyData.keyFingerprint || `${keyData.keyPrefix}...****`}
                  </span>
                  <Button
                    className="min-h-8 h-8 px-2.5 text-xs"
                    onClick={handleCopyFingerprint}
                    type="button"
                    variant="secondary"
                  >
                    {copiedFingerprint ? (
                      <>
                        <Check className="mr-1 size-3 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1 size-3" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* 2. Permission Scopes */}
            <div className="rounded-lg border border-border bg-surface p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5">
                <Shield className="size-3.5 text-brand" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Authorized Permission Scopes ({keyData.scopes?.length ?? 0})
                </span>
              </div>

              {keyData.scopes && keyData.scopes.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2 pt-1">
                  {keyData.scopes.map((scope) => {
                    const info = apiKeyScopeDetails[scope as StandardApiKeyScope];
                    return (
                      <div
                        className="rounded-md border border-border bg-neutral-soft/40 p-2.5 text-xs flex flex-col justify-between"
                        key={scope}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-semibold text-foreground">
                            {scope}
                          </span>
                          <span className="size-1.5 rounded-full bg-brand" />
                        </div>
                        <p className="text-[11px] text-muted mt-1 leading-snug">
                          {info?.description || "Custom integration access permission"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted italic text-xs">No scopes assigned to this key.</p>
              )}
            </div>

            {/* 3. Creator Ownership & Lifecycle */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Creator Card */}
              <div className="rounded-lg border border-border bg-surface p-3.5 space-y-2">
                <div className="flex items-center gap-1.5">
                  <User className="size-3.5 text-muted" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Creator Information
                  </span>
                </div>
                <div className="pt-1">
                  <span className="font-medium text-foreground text-xs block">
                    {keyData.creator?.fullName || "System Administrator"}
                  </span>
                  {keyData.creator?.email ? (
                    <span className="text-muted text-[11px] block mt-0.5">
                      {keyData.creator.email}
                    </span>
                  ) : null}
                  {keyData.creator?.username ? (
                    <span className="text-muted text-[10px] block mt-0.5">
                      Username: @{keyData.creator.username}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Timestamps Card */}
              <div className="rounded-lg border border-border bg-surface p-3.5 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Lifecycle Timestamps
                  </span>
                </div>
                <div className="space-y-1.5 pt-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted">Created At:</span>
                    <span className="font-medium text-foreground">
                      {new Date(keyData.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Expires At:</span>
                    <span
                      className={`font-medium ${
                        keyData.status === "EXPIRED" ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-foreground"
                      }`}
                    >
                      {keyData.expiresAt
                        ? new Date(keyData.expiresAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Never (No Expiration)"}
                    </span>
                  </div>
                  {keyData.rotatedAt ? (
                    <div className="flex justify-between">
                      <span className="text-muted">Rotated At:</span>
                      <span className="text-purple-600 dark:text-purple-400 font-medium">
                        {new Date(keyData.rotatedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  ) : null}
                  {keyData.revokedAt ? (
                    <div className="flex justify-between">
                      <span className="text-muted">Revoked At:</span>
                      <span className="text-rose-600 dark:text-rose-400 font-medium">
                        {new Date(keyData.revokedAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* 4. Available Usage & Telemetry Information */}
            <div className="rounded-lg border border-border bg-neutral-soft/30 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="size-3.5 text-brand" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Available Usage Information & Telemetry
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    keyData.usage?.isUsed || keyData.lastUsedAt
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-neutral-soft text-muted border border-border"
                  }`}
                >
                  {keyData.usage?.isUsed || keyData.lastUsedAt ? "Active Ingestion Usage" : "Never Used Yet"}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-border bg-surface p-2.5">
                  <div className="flex items-center gap-1 text-muted text-[10px] mb-1">
                    <Clock className="size-3" />
                    Last Used Time
                  </div>
                  <span className="font-medium text-foreground text-xs block">
                    {keyData.usage?.lastUsedAt || keyData.lastUsedAt
                      ? new Date(keyData.usage?.lastUsedAt || keyData.lastUsedAt!).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Never"}
                  </span>
                </div>

                <div className="rounded-md border border-border bg-surface p-2.5">
                  <div className="flex items-center gap-1 text-muted text-[10px] mb-1">
                    <Globe className="size-3" />
                    Last Used IP Address
                  </div>
                  <span className="font-mono text-foreground text-xs block">
                    {keyData.usage?.lastUsedIp || keyData.lastUsedIp || "—"}
                  </span>
                </div>

                <div className="rounded-md border border-border bg-surface p-2.5">
                  <div className="flex items-center gap-1 text-muted text-[10px] mb-1">
                    <Layers className="size-3" />
                    Audit Log Events
                  </div>
                  <span className="font-medium text-foreground text-xs block">
                    {keyData.usage?.totalAuditEvents ?? 0} request events
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : null}

        {/* Modal Footer */}
        <div className="border-border flex justify-end gap-2 border-t pt-4">
          <Button
            className="min-h-8 px-4 text-xs font-medium"
            onClick={handleClose}
            type="button"
          >
            Close Details
          </Button>
        </div>
      </div>
    </dialog>
  );
}
