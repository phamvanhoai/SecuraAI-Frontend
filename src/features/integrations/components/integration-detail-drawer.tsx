"use client";

import {
  Clock,
  Edit2,
  Flame,
  Globe,
  ListOrdered,
  RefreshCw,
  Save,
  Server,
  Shield,
  Wifi,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api/api-error";
import {
  useIntegration,
  useUpdateIntegration,
} from "../hooks/use-integrations";
import type {
  Integration,
  IntegrationStatus,
} from "../schemas/integration-schema";
import {
  IntegrationStatusBadge,
  IntegrationTypeBadge,
} from "./integration-status-badge";
import { IntegrationLogsTab } from "./integration-logs-tab";
import { SyncJobsTab } from "./sync-jobs-tab";
import { SyncSchedulesTab } from "./sync-schedules-tab";
import { TestConnectionDialog } from "./test-connection-dialog";

type DetailTab = "overview" | "schedules" | "jobs" | "logs";

function IntegrationOverviewTab({
  integration,
  isEditing,
  onCancelEdit,
  onSaved,
}: {
  integration: Integration;
  isEditing: boolean;
  onCancelEdit: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const updateMutation = useUpdateIntegration();

  const [name, setName] = useState(integration.name);
  const [baseUrl, setBaseUrl] = useState(integration.baseUrl ?? "");
  const [status, setStatus] = useState<IntegrationStatus>(integration.status);
  const [configJson, setConfigJson] = useState(
    integration.configuration
      ? JSON.stringify(integration.configuration, null, 2)
      : "{}",
  );
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    let parsedConfig: Record<string, unknown> | null = null;
    if (configJson.trim()) {
      try {
        parsedConfig = JSON.parse(configJson) as Record<string, unknown>;
      } catch {
        setFormError("Invalid JSON configuration. Please check the syntax.");
        return;
      }
    }

    try {
      await updateMutation.mutateAsync({
        id: integration.id,
        input: {
          name: name.trim(),
          baseUrl: baseUrl.trim() || null,
          status,
          configuration: parsedConfig,
        },
      });

      toast.success("Updated Successfully", `Saved changes for ${name}`);
      onSaved();
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Unable to update configuration.";
      setFormError(msg);
    }
  }

  if (isEditing) {
    return (
      <form className="space-y-4" onSubmit={handleSaveEdit}>
        {formError ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            <p className="text-xs">{formError}</p>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="edit-name">
              Integration Name
            </Label>
            <Input
              id="edit-name"
              onChange={(e) => setName(e.target.value)}
              required
              value={name}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="edit-status">
              Operational Status
            </Label>
            <Select
              id="edit-status"
              onChange={(e) =>
                setStatus(e.target.value as IntegrationStatus)
              }
              value={status}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="error">Connection Error</option>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="edit-url">
            Base URL
          </Label>
          <Input
            id="edit-url"
            onChange={(e) => setBaseUrl(e.target.value)}
            required
            type="url"
            value={baseUrl}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="edit-config">
            JSON Configuration
          </Label>
          <Textarea
            className="font-mono text-xs"
            id="edit-config"
            onChange={(e) => setConfigJson(e.target.value)}
            rows={6}
            value={configJson}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button
            className="min-h-9 px-3 text-xs bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
            onClick={onCancelEdit}
            type="button"
          >
            Cancel
          </Button>
          <Button
            className="min-h-9 px-3 text-xs"
            disabled={updateMutation.isPending || !name.trim()}
            type="submit"
          >
            <Save className="mr-1.5 size-3.5" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="border-border space-y-3 rounded-lg border p-4 text-xs">
        <h3 className="font-semibold text-foreground text-sm">
          Identity Information
        </h3>
        <div className="flex justify-between py-1 border-b border-border/50">
          <span className="text-muted">Integration ID (UUID):</span>
          <span className="font-mono">{integration.id}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-border/50">
          <span className="text-muted">System Type:</span>
          <span className="font-medium uppercase">
            {integration.integrationType}
          </span>
        </div>
        <div className="flex justify-between py-1 border-b border-border/50">
          <span className="text-muted">Last Connected:</span>
          <span>
            {integration.lastConnectedAt
              ? new Date(integration.lastConnectedAt).toLocaleString(
                  "en-US",
                )
              : "Never connected"}
          </span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-muted">Created Date:</span>
          <span>
            {integration.createdAt
              ? new Date(integration.createdAt).toLocaleString(
                  "en-US",
                )
              : "—"}
          </span>
        </div>
      </div>

      <div className="border-border space-y-3 rounded-lg border p-4 text-xs">
        <h3 className="font-semibold text-foreground text-sm">
          Connection Configuration
        </h3>
        <div className="space-y-1">
          <span className="text-muted block">Base URL:</span>
          <p className="font-mono bg-neutral-soft/60 p-2 rounded border border-border text-foreground font-semibold break-all">
            {integration.baseUrl || "(No URL configured)"}
          </p>
        </div>
        <div className="space-y-1 pt-1">
          <span className="text-muted block">JSON Configuration:</span>
          <pre className="font-mono bg-neutral-soft/60 p-2 rounded border border-border text-[11px] overflow-x-auto max-h-32">
            {JSON.stringify(integration.configuration ?? {}, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export function IntegrationDetailDrawer({
  integrationId,
  open,
  onOpenChange,
}: {
  integrationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const integrationQuery = useIntegration(integrationId ?? "");

  const [activeTab, setActiveTab] = useState<DetailTab>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  const integration: Integration | undefined = integrationQuery.data;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!integrationId) return null;

  return (
    <>
      <dialog
        aria-labelledby="integration-detail-title"
        className="border-border bg-surface text-foreground m-auto max-h-[calc(100dvh-2rem)] w-[min(54rem,calc(100%-2rem))] overflow-y-auto rounded-xl border p-0 backdrop:bg-[#07110f]/55"
        onCancel={(e) => {
          e.preventDefault();
          onOpenChange(false);
        }}
        ref={dialogRef}
      >
        {/* Header Banner */}
        <div className="border-border bg-surface border-b p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="text-brand">
                  {integration?.integrationType === "siem" && (
                    <Shield className="size-5" />
                  )}
                  {integration?.integrationType === "firewall" && (
                    <Flame className="size-5" />
                  )}
                  {integration?.integrationType !== "siem" &&
                    integration?.integrationType !== "firewall" && (
                      <Server className="size-5" />
                    )}
                </div>
                <h2 id="integration-detail-title" className="text-lg font-bold tracking-tight">
                  {integration?.name ?? "Integration Details"}
                </h2>
                {integration ? (
                  <>
                    <IntegrationTypeBadge type={integration.integrationType} />
                    <IntegrationStatusBadge status={integration.status} />
                  </>
                ) : null}
              </div>

              <p className="text-muted font-mono text-xs">
                {integration?.baseUrl || "No Base URL configured"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                className="min-h-8 px-2.5 text-xs bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
                onClick={() => setTestDialogOpen(true)}
                type="button"
              >
                <Wifi className="mr-1.5 size-3.5" />
                Test Connection
              </Button>
              <Button
                className={`min-h-8 px-2.5 text-xs ring-1 ${
                  isEditing
                    ? "bg-neutral-soft text-foreground ring-border"
                    : "bg-surface text-foreground ring-border hover:bg-neutral-soft"
                }`}
                onClick={() => setIsEditing(!isEditing)}
                type="button"
              >
                <Edit2 className="mr-1.5 size-3.5" />
                {isEditing ? "Cancel Edit" : "Edit"}
              </Button>
              <button
                aria-label="Close"
                className="text-muted hover:text-foreground p-1"
                onClick={() => onOpenChange(false)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-border mt-5 flex gap-2 border-t pt-3">
            <button
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "overview"
                  ? "bg-brand-soft text-brand"
                  : "text-muted hover:bg-neutral-soft hover:text-foreground"
              }`}
              onClick={() => setActiveTab("overview")}
              type="button"
            >
              <Globe className="size-3.5" />
              Overview & Config
            </button>
            <button
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "schedules"
                  ? "bg-brand-soft text-brand"
                  : "text-muted hover:bg-neutral-soft hover:text-foreground"
              }`}
              onClick={() => setActiveTab("schedules")}
              type="button"
            >
              <Clock className="size-3.5" />
              Sync Schedules
            </button>
            <button
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "jobs"
                  ? "bg-brand-soft text-brand"
                  : "text-muted hover:bg-neutral-soft hover:text-foreground"
              }`}
              onClick={() => setActiveTab("jobs")}
              type="button"
            >
              <RefreshCw className="size-3.5" />
              Sync History
            </button>
            <button
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === "logs"
                  ? "bg-brand-soft text-brand"
                  : "text-muted hover:bg-neutral-soft hover:text-foreground"
              }`}
              onClick={() => setActiveTab("logs")}
              type="button"
            >
              <ListOrdered className="size-3.5" />
              Audit Logs
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {activeTab === "overview" && integration && (
            <IntegrationOverviewTab
              integration={integration}
              isEditing={isEditing}
              key={`${integration.id}-${integration.updatedAt}`}
              onCancelEdit={() => setIsEditing(false)}
              onSaved={() => setIsEditing(false)}
            />
          )}

          {activeTab === "schedules" && integration && (
            <SyncSchedulesTab integrationId={integration.id} />
          )}

          {activeTab === "jobs" && integration && (
            <SyncJobsTab integrationId={integration.id} />
          )}

          {activeTab === "logs" && integration && (
            <IntegrationLogsTab integrationId={integration.id} />
          )}
        </div>
      </dialog>

      {integration && (
        <TestConnectionDialog
          integration={integration}
          onOpenChange={setTestDialogOpen}
          open={testDialogOpen}
        />
      )}
    </>
  );
}
