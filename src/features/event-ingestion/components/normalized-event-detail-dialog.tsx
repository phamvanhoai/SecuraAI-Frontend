"use client";

import {
  Copy,
  HardDrive,
  Layers,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  User,
  UserCheck,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useNormalizedEventDetail } from "../hooks/use-normalized-events";
import { cn } from "@/lib/utils";

const mappingStatusTones = {
  MAPPED: "success",
  PARTIALLY_MAPPED: "warning",
  UNMAPPED: "neutral",
  NEEDS_REVIEW: "danger",
} as const;

const familyStyles: Record<string, string> = {
  AUTHENTICATION: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  VPN_SSO: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  APPLICATION_ACCESS:
    "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
};

const formatFamilyLabel: Record<string, string> = {
  AUTHENTICATION: "Authentication",
  VPN_SSO: "VPN / SSO",
  APPLICATION_ACCESS: "App Access",
};

function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "medium",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function NormalizedEventDetailDialog({
  eventId,
  isOpen,
  onClose,
}: {
  eventId: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();

  const eventQuery = useNormalizedEventDetail(isOpen ? eventId : null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  async function copyPayloadToClipboard(payload: unknown) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success("Payload copied", "Normalized event payload copied to clipboard.");
    } catch {
      toast.error("Copy failed", "Unable to copy payload to clipboard.");
    }
  }

  const event = eventQuery.data;

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(56rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={onClose}
      title="Security Event Inspection"
    >
      <div className="space-y-5">
        {eventQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted">
            <Loader2 className="size-8 animate-spin mb-3 text-primary" />
            <p className="text-sm font-medium">Loading event details...</p>
          </div>
        ) : eventQuery.isError || !event ? (
          <div className="space-y-4">
            <Alert>
              {eventQuery.error?.message || "Unable to load security event details."}
            </Alert>
            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Header & Status Banner */}
            <div className="border-border bg-neutral-soft/30 rounded-xl border p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border pb-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-foreground text-lg font-bold font-mono">
                      {event.eventType}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider",
                        familyStyles[event.eventFamily] ??
                          "border-border bg-neutral-soft text-foreground",
                      )}
                    >
                      {formatFamilyLabel[event.eventFamily] ?? event.eventFamily}
                    </span>
                    <StatusBadge
                      tone={mappingStatusTones[event.mappingStatus] ?? "neutral"}
                    >
                      {event.mappingStatus.replace(/_/g, " ")}
                    </StatusBadge>
                    {event.severity ? (
                      <span className="text-xs font-semibold bg-neutral-soft px-2 py-0.5 rounded border border-border">
                        Severity: {event.severity}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted text-xs font-mono">
                    Event UUID: {event.id}
                  </p>
                </div>

                {event.anomalyCount > 0 ? (
                  <div className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                    <ShieldAlert className="size-4 shrink-0" />
                    <span>{event.anomalyCount} Anomaly Detected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="size-4 shrink-0" />
                    <span>Normal Telemetry</span>
                  </div>
                )}
              </div>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-background rounded-lg border border-border p-2.5">
                  <span className="text-muted block text-[11px] mb-0.5">
                    Event Source
                  </span>
                  <strong className="text-foreground font-semibold block truncate">
                    {event.eventSourceName}
                  </strong>
                  <span className="text-muted font-mono text-[10px]">
                    {event.eventSourceType}
                  </span>
                </div>

                <div className="bg-background rounded-lg border border-border p-2.5">
                  <span className="text-muted block text-[11px] mb-0.5">
                    Occurred At
                  </span>
                  <strong className="text-foreground font-mono text-xs block">
                    {formatDateTime(event.occurredAt)}
                  </strong>
                </div>

                <div className="bg-background rounded-lg border border-border p-2.5">
                  <span className="text-muted block text-[11px] mb-0.5">
                    Ingested At
                  </span>
                  <strong className="text-foreground font-mono text-xs block">
                    {formatDateTime(event.ingestedAt)}
                  </strong>
                </div>

                <div className="bg-background rounded-lg border border-border p-2.5">
                  <span className="text-muted block text-[11px] mb-0.5">
                    External Event ID
                  </span>
                  <span className="text-foreground font-mono text-xs block truncate">
                    {event.externalEventId ?? "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Entity Mapping & Correlation Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* User / Identity Section */}
              <div className="border-border rounded-xl border p-4 space-y-3 bg-background">
                <div className="flex items-center gap-2 border-b border-border pb-2.5">
                  <User className="size-4 text-primary" />
                  <h4 className="text-foreground font-semibold text-sm">
                    Identity & Account
                  </h4>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-muted block text-[11px]">
                      Account Identifier
                    </span>
                    <span className="text-foreground font-mono font-medium">
                      {event.accountIdentifier ?? "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted block text-[11px]">
                      Mapped User Profile
                    </span>
                    {event.mappedUser ? (
                      <div className="mt-1 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
                          <UserCheck className="size-3.5" />
                          <span>{event.mappedUser.fullName ?? event.mappedUser.email}</span>
                        </div>
                        <p className="text-muted text-[11px] font-mono">
                          Email: {event.mappedUser.email}
                        </p>
                        <p className="text-muted text-[10px] font-mono">
                          User ID: {event.mappedUser.id}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted italic block mt-0.5">
                        No user mapped to this account identifier
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Asset & Network Section */}
              <div className="border-border rounded-xl border p-4 space-y-3 bg-background">
                <div className="flex items-center gap-2 border-b border-border pb-2.5">
                  <HardDrive className="size-4 text-primary" />
                  <h4 className="text-foreground font-semibold text-sm">
                    Asset & Network Context
                  </h4>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted block text-[11px]">Source IP</span>
                      <span className="text-foreground font-mono font-medium">
                        {event.sourceIp ?? "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted block text-[11px]">Destination IP</span>
                      <span className="text-foreground font-mono font-medium">
                        {event.destinationIp ?? "—"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted block text-[11px]">
                      Device Identifier
                    </span>
                    <span className="text-foreground font-mono font-medium truncate block">
                      {event.deviceIdentifier ?? "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-muted block text-[11px]">
                      Associated IT Asset
                    </span>
                    {event.mappedAsset ? (
                      <div className="mt-1 rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-blue-700 dark:text-blue-300 font-semibold">
                            {event.mappedAsset.name}
                          </strong>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-300">
                            {event.mappedAsset.criticality}
                          </span>
                        </div>
                        <p className="text-muted text-[11px] font-mono">
                          Code: {event.mappedAsset.assetCode} ({event.mappedAsset.assetType})
                        </p>
                        <p className="text-muted text-[10px] font-mono">
                          Asset ID: {event.mappedAsset.id}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted italic block mt-0.5">
                        No asset associated
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Anomaly Detections (if present) */}
            {event.anomalyDetections && event.anomalyDetections.length > 0 && (
              <div className="border-border rounded-xl border p-4 space-y-3 bg-red-500/5">
                <div className="flex items-center gap-2 border-b border-border pb-2.5 text-red-600 dark:text-red-400">
                  <ShieldAlert className="size-4" />
                  <h4 className="font-semibold text-sm">
                    AI Anomaly Detections ({event.anomalyDetections.length})
                  </h4>
                </div>

                <div className="space-y-2">
                  {event.anomalyDetections.map((detection) => (
                    <div
                      key={detection.id}
                      className="border-border bg-background rounded-lg border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            Detection ID: {detection.id.slice(0, 8)}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded",
                              detection.isAnomaly
                                ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                : "bg-neutral-soft text-muted",
                            )}
                          >
                            {detection.isAnomaly ? "ANOMALY" : "NORMAL"}
                          </span>
                        </div>
                        <p className="text-muted text-[11px] font-mono">
                          Detected At: {formatDateTime(detection.detectedAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div>
                          <span className="text-muted block text-[10px]">Score</span>
                          <strong className="text-foreground font-bold">
                            {detection.anomalyScore.toFixed(4)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-muted block text-[10px]">Threshold</span>
                          <span className="text-muted">
                            {detection.threshold.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ingestion & Raw Details */}
            <div className="border-border rounded-xl border p-4 space-y-3 bg-background">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-primary" />
                  <h4 className="text-foreground font-semibold text-sm">
                    Ingestion Metadata & Batch Info
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-muted block text-[11px]">Batch ID</span>
                  <span className="text-foreground font-mono font-medium truncate block">
                    {event.ingestionBatchId ?? "Direct stream / Real-time"}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Schema Version</span>
                  <span className="text-foreground font-mono font-medium">
                    {event.schemaVersion ?? "v1.0"}
                  </span>
                </div>
                <div>
                  <span className="text-muted block text-[11px]">Created At</span>
                  <span className="text-foreground font-mono">
                    {formatDateTime(event.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Normalized Payload JSON Viewer */}
            <div className="border-border rounded-xl border overflow-hidden bg-background">
              <div className="border-b border-border bg-neutral-soft/50 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-semibold text-xs">
                    Normalized Event Payload (JSON)
                  </span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-7 py-0.5 px-2 text-xs flex items-center gap-1.5"
                  onClick={() => copyPayloadToClipboard(event.normalizedPayload)}
                >
                  <Copy className="size-3.5" />
                  <span>Copy Payload</span>
                </Button>
              </div>

              <div className="p-3 bg-neutral-soft/20 max-h-72 overflow-y-auto">
                <pre className="text-foreground font-mono text-xs leading-relaxed whitespace-pre-wrap break-all select-all">
                  {JSON.stringify(event.normalizedPayload, null, 2)}
                </pre>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="flex justify-end pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
