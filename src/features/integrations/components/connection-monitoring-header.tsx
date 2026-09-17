"use client";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Radio,
  RefreshCw,
  Server,
  Wifi,
} from "lucide-react";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import type { ConnectionStatusSummary } from "../schemas/integration-schema";
import { useCheckAllConnections } from "../hooks/use-integrations";

export function ConnectionMonitoringHeader({
  summary,
  isLoading,
  autoRefreshInterval,
  onAutoRefreshChange,
  onRefresh,
}: {
  summary?: ConnectionStatusSummary | undefined;
  isLoading: boolean;
  autoRefreshInterval: number | false;
  onAutoRefreshChange: (interval: number | false) => void;
  onRefresh: () => void;
}) {
  const toast = useToast();
  const checkAllMutation = useCheckAllConnections();

  async function handleCheckAll() {
    try {
      const result = await checkAllMutation.mutateAsync({ timeoutMs: 5000 });
      if (result.failed === 0) {
        toast.success(
          "Connection Checks Complete",
          `All ${result.totalTested} integrated endpoints responded successfully.`,
        );
      } else {
        toast.warning(
          "Connection Issues Detected",
          `Tested ${result.totalTested} endpoints: ${result.successful} responsive, ${result.failed} with errors.`,
        );
      }
    } catch {
      toast.error(
        "Batch Check Error",
        "Could not complete batch connection probe across all systems.",
      );
    }
  }

  const total = summary?.totalIntegrations ?? 0;
  const active = summary?.activeCount ?? 0;
  const error = summary?.errorCount ?? 0;
  const availability = summary?.availability24h;
  const avgLatency = summary?.averageLatency24h;

  return (
    <div className="space-y-4">
      {/* Live Status Action Bar */}
      <div className="border-border bg-surface flex flex-col gap-3 rounded-xl border p-3.5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="border-border bg-brand-soft text-brand flex size-8 items-center justify-center rounded-lg border">
            <Radio className="size-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-foreground text-xs font-semibold">
              Live Connection Status & Health
            </h2>
            <p className="text-muted text-[11px]">
              Monitor real-time latency, availability, and connectivity diagnostics for external SIEM & Next-Gen Firewall endpoints
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Refresh Interval */}
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <Clock className="size-3.5" />
            <span>Auto-refresh:</span>
            <Select
              aria-label="Auto-refresh interval"
              className="h-8 w-28 text-[11px]"
              onChange={(e) => {
                const val = e.target.value;
                onAutoRefreshChange(val === "0" ? false : Number(val) * 1000);
              }}
              value={autoRefreshInterval ? String(autoRefreshInterval / 1000) : "0"}
            >
              <option value="0">Off</option>
              <option value="15">15 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">60 seconds</option>
            </Select>
          </div>

          {/* Refresh Manual Button */}
          <Button
            aria-label="Refresh status"
            className="min-h-8 px-2.5 text-xs bg-surface text-muted ring-border hover:text-foreground hover:bg-neutral-soft ring-1"
            disabled={isLoading}
            onClick={onRefresh}
            type="button"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin text-brand" : ""}`} />
          </Button>

          {/* Batch Check All Button */}
          <Button
            className="bg-brand text-brand-contrast hover:bg-brand-strong min-h-8 px-3 text-xs font-medium shadow-xs"
            disabled={checkAllMutation.isPending || isLoading}
            onClick={handleCheckAll}
            type="button"
          >
            <Wifi className={`mr-1.5 size-3.5 ${checkAllMutation.isPending ? "animate-pulse" : ""}`} />
            {checkAllMutation.isPending ? "Probing..." : "Ping All Endpoints"}
          </Button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="border-border bg-surface flex flex-col justify-between rounded-xl border p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-medium">Total Connections</span>
            <Server className="size-3.5 text-muted" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-foreground text-xl font-bold">{total}</span>
            <span className="text-muted text-[11px]">endpoints</span>
          </div>
        </div>

        <div className="border-border bg-surface flex flex-col justify-between rounded-xl border p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-medium">Active & Responsive</span>
            <CheckCircle2 className="size-3.5 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {active}
            </span>
            <span className="text-muted text-[11px]">live</span>
          </div>
        </div>

        <div className="border-border bg-surface flex flex-col justify-between rounded-xl border p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-medium">Connection Errors</span>
            <AlertTriangle className="size-3.5 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
              {error}
            </span>
            <span className="text-muted text-[11px]">needs attention</span>
          </div>
        </div>

        <div className="border-border bg-surface flex flex-col justify-between rounded-xl border p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-medium">Availability (24h)</span>
            <Activity className="size-3.5 text-brand" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-foreground text-xl font-bold">
              {availability !== null && availability !== undefined ? `${availability}%` : "N/A"}
            </span>
            <span className="text-muted text-[11px]">uptime</span>
          </div>
        </div>

        <div className="border-border bg-surface flex flex-col justify-between rounded-xl border p-3.5 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-medium">Avg Latency (24h)</span>
            <Wifi className="size-3.5 text-brand" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-foreground text-xl font-bold">
              {avgLatency !== null && avgLatency !== undefined ? `${avgLatency}ms` : "N/A"}
            </span>
            <span className="text-muted text-[11px]">response</span>
          </div>
        </div>
      </div>
    </div>
  );
}
