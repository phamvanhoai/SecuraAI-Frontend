"use client";

import {
  Activity,
  Clock,
  Flame,
  Globe,
  RefreshCw,
  Server,
  Settings2,
  Shield,
  Wifi,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { useTestConnection, useTriggerSync } from "../hooks/use-integrations";
import type { Integration } from "../schemas/integration-schema";
import {
  IntegrationStatusBadge,
  IntegrationTypeBadge,
} from "./integration-status-badge";
import { TestConnectionDialog } from "./test-connection-dialog";

export function IntegrationCard({
  integration,
  onOpenDetails,
}: {
  integration: Integration;
  onOpenDetails: (id: string) => void;
}) {
  const toast = useToast();
  const testMutation = useTestConnection();
  const triggerSyncMutation = useTriggerSync();
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  async function handleQuickTest(e: React.MouseEvent) {
    e.stopPropagation();
    if (!integration.baseUrl) {
      setTestDialogOpen(true);
      return;
    }
    try {
      const result = await testMutation.mutateAsync({
        id: integration.id,
        timeoutMs: 5000,
      });
      if (result.connected) {
        toast.success(
          "Connection Successful",
          `${integration.name}: Responded in ${result.latencyMs}ms`,
        );
      } else {
        toast.error("Connection Test Failed", result.message);
      }
    } catch {
      setTestDialogOpen(true);
    }
  }

  async function handleQuickSync(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const job = await triggerSyncMutation.mutateAsync({
        id: integration.id,
      });
      toast.success(
        "Sync Completed",
        `${integration.name}: Processed ${job.recordsProcessed} records.`,
      );
    } catch {
      toast.error(
        "Sync Failed",
        "Could not complete the data synchronization task.",
      );
    }
  }

  return (
    <>
      <div className="border-border bg-surface hover:border-brand/40 group flex flex-col justify-between rounded-xl border p-5 transition-all shadow-xs">
        <div className="space-y-3.5">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="border-border bg-neutral-soft/80 text-brand flex size-10 shrink-0 items-center justify-center rounded-lg border">
                {integration.integrationType === "siem" && (
                  <Shield className="size-5" />
                )}
                {integration.integrationType === "firewall" && (
                  <Flame className="size-5" />
                )}
                {integration.integrationType !== "siem" &&
                  integration.integrationType !== "firewall" && (
                    <Server className="size-5" />
                  )}
              </div>
              <div>
                <h3 className="font-semibold text-foreground leading-snug group-hover:text-brand transition-colors">
                  {integration.name}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <IntegrationTypeBadge type={integration.integrationType} />
                  <IntegrationStatusBadge status={integration.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Endpoint URL */}
          <div className="border-border/60 bg-neutral-soft/30 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">
            <Globe className="text-muted size-3.5 shrink-0" />
            <span className="font-mono text-muted truncate text-[11px]">
              {integration.baseUrl || "No endpoint URL configured"}
            </span>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-2 text-[11px] text-muted pt-1">
            <div className="flex items-center gap-1.5">
              <Activity className="size-3.5" />
              <span>
                {integration.lastConnectedAt
                  ? `Connected: ${new Date(integration.lastConnectedAt).toLocaleDateString("en-US")}`
                  : "Never connected"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <Clock className="size-3.5" />
              <span>
                Created: {new Date(integration.createdAt).toLocaleDateString("en-US")}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-border/60 mt-4 flex items-center justify-between border-t pt-3.5">
          <div className="flex items-center gap-1.5">
            <Button
              className="min-h-8 px-2.5 text-xs bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
              disabled={testMutation.isPending || !integration.baseUrl}
              onClick={handleQuickTest}
              type="button"
            >
              <Wifi
                className={`mr-1 size-3.5 ${testMutation.isPending ? "animate-pulse text-brand" : ""}`}
              />
              {testMutation.isPending ? "Pinging..." : "Test"}
            </Button>
            <Button
              className="min-h-8 px-2.5 text-xs bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
              disabled={triggerSyncMutation.isPending}
              onClick={handleQuickSync}
              type="button"
            >
              <RefreshCw
                className={`mr-1 size-3.5 ${triggerSyncMutation.isPending ? "animate-spin text-brand" : ""}`}
              />
              Sync
            </Button>
          </div>

          <Button
            className="min-h-8 px-2.5 text-xs bg-neutral-soft text-foreground hover:bg-neutral-soft/80"
            onClick={() => onOpenDetails(integration.id)}
            type="button"
          >
            <Settings2 className="mr-1 size-3.5" />
            Details & Schedules
          </Button>
        </div>
      </div>

      <TestConnectionDialog
        integration={integration}
        onOpenChange={setTestDialogOpen}
        open={testDialogOpen}
      />
    </>
  );
}
