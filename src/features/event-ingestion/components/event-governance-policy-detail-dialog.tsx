"use client";

import {
  Archive,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Database,
  FileCheck,
  Globe,
  Lock,
  Pencil,
  Shield,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventGovernancePolicyDetail } from "../hooks/use-event-governance";
import type { EventGovernancePolicy } from "../schemas/event-governance-schema";

interface EventGovernancePolicyDetailDialogProps {
  policyId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEditClick?: (policy: EventGovernancePolicy) => void;
}

const familyLabels: Record<string, string> = {
  AUTHENTICATION: "Authentication Events",
  VPN_SSO: "VPN & SSO Access Events",
  APPLICATION_ACCESS: "Application Access Events",
};

const familyBadgeStyles: Record<string, string> = {
  AUTHENTICATION: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  VPN_SSO: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
  APPLICATION_ACCESS: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
};

export function EventGovernancePolicyDetailDialog({
  policyId,
  isOpen,
  onClose,
  onEditClick,
}: EventGovernancePolicyDetailDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const { data: policy, isPending, isError, error } = useEventGovernancePolicyDetail(
    isOpen ? policyId : null,
  );

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

  const handleCopyJson = async () => {
    if (!policy) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(policy, null, 2));
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return "—";
    try {
      return new Date(isoString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <Dialog
      title={policy?.name ? `Policy: ${policy.name}` : "Event Data Governance Policy Details"}
      dialogRef={dialogRef}
      onClose={onClose}
      className="max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100%-2rem))] overflow-y-auto"
    >
      <div className="space-y-6 pt-2">
        {isPending ? (
          <div className="space-y-4 py-2">
            <Skeleton className="h-8 w-3/4 rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : isError ? (
          <Alert>
            Failed to load policy details. {error?.message}
          </Alert>
        ) : policy ? (
          <>
            {/* Top Banner Summary */}
            <div className="bg-neutral-soft/30 border-border flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-foreground text-base font-semibold">
                    {policy.name}
                  </h3>
                  <StatusBadge
                    tone={policy.status === "ACTIVE" ? "success" : "neutral"}
                  >
                    {policy.status === "ACTIVE" ? "ACTIVE" : "INACTIVE"}
                  </StatusBadge>
                </div>
                <p className="text-muted mt-1 text-sm">{policy.purpose}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${
                    policy.eventFamily
                      ? familyBadgeStyles[policy.eventFamily] ??
                        "border-border bg-neutral-soft/60 text-foreground"
                      : "border-border bg-neutral-soft/60 text-foreground"
                  }`}
                >
                  {policy.eventFamily
                    ? familyLabels[policy.eventFamily] ?? policy.eventFamily
                    : "Global (All event families)"}
                </span>
              </div>
            </div>

            {/* Data Lifecycle Timeline Visual */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="text-primary h-4 w-4" />
                <h4 className="text-foreground text-sm font-semibold">
                  Data Lifecycle & Retention Timeline
                </h4>
              </div>
              <div className="bg-neutral-soft/20 border-border grid grid-cols-1 gap-3 rounded-xl border p-4 sm:grid-cols-3">
                <div className="border-border/60 bg-surface flex flex-col justify-between rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-xs font-medium">Phase 1</span>
                    <Database className="text-sky-500 h-4 w-4" />
                  </div>
                  <div className="mt-2">
                    <div className="text-foreground text-sm font-semibold">
                      Hot Storage (Fast Query)
                    </div>
                    <div className="text-muted mt-0.5 text-xs">
                      Day 0 to day{" "}
                      <strong className="text-foreground">
                        {policy.archiveAfterDays ?? policy.retentionDays}
                      </strong>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Real-time queries & analytics</span>
                  </div>
                </div>

                <div className="border-border/60 bg-surface flex flex-col justify-between rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-xs font-medium">Phase 2</span>
                    <Archive className="text-amber-500 h-4 w-4" />
                  </div>
                  <div className="mt-2">
                    <div className="text-foreground text-sm font-semibold">
                      Cold Archival Storage
                    </div>
                    <div className="text-muted mt-0.5 text-xs">
                      {policy.archiveAfterDays ? (
                        <>
                          After{" "}
                          <strong className="text-foreground">
                            {policy.archiveAfterDays} days
                          </strong>{" "}
                          (until day {policy.retentionDays})
                        </>
                      ) : (
                        "No cold archival transition"
                      )}
                    </div>
                  </div>
                  <div
                    className={`mt-3 flex items-center gap-1.5 text-xs ${
                      policy.archiveAfterDays
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted"
                    }`}
                  >
                    {policy.archiveAfterDays ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Compressed & moved to cold storage</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Retained in standard storage</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-border/60 bg-surface flex flex-col justify-between rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-xs font-medium">Phase 3</span>
                    <Trash2 className="text-rose-500 h-4 w-4" />
                  </div>
                  <div className="mt-2">
                    <div className="text-foreground text-sm font-semibold">
                      Automated Purge & Disposal
                    </div>
                    <div className="text-muted mt-0.5 text-xs">
                      After{" "}
                      <strong className="text-foreground">
                        {policy.retentionDays} days
                      </strong>{" "}
                      from ingestion
                    </div>
                  </div>
                  <div
                    className={`mt-3 flex items-center gap-1.5 text-xs ${
                      policy.deletionEnabled
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-muted"
                    }`}
                  >
                    {policy.deletionEnabled ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Automatic purge & disk cleanup</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Manual approval required</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Policy Parameters & Controls Grid */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileCheck className="text-primary h-4 w-4" />
                <h4 className="text-foreground text-sm font-semibold">
                  Governance Rules & Operational Settings
                </h4>
              </div>
              <div className="border-border grid grid-cols-1 gap-4 rounded-xl border p-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-muted flex items-center gap-1.5 text-xs">
                    <Calendar className="h-3.5 w-3.5" />
                    Effective retention period
                  </span>
                  <p className="text-foreground text-sm font-medium">
                    {policy.retentionDays} days
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted flex items-center gap-1.5 text-xs">
                    <Archive className="h-3.5 w-3.5" />
                    Cold archival rule
                  </span>
                  <p className="text-foreground text-sm font-medium">
                    {policy.archiveAfterDays
                      ? `Archive after ${policy.archiveAfterDays} days`
                      : "None (Retained in standard storage)"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted flex items-center gap-1.5 text-xs">
                    <Lock className="h-3.5 w-3.5" />
                    Access scope
                  </span>
                  <p className="text-foreground text-sm font-medium">
                    {policy.accessScope || "SECURITY_OPERATIONS"}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-muted flex items-center gap-1.5 text-xs">
                    <Globe className="h-3.5 w-3.5" />
                    Data export policy
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        policy.exportAllowed
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "bg-neutral-soft text-muted"
                      }`}
                    >
                      {policy.exportAllowed ? "Export allowed" : "Restricted / Prohibited"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Masking & PII Sanitization Rules */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="text-primary h-4 w-4" />
                  <h4 className="text-foreground text-sm font-semibold">
                    Data Masking & PII Sanitization Rules
                  </h4>
                </div>
              </div>
              <div className="bg-neutral-soft/30 border-border rounded-xl border p-4">
                {policy.maskingRules && Object.keys(policy.maskingRules).length > 0 ? (
                  <div className="space-y-2">
                    <pre className="text-foreground bg-surface border-border overflow-x-auto rounded-lg border p-3 font-mono text-xs leading-relaxed">
                      {JSON.stringify(policy.maskingRules, null, 2)}
                    </pre>
                    <p className="text-muted text-xs">
                      Sensitive fields are automatically masked or hashed before event storage.
                    </p>
                  </div>
                ) : (
                  <p className="text-muted text-xs italic">
                    No custom masking rules defined for this policy (Standard system filtering applied).
                  </p>
                )}
              </div>
            </div>

            {/* Audit & Author Metadata */}
            <div className="bg-neutral-soft/20 border-border grid grid-cols-1 gap-3 rounded-xl border p-4 sm:grid-cols-2">
              <div className="flex items-start gap-2.5">
                <User className="text-muted mt-0.5 h-4 w-4" />
                <div className="text-xs">
                  <span className="text-muted block">Created / Updated by</span>
                  <span className="text-foreground font-medium">
                    {policy.updatedBy?.name || policy.createdBy?.name || "System"}
                  </span>
                  <span className="text-muted block">
                    {policy.updatedBy?.email || policy.createdBy?.email || "system@securaai.internal"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="text-muted mt-0.5 h-4 w-4" />
                <div className="text-xs">
                  <span className="text-muted block">Timestamps</span>
                  <span className="text-foreground font-medium">
                    Created: {formatDateTime(policy.createdAt)}
                  </span>
                  <span className="text-muted block">
                    Updated: {formatDateTime(policy.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : null}

        <div className="border-border flex items-center justify-between border-t pt-4">
          <Button
            variant="secondary"
            onClick={handleCopyJson}
            disabled={!policy || isPending}
            className="flex items-center gap-1.5 text-xs"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>{copied ? "Copied" : "Copy JSON"}</span>
          </Button>

          <div className="flex items-center gap-2">
            {policy && onEditClick ? (
              <Button
                variant="primary"
                onClick={() => onEditClick(policy)}
                className="flex items-center gap-1.5 text-xs"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Button>
            ) : null}

            <Button variant="secondary" onClick={onClose} className="text-xs">
              Close
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
