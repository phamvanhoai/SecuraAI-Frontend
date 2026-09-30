"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Activity,
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Database,
  Globe,
  Info,
  KeyRound,
  Layers,
  Loader2,
  Power,
  ShieldCheck,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { StatusBadge } from "@/components/data-display/static-product";
import { FormField } from "@/components/forms/form-field";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useEventSource, useUpdateEventSource } from "../hooks/use-event-sources";
import {
  eventFamilies,
  updateEventSourceFormSchema,
  type EventSourceDetailResponse,
  type EventSourceResponse,
  type UpdateEventSourceFormValues,
} from "../schemas/event-source-schema";
import { TestEventSourceDialog } from "./test-event-source-dialog";
import { ToggleEventSourceStatusDialog } from "./toggle-event-source-status-dialog";

const statusTones = {
  ACTIVE: "success",
  INACTIVE: "neutral",
} as const;

const apiKeyStatusTones = {
  ACTIVE: "success",
  EXPIRED: "warning",
  REVOKED: "danger",
  ROTATED: "neutral",
} as const;

const sourceTypeStyles: Record<string, string> = {
  WAZUH: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20",
  IDENTITY_PROVIDER:
    "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
  FIREWALL: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  EDR: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
};

const formatFamilyLabel: Record<string, string> = {
  AUTHENTICATION: "Authentication",
  VPN_SSO: "VPN / SSO",
  APPLICATION_ACCESS: "App Access",
  NETWORK_TRAFFIC: "Network Traffic",
  SYSTEM_LOGS: "System Logs",
  AUDIT_LOGS: "Audit Logs",
};

const FAMILY_METADATA = {
  AUTHENTICATION: {
    label: "Authentication & Identity",
    description:
      "Windows logon events (4624, 4625, 4740), Linux SSH/PAM auth, and brute-force attempts.",
    badgeClass: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  },
  VPN_SSO: {
    label: "VPN & Remote SSO Access",
    description:
      "Remote access via OpenVPN, Cisco, Fortinet gateways, and Keycloak/Okta/Azure AD SSO logs.",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  APPLICATION_ACCESS: {
    label: "Application & Privilege Access",
    description:
      "Application logins, database authentications, and Windows/Linux privilege use (4672).",
    badgeClass: "border-purple-500/30 bg-purple-500/10 text-purple-400",
  },
} as const;

export function EventSourceDetailDialog({
  sourceId,
  onClose,
  onUpdated,
}: {
  sourceId: string | null;
  onClose: () => void;
  onUpdated?: ((updated: EventSourceResponse) => void) | undefined;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [connectionHealth, setConnectionHealth] = useState<{
    connected: boolean;
    message: string;
    latencyMs: number;
  } | null>(null);

  const detailQuery = useEventSource(sourceId);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (sourceId && !dialog.open) {
      setIsEditing(false);
      setIsTogglingStatus(false);
      setConnectionHealth(null);
      dialog.showModal();
    }
    if (!sourceId && dialog.open) {
      setIsEditing(false);
      setIsTogglingStatus(false);
      setConnectionHealth(null);
      dialog.close();
    }
  }, [sourceId]);

  function copyToClipboard(text: string, keyId: string) {
    void navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === keyId ? null : curr));
    }, 2000);
  }

  const handleClose = () => {
    setIsEditing(false);
    setIsTogglingStatus(false);
    onClose();
  };

  const source = detailQuery.data;

  return (
    <>
      <Dialog
        className="max-h-[calc(100dvh-2rem)] w-[min(48rem,calc(100%-2rem))] overflow-y-auto"
        dialogRef={dialogRef}
        onClose={handleClose}
        title={isEditing ? "Update Event Source Configuration" : "Event Source Details"}
      >
      {detailQuery.isPending ? (
        <div className="space-y-4 py-2">
          <Skeleton className="h-8 w-3/4 rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      ) : detailQuery.isError ? (
        <Alert>
          Unable to load event source details. Please check your network
          connection and permissions.
        </Alert>
      ) : source ? (
        isEditing ? (
          <EditEventSourceInlineForm
            key={source.id}
            source={source}
            onCancel={() => setIsEditing(false)}
            onSuccess={(updated) => {
              setIsEditing(false);
              onUpdated?.(updated);
            }}
          />
        ) : (
          <div className="space-y-6">
            {/* Header section */}
            <div className="border-border flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-foreground text-xl font-semibold">
                    {source.name}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${
                      sourceTypeStyles[source.sourceType] ??
                      "border-border bg-neutral-soft/60 text-foreground"
                    }`}
                  >
                    {source.sourceType}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-muted font-mono text-xs break-all">
                    {source.id}
                  </p>
                  <button
                    className="text-muted hover:text-foreground inline-flex items-center p-0.5 transition-colors"
                    onClick={() => copyToClipboard(source.id, "source-id")}
                    title="Copy source ID"
                    type="button"
                  >
                    {copiedKey === "source-id" ? (
                      <Check className="text-success size-3" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone={statusTones[source.status]}>
                  {source.status === "ACTIVE" ? "Active" : "Inactive"}
                </StatusBadge>
                {connectionHealth ? (
                  <StatusBadge tone={connectionHealth.connected ? "success" : "danger"}>
                    {connectionHealth.connected ? `Reachable (${connectionHealth.latencyMs}ms)` : "Connection Failed"}
                  </StatusBadge>
                ) : null}
                <Button
                  className={`min-h-8 gap-1.5 px-2.5 text-xs font-medium ${
                    source.status === "ACTIVE"
                      ? "text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                      : "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  }`}
                  onClick={() => setIsTogglingStatus(true)}
                  title={
                    source.status === "ACTIVE"
                      ? "Pause event ingestion"
                      : "Resume event ingestion"
                  }
                  type="button"
                  variant="secondary"
                >
                  <Power aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
                  <span>{source.status === "ACTIVE" ? "Pause" : "Resume"}</span>
                </Button>
                <Button
                  className="min-h-8 gap-1.5 px-2.5 text-xs font-medium"
                  onClick={() => setIsEditing(true)}
                  type="button"
                  variant="secondary"
                >
                  <SlidersHorizontal aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
                  <span>Configure</span>
                </Button>
              </div>
            </div>

            {/* Live Connection Health Diagnostic Banner */}
            {connectionHealth ? (
              connectionHealth.connected ? (
                <div className="border-border bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center gap-2.5 rounded-lg border border-emerald-500/20 px-3.5 py-2.5 text-xs">
                  <Activity className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="font-semibold">Connection Verified:</span> Wazuh Manager is reachable and responding ({connectionHealth.latencyMs}ms latency).
                  </div>
                </div>
              ) : (
                <div className="border-border bg-rose-500/10 text-rose-700 dark:text-rose-400 flex items-start gap-2.5 rounded-lg border border-rose-500/20 p-3 text-xs">
                  <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">Connection Check Failed</p>
                    <p className="text-muted-foreground">{connectionHealth.message}</p>
                  </div>
                </div>
              )
            ) : null}

            {/* Configuration Grid */}
            <section aria-labelledby="configuration-heading">
              <h4
                className="text-muted mb-3 text-xs font-bold tracking-wider uppercase"
                id="configuration-heading"
              >
                Ingestion Configuration
              </h4>
              <div className="border-border bg-neutral-soft/30 grid gap-4 rounded-xl border p-4 sm:grid-cols-2">
                <Detail
                  label="Ingestion Method"
                  value={source.ingestionMethod}
                />
                <Detail
                  label="Authentication Type"
                  value={source.authenticationType ?? "None"}
                />
                <div className="sm:col-span-2">
                  <dt className="text-muted text-xs font-medium tracking-wide uppercase">
                    Endpoint URL
                  </dt>
                  <dd className="mt-1">
                    {source.endpoint ? (
                      <div className="border-border bg-surface flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                        <span className="text-foreground truncate font-mono text-xs">
                          {source.endpoint}
                        </span>
                        <button
                          className="text-muted hover:text-foreground inline-flex shrink-0 items-center p-1 transition-colors"
                          onClick={() =>
                            copyToClipboard(source.endpoint ?? "", "endpoint")
                          }
                          title="Copy endpoint URL"
                          type="button"
                        >
                          {copiedKey === "endpoint" ? (
                            <Check className="text-success size-3.5" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted text-sm font-medium">
                        Not specified
                      </span>
                    )}
                  </dd>
                </div>
                {source.description ? (
                  <div className="sm:col-span-2">
                    <Detail
                      label="Description"
                      value={source.description}
                    />
                  </div>
                ) : null}
              </div>
            </section>

            {/* Supported Event Families */}
            <section aria-labelledby="event-families-heading">
              <h4
                className="text-muted mb-3 text-xs font-bold tracking-wider uppercase"
                id="event-families-heading"
              >
                Supported Event Families
              </h4>
              <div className="border-border bg-surface flex flex-wrap gap-2 rounded-xl border p-4">
                {source.eventFamilies.map((family) => (
                  <span
                    className="border-primary/20 bg-primary/10 text-primary inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium"
                    key={family}
                  >
                    <ShieldCheck aria-hidden="true" className="size-3.5" />
                    {formatFamilyLabel[family] ?? family}
                  </span>
                ))}
              </div>
            </section>

            {/* Masked Credentials & API Keys */}
            <section aria-labelledby="credentials-heading">
              <div className="mb-3 flex items-center justify-between">
                <h4
                  className="text-muted text-xs font-bold tracking-wider uppercase"
                  id="credentials-heading"
                >
                  Ingestion Credentials (Masked)
                </h4>
                <span className="text-muted text-xs">
                  {source.apiKeys.length} key(s) linked
                </span>
              </div>
              {source.apiKeys.length === 0 ? (
                <div className="border-border bg-neutral-soft/20 rounded-xl border p-4 text-center">
                  <KeyRound className="text-muted mx-auto size-6 stroke-1" />
                  <p className="text-muted mt-1 text-xs">
                    No active API keys or credentials linked to this event source.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {source.apiKeys.map((key) => (
                    <div
                      className="border-border bg-surface flex flex-col gap-2 rounded-xl border p-3.5 sm:flex-row sm:items-center sm:justify-between"
                      key={key.id}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <strong className="text-foreground text-sm font-semibold">
                            {key.name}
                          </strong>
                          <StatusBadge tone={apiKeyStatusTones[key.status]}>
                            {key.status}
                          </StatusBadge>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-muted font-mono text-xs">
                            {key.maskedKey}
                          </span>
                          <button
                            className="text-muted hover:text-foreground inline-flex items-center p-0.5 transition-colors"
                            onClick={() =>
                              copyToClipboard(key.keyPrefix, `prefix-${key.id}`)
                            }
                            title="Copy key prefix"
                            type="button"
                          >
                            {copiedKey === `prefix-${key.id}` ? (
                              <Check className="text-success size-3" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="text-muted text-xs sm:text-right">
                        <p>
                          Last used:{" "}
                          {key.lastUsedAt ? formatDate(key.lastUsedAt) : "Never"}
                        </p>
                        {key.lastUsedIp ? (
                          <p className="font-mono text-[11px]">
                            IP: {key.lastUsedIp}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Ingestion Statistics */}
            <section aria-labelledby="stats-heading">
              <h4
                className="text-muted mb-3 text-xs font-bold tracking-wider uppercase"
                id="stats-heading"
              >
                Ingestion Activity & Statistics
              </h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="border-border bg-surface rounded-xl border p-3.5">
                  <p className="text-muted text-xs">Total Ingested Events</p>
                  <p className="text-foreground mt-1 text-xl font-bold">
                    {source.stats.totalIngestedEvents.toLocaleString()}
                  </p>
                </div>
                <div className="border-border bg-surface rounded-xl border p-3.5">
                  <p className="text-muted text-xs">Ingestion Batches</p>
                  <p className="text-foreground mt-1 text-xl font-bold">
                    {source.stats.totalBatches.toLocaleString()}
                  </p>
                </div>
                <div className="border-border bg-surface col-span-2 rounded-xl border p-3.5 sm:col-span-1">
                  <p className="text-muted text-xs">Last Event Received</p>
                  <p className="text-foreground mt-1 text-sm font-semibold">
                    {source.stats.lastIngestedAt
                      ? formatDate(source.stats.lastIngestedAt)
                      : "Never"}
                  </p>
                </div>
              </div>
            </section>

            {/* Metadata & Audit footer */}
            <div className="border-border bg-neutral-soft/20 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <User aria-hidden="true" className="size-3.5" />
                <span>
                  Created by:{" "}
                  <strong className="text-foreground font-medium">
                    {source.creator?.fullName ??
                      source.creator?.email ??
                      source.createdBy}
                  </strong>
                </span>
              </div>
              <div className="flex gap-4">
                <span>Created: {formatDate(source.createdAt)}</span>
                <span>Updated: {formatDate(source.updatedAt)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setIsEditing(true)}
                  type="button"
                  className="flex items-center gap-1.5"
                >
                  <SlidersHorizontal aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
                  <span>Configure Source</span>
                </Button>
                <Button
                  onClick={() => setIsTestingConnection(true)}
                  type="button"
                  variant="secondary"
                  className="flex items-center gap-1.5"
                >
                  <Activity aria-hidden="true" className="size-3.5" strokeWidth={1.8} />
                  <span>Test connection</span>
                </Button>
              </div>
              <Button
                onClick={handleClose}
                type="button"
                variant="secondary"
              >
                Close
              </Button>
            </div>
          </div>
        )
      ) : null}
    </Dialog>

    {isTestingConnection ? (
      <TestEventSourceDialog
        initialEndpoint={source?.endpoint ?? ""}
        isOpen={isTestingConnection}
        onClose={() => setIsTestingConnection(false)}
        onTestComplete={(result) => {
          setConnectionHealth({
            connected: result.connected,
            message: result.message,
            latencyMs: result.latencyMs,
          });
        }}
      />
    ) : null}

    <ToggleEventSourceStatusDialog
      onClose={() => setIsTogglingStatus(false)}
      onSuccess={(updated) => {
        onUpdated?.(updated);
      }}
      source={isTogglingStatus && source ? source : null}
    />
  </>
  );
}

function EditEventSourceInlineForm({
  source,
  onCancel,
  onSuccess,
}: {
  source: EventSourceDetailResponse;
  onCancel: () => void;
  onSuccess?: ((updated: EventSourceResponse) => void) | undefined;
}) {
  const toast = useToast();
  const updateMutation = useUpdateEventSource();

  const [form, setForm] = useState<UpdateEventSourceFormValues>({
    name: source.name,
    endpoint: source.endpoint ?? "",
    ingestionMethod: source.ingestionMethod,
    authenticationType: source.authenticationType ?? "BEARER_TOKEN",
    status: source.status,
    description: source.description ?? "",
    eventFamilies: source.eventFamilies,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [connectionHealth, setConnectionHealth] = useState<{
    connected: boolean;
    message: string;
    latencyMs: number;
  } | null>(null);
  const [hasTestedValid, setHasTestedValid] = useState(false);

  const handleFamilyToggle = (family: (typeof eventFamilies)[number]) => {
    setForm((prev) => {
      const exists = prev.eventFamilies.includes(family);
      const updated = exists
        ? prev.eventFamilies.filter((f) => f !== family)
        : [...prev.eventFamilies, family];
      return { ...prev, eventFamilies: updated };
    });
    if (fieldErrors["eventFamilies"]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next["eventFamilies"];
        return next;
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    const validation = updateEventSourceFormSchema.safeParse({
      ...form,
      ingestionMethod: "API",
    });

    if (!validation.success) {
      const formattedErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const path = String(issue.path[0]);
        if (path && !formattedErrors[path]) {
          formattedErrors[path] = issue.message;
        }
      }
      setFieldErrors(formattedErrors);
      return;
    }

    setFieldErrors({});

    try {
      const updated = await updateMutation.mutateAsync({
        id: source.id,
        values: validation.data,
      });
      toast.success(
        "Cấu hình đã được cập nhật",
        `Đã lưu thay đổi cấu hình kết nối cho nguồn sự kiện "${updated.name}".`,
      );
      onSuccess?.(updated);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Không thể cập nhật cấu hình nguồn sự kiện. Vui lòng thử lại.";
      setSubmitError(message);
      toast.error("Cập nhật thất bại", message);
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {submitError ? (
        <Alert className="border-danger/25 bg-danger-soft text-danger">
          <strong className="block font-semibold">Update Error</strong>
          <p>{submitError}</p>
        </Alert>
      ) : null}

      {/* IMMUTABLE SYSTEM IDENTIFIERS BAR */}
      <div className="rounded-lg border border-border bg-neutral-soft/30 p-3.5 text-xs text-muted">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">ID:</span>
            <code className="font-mono text-xs text-muted">{source.id}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Type:</span>
            <span className="inline-block rounded-md border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-700 dark:text-sky-300">
              {source.sourceType}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Status:</span>
            <StatusBadge tone={statusTones[form.status]}>
              {form.status === "ACTIVE" ? "Active" : "Inactive"}
            </StatusBadge>
          </div>
          {source.creator ? (
            <div className="flex items-center gap-1.5 text-muted">
              <User className="h-3.5 w-3.5 text-muted" />
              <span>Created by {source.creator.fullName ?? source.creator.email}</span>
            </div>
          ) : null}
        </div>
      </div>

      {/* SECTION 1: Source Identity */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Database className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-semibold text-foreground">
            1. Event Source Identity
          </h3>
        </div>

        <FormField
          id="edit-source-name"
          label="Event source name *"
          error={fieldErrors["name"]}
        >
          <Input
            id="edit-source-name"
            placeholder="Wazuh Production Manager"
            value={form.name}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, name: e.target.value }));
              if (fieldErrors["name"]) {
                setFieldErrors((p) => {
                  const n = { ...p };
                  delete n["name"];
                  return n;
                });
              }
            }}
            disabled={updateMutation.isPending}
          />
        </FormField>
      </div>

      {/* SECTION 2: Connection & Webhook Endpoint */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Globe className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-semibold text-foreground">
            2. Connection & Webhook Endpoint (Push Model)
          </h3>
        </div>

        <FormField
          id="edit-source-endpoint"
          label="Wazuh Manager Endpoint URL *"
          error={fieldErrors["endpoint"]}
        >
          <Input
            id="edit-source-endpoint"
            placeholder="https://127.0.0.1:56000 or /api/v1/integrations/wazuh/events"
            value={form.endpoint ?? ""}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, endpoint: e.target.value }));
              setHasTestedValid(false);
              setConnectionHealth(null);
              if (fieldErrors["endpoint"]) {
                setFieldErrors((p) => {
                  const n = { ...p };
                  delete n["endpoint"];
                  return n;
                });
              }
            }}
            disabled={updateMutation.isPending}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            id="edit-source-method"
            label="Ingestion method"
          >
            <Input
              id="edit-source-method"
              value="Webhook / REST API (Push)"
              readOnly
              disabled
              className="cursor-not-allowed bg-neutral-soft/50 text-muted"
            />
          </FormField>

          <FormField
            id="edit-source-auth"
            label="Authentication method"
          >
            <Input
              id="edit-source-auth"
              value="API Token / Secret Key (Bearer)"
              readOnly
              disabled
              className="cursor-not-allowed bg-neutral-soft/50 text-muted"
            />
          </FormField>
        </div>

        <div className="flex items-start gap-2.5 rounded-lg border border-info/20 bg-info-soft/40 p-3 text-xs text-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
          <span>
            Wazuh Manager sends normalized security events to SecuraAI using this configured endpoint.
          </span>
        </div>

        {connectionHealth ? (
          connectionHealth.connected ? (
            <div className="border-border bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center gap-2.5 rounded-lg border border-emerald-500/20 px-3.5 py-2.5 text-xs">
              <Activity className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-semibold">Connection Verified:</span> Wazuh Manager is reachable and responding ({connectionHealth.latencyMs}ms latency). You may now save your updated configuration.
              </div>
            </div>
          ) : (
            <div className="border-border bg-rose-500/10 text-rose-700 dark:text-rose-400 flex items-start gap-2.5 rounded-lg border border-rose-500/20 p-3 text-xs">
              <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold">Connection Check Failed</p>
                <p className="text-muted-foreground">{connectionHealth.message}</p>
              </div>
            </div>
          )
        ) : (
          <div className="border-border bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center gap-2.5 rounded-lg border border-amber-500/20 px-3 py-2 text-xs">
            <AlertCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              Please run a successful <strong>Test connection</strong> before saving configuration.
            </span>
          </div>
        )}
      </div>

      {/* SECTION 3: Supported Event Families */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Layers className="h-4 w-4 text-brand" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              3. Supported Event Families
            </h3>
            <p className="text-xs text-muted">
              Select security event families filtered and normalized by Wazuh Edge Normalizer.
            </p>
          </div>
        </div>

        {fieldErrors["eventFamilies"] ? (
          <p className="text-xs font-medium text-danger">{fieldErrors["eventFamilies"]}</p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          {eventFamilies.map((family) => {
            const meta = FAMILY_METADATA[family];
            const isSelected = form.eventFamilies.includes(family);

            return (
              <button
                key={family}
                type="button"
                onClick={() => handleFamilyToggle(family)}
                className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-brand ${
                  isSelected
                    ? "border-brand bg-brand/5 shadow-xs"
                    : "border-border bg-surface hover:border-border/80"
                }`}
                disabled={updateMutation.isPending}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    {meta.label}
                  </span>
                  {isSelected ? (
                    <CheckCircle2 className="h-4 w-4 text-brand" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-border" />
                  )}
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
                  {meta.description}
                </p>
                <span
                  className={`mt-2.5 inline-block rounded-md border px-2 py-0.5 text-[10px] font-mono ${meta.badgeClass}`}
                >
                  {family}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: Description */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <KeyRound className="h-4 w-4 text-brand" />
          <h3 className="text-sm font-semibold text-foreground">
            4. Description & Operational Notes
          </h3>
        </div>

        <FormField
          id="edit-source-description"
          label="Description"
          error={fieldErrors["description"]}
        >
          <textarea
            id="edit-source-description"
            rows={3}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/15"
            placeholder="Describe the operational scope, monitored hosts, or special notes..."
            value={form.description ?? ""}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, description: e.target.value }));
            }}
            disabled={updateMutation.isPending}
          />
        </FormField>
      </div>

      {/* MODAL ACTIONS */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setTestModalOpen(true)}
          className="flex items-center gap-1.5"
        >
          <Activity aria-hidden="true" className="size-4" strokeWidth={1.8} />
          <span>Test connection</span>
        </Button>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={!hasTestedValid || updateMutation.isPending}
            className="flex items-center gap-2"
            title={!hasTestedValid ? "Please run a successful Test Connection before saving configuration" : undefined}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Save configuration
              </>
            )}
          </Button>
        </div>
      </div>
    </form>

    {testModalOpen ? (
      <TestEventSourceDialog
        initialEndpoint={form.endpoint || source.endpoint || "https://127.0.0.1:56000"}
        initialUsername="wazuh-wui"
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        onTestComplete={(result) => {
          setConnectionHealth({
            connected: result.connected,
            message: result.message,
            latencyMs: result.latencyMs,
          });
          if (result.connected) {
            setHasTestedValid(true);
          } else {
            setHasTestedValid(false);
          }
        }}
      />
    ) : null}
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-foreground mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
