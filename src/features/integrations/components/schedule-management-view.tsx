"use client";

import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock,
  PauseCircle,
  Play,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useIntegrations,
  useSyncSchedules,
  useTriggerSync,
} from "../hooks/use-integrations";
import type { Integration } from "../schemas/integration-schema";
import { IntegrationStatusBadge } from "./integration-status-badge";
import { SyncSchedulesTab } from "./sync-schedules-tab";

// ── Metric strip ──────────────────────────────────────────────────────────────

function MetricStrip({
  integrations,
}: {
  integrations: readonly Integration[];
}) {
  const active = integrations.filter((i) => i.status === "active").length;
  const error = integrations.filter((i) => i.status === "error").length;
  const total = integrations.length;

  const metrics = [
    {
      label: "Total Integrations",
      value: total,
      icon: Wifi,
      color: "text-brand",
      bg: "bg-brand/8",
    },
    {
      label: "Active",
      value: active,
      icon: CheckCircle2,
      color: "text-success",
      bg: "bg-success/8",
    },
    {
      label: "Paused / Inactive",
      value: total - active - error,
      icon: PauseCircle,
      color: "text-muted",
      bg: "bg-neutral-soft",
    },
    {
      label: "Error",
      value: error,
      icon: WifiOff,
      color: "text-danger",
      bg: "bg-danger/8",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {metrics.map((m) => {
        const Icon = m.icon;
        return (
          <div
            className="border-border bg-surface flex items-center gap-3 rounded-xl border p-4"
            key={m.label}
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-lg",
                m.bg,
              )}
            >
              <Icon className={cn("size-4", m.color)} />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-bold leading-none">{m.value}</p>
              <p className="text-muted mt-0.5 truncate text-[11px]">
                {m.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Integration row in the sidebar list ───────────────────────────────────────

function IntegrationRow({
  integration,
  selected,
  onClick,
}: {
  integration: Integration;
  selected: boolean;
  onClick: () => void;
}) {
  const schedulesQuery = useSyncSchedules(integration.id);
  const schedules = schedulesQuery.data ?? [];
  const activeCount = schedules.filter((s) => s.isActive).length;

  return (
    <button
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
        selected
          ? "bg-brand/10 ring-brand/30 ring-1"
          : "hover:bg-neutral-soft",
      )}
      onClick={onClick}
      type="button"
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg",
          integration.status === "active"
            ? "bg-success/10 text-success"
            : integration.status === "error"
              ? "bg-danger/10 text-danger"
              : "bg-neutral-soft text-muted",
        )}
      >
        <Wifi className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium",
            selected && "text-brand",
          )}
        >
          {integration.name}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <IntegrationStatusBadge status={integration.status} />
          {schedulesQuery.isLoading ? (
            <span className="text-muted text-[10px]">Loading…</span>
          ) : (
            <span className="text-muted flex items-center gap-1 text-[10px]">
              <CalendarClock className="size-3" />
              {activeCount} active schedule{activeCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <ChevronRight
        className={cn(
          "size-3.5 shrink-0 text-muted transition-transform",
          selected && "text-brand rotate-90",
        )}
      />
    </button>
  );
}

// ── Right panel: schedule panel for selected integration ──────────────────────

function SchedulePanel({ integration }: { integration: Integration }) {
  const toast = useToast();
  const triggerSync = useTriggerSync();

  async function handleRunNow() {
    try {
      await triggerSync.mutateAsync({ id: integration.id });
      toast.success(
        "Sync Triggered",
        `Manual sync started for ${integration.name}.`,
      );
    } catch {
      toast.error("Sync Failed", "Unable to trigger manual sync.");
    }
  }

  return (
    <div className="flex min-h-0 flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{integration.name}</h2>
          <div className="mt-1 flex items-center gap-2">
            <IntegrationStatusBadge status={integration.status} />
            {integration.baseUrl ? (
              <span className="text-muted font-mono text-[11px]">
                {integration.baseUrl}
              </span>
            ) : null}
          </div>
        </div>

        <Button
          className="min-h-9 gap-1.5 px-3 text-xs"
          disabled={
            triggerSync.isPending || integration.status !== "active"
          }
          onClick={handleRunNow}
          type="button"
        >
          {triggerSync.isPending ? (
            <RefreshCw className="size-3.5 animate-spin" />
          ) : (
            <Play className="size-3.5" />
          )}
          {triggerSync.isPending ? "Running…" : "Run Now"}
        </Button>
      </div>

      {/* Divider */}
      <hr className="border-border" />

      {/* Schedule management — reuse existing SyncSchedulesTab */}
      <SyncSchedulesTab integrationId={integration.id} />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptySelection() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <span className="bg-brand/8 grid size-14 place-items-center rounded-2xl">
        <CalendarClock className="text-brand size-7" />
      </span>
      <div>
        <p className="font-medium">Select an Integration</p>
        <p className="text-muted mt-1 text-sm">
          Choose an integration from the list to manage its sync schedules.
        </p>
      </div>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function ScheduleManagementView() {
  const integrationsQuery = useIntegrations({ limit: 100 });
  const integrations = integrationsQuery.data?.items ?? [];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedIntegration =
    integrations.find((i) => i.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <span className="bg-brand/10 grid size-10 place-items-center rounded-xl">
          <Activity className="text-brand size-5" />
        </span>
        <div>
          <h1 className="text-lg font-semibold">
            Automatic Log Synchronization
          </h1>
          <p className="text-muted text-sm">
            Manage scheduled log synchronization for all connected integrations.
          </p>
        </div>
      </div>

      {/* Metric strip */}
      {integrationsQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton className="h-[72px] rounded-xl" key={i} />
          ))}
        </div>
      ) : (
        <MetricStrip integrations={integrations} />
      )}

      {/* Main 2-column layout */}
      <div className="border-border grid gap-4 rounded-xl border lg:grid-cols-[280px_1fr]">
        {/* Left: integration list */}
        <div className="border-border flex flex-col gap-1 border-b p-3 lg:border-b-0 lg:border-r">
          <p className="text-muted mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider">
            Integrations
          </p>

          {integrationsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton className="h-14 rounded-lg" key={i} />
              ))}
            </div>
          ) : integrations.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted">
              No integrations configured.
            </div>
          ) : (
            integrations.map((integration) => (
              <IntegrationRow
                integration={integration}
                key={integration.id}
                onClick={() =>
                  setSelectedId((prev) =>
                    prev === integration.id ? null : integration.id,
                  )
                }
                selected={selectedId === integration.id}
              />
            ))
          )}
        </div>

        {/* Right: schedule panel */}
        <div className="min-w-0 p-5">
          {selectedIntegration ? (
            <SchedulePanel integration={selectedIntegration} />
          ) : (
            <EmptySelection />
          )}
        </div>
      </div>

      {/* Bottom info bar */}
      <div className="border-border bg-neutral-soft/50 flex items-center gap-2 rounded-lg border px-4 py-2.5">
        <Clock className="text-muted size-3.5 shrink-0" />
        <p className="text-muted text-xs">
          Schedules run automatically in UTC. Use cron expressions (5 fields) or
          aliases like{" "}
          <span className="font-mono font-medium">@hourly</span>,{" "}
          <span className="font-mono font-medium">@daily</span>. Click{" "}
          <strong>Run Now</strong> to trigger an immediate sync for any active
          integration.
        </p>
      </div>
    </div>
  );
}
