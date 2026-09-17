"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Globe,
  Radio,
  RefreshCw,
  ShieldAlert,
  Wifi,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useIntegrationConnectionStatus,
  useTestConnection,
} from "../hooks/use-integrations";
import type { Integration } from "../schemas/integration-schema";
import { IntegrationStatusBadge } from "./integration-status-badge";

export function ConnectionDiagnosticsTab({
  integration,
}: {
  integration: Integration;
}) {
  const toast = useToast();
  const [timeoutSec, setTimeoutSec] = useState(5);
  const [lastProbeResult, setLastProbeResult] = useState<{
    connected: boolean;
    statusCode: number | null;
    latencyMs: number;
    message: string;
    testedAt: Date;
  } | null>(null);

  const testMutation = useTestConnection();

  const {
    data: telemetry,
    isLoading: isTelemetryLoading,
    refetch: refetchTelemetry,
    isFetching: isTelemetryFetching,
  } = useIntegrationConnectionStatus(integration.id, {
    timeWindow: "24h",
  });

  async function handleManualProbe(e: React.FormEvent) {
    e.preventDefault();
    if (!integration.baseUrl) {
      toast.warning(
        "No URL Configured",
        "This integration does not have a connection URL configured.",
      );
      return;
    }

    try {
      const result = await testMutation.mutateAsync({
        id: integration.id,
        timeoutMs: timeoutSec * 1000,
      });

      setLastProbeResult({
        connected: result.connected,
        statusCode: result.statusCode ?? null,
        latencyMs: result.latencyMs,
        message: result.message,
        testedAt: new Date(),
      });

      if (result.connected) {
        toast.success(
          "Probe Successful",
          `Connection responded in ${result.latencyMs}ms (HTTP ${result.statusCode ?? 200})`,
        );
      } else {
        toast.error("Probe Failed", result.message);
      }
      refetchTelemetry();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection check error";
      toast.error("Probe Error", msg);
    }
  }

  const availability = telemetry?.availability24h;
  const avgLatency = telemetry?.averageLatency24h;
  const checks24h = telemetry?.checks24h ?? 0;
  const successfulChecks = telemetry?.successfulChecks24h ?? 0;
  const failedChecks = telemetry?.failedChecks24h ?? 0;
  const recentLogs = telemetry?.recentLogs ?? [];

  return (
    <div className="space-y-5">
      {/* Real-time Status Card */}
      <div className="border-border bg-surface rounded-xl border p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="border-border bg-brand-soft text-brand flex size-10 shrink-0 items-center justify-center rounded-lg border">
              <Radio className="size-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm">
                  {integration.name}
                </span>
                <IntegrationStatusBadge status={integration.status} />
              </div>
              <p className="font-mono text-muted text-xs mt-0.5">
                {integration.baseUrl || "No Base URL configured"}
              </p>
            </div>
          </div>

          <Button
            className="min-h-8 px-2.5 text-xs bg-surface text-muted ring-border hover:text-foreground hover:bg-neutral-soft ring-1"
            disabled={isTelemetryFetching}
            onClick={() => refetchTelemetry()}
            type="button"
          >
            <RefreshCw
              className={`size-3.5 mr-1 ${isTelemetryFetching ? "animate-spin text-brand" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* 24h Telemetry Strip */}
        <div className="border-border/60 mt-4 grid grid-cols-2 gap-3 border-t pt-3.5 sm:grid-cols-4">
          <div>
            <span className="text-muted text-[11px]">Availability (24h)</span>
            <div className="text-foreground mt-0.5 text-base font-bold">
              {availability !== null && availability !== undefined
                ? `${availability}%`
                : "N/A"}
            </div>
          </div>
          <div>
            <span className="text-muted text-[11px]">Avg Latency (24h)</span>
            <div className="text-foreground mt-0.5 text-base font-bold">
              {avgLatency !== null && avgLatency !== undefined
                ? `${avgLatency}ms`
                : "N/A"}
            </div>
          </div>
          <div>
            <span className="text-muted text-[11px]">Probe Checks (24h)</span>
            <div className="text-foreground mt-0.5 text-base font-bold">
              {checks24h} <span className="text-muted text-xs font-normal">({successfulChecks} ok / {failedChecks} err)</span>
            </div>
          </div>
          <div>
            <span className="text-muted text-[11px]">Last Connected</span>
            <div className="text-foreground mt-0.5 text-xs font-medium truncate">
              {integration.lastConnectedAt
                ? new Date(integration.lastConnectedAt).toLocaleString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Never connected"}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Probe & Diagnostics Card */}
      <div className="border-border bg-surface rounded-xl border p-4 shadow-xs">
        <h3 className="text-foreground text-xs font-semibold uppercase tracking-wider text-muted">
          Active Manual Connection Probe
        </h3>
        <p className="text-muted text-xs mt-1">
          Send an authenticated HTTP request with SSRF guard to test live endpoint availability and measure real-time latency.
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleManualProbe}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs" htmlFor="probe-url">
                Target Endpoint URL
              </Label>
              <div className="relative">
                <Globe className="text-muted absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
                <Input
                  className="pl-8 font-mono text-xs bg-neutral-soft/30"
                  disabled
                  id="probe-url"
                  value={integration.baseUrl || "No URL configured"}
                />
              </div>
            </div>

            <div className="w-full sm:w-36 space-y-1">
              <Label className="text-xs" htmlFor="probe-timeout">
                Timeout (Seconds)
              </Label>
              <Input
                className="text-xs"
                id="probe-timeout"
                max={10}
                min={1}
                onChange={(e) => setTimeoutSec(Number(e.target.value))}
                type="number"
                value={timeoutSec}
              />
            </div>

            <Button
              className="bg-brand text-brand-contrast hover:bg-brand-strong min-h-9 px-4 text-xs font-medium"
              disabled={testMutation.isPending || !integration.baseUrl}
              type="submit"
            >
              <Wifi
                className={`mr-1.5 size-3.5 ${testMutation.isPending ? "animate-pulse" : ""}`}
              />
              {testMutation.isPending ? "Probing..." : "Test Connection Now"}
            </Button>
          </div>
        </form>

        {/* Live Probe Feedback Banner */}
        {lastProbeResult && (
          <div className="mt-4">
            <Alert
              className={`p-3.5 ${
                lastProbeResult.connected
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  : "border-rose-500/25 bg-rose-500/10 text-rose-800 dark:text-rose-300"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {lastProbeResult.connected ? (
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                ) : (
                  <XCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                )}
                <div className="flex-1 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold">
                      {lastProbeResult.connected
                        ? "Connection Healthy (Success)"
                        : "Connection Error (Failed)"}
                    </span>
                    <span className="font-mono text-[11px] opacity-80">
                      {lastProbeResult.testedAt.toLocaleTimeString("en-US")}
                    </span>
                  </div>
                  <p className="mt-1">{lastProbeResult.message}</p>
                  <div className="mt-2 flex flex-wrap gap-3 font-mono text-[11px]">
                    <span>
                      HTTP Status:{" "}
                      <strong>
                        {lastProbeResult.statusCode !== null
                          ? lastProbeResult.statusCode
                          : "No Response"}
                      </strong>
                    </span>
                    <span>
                      Latency: <strong>{lastProbeResult.latencyMs}ms</strong>
                    </span>
                  </div>
                </div>
              </div>
            </Alert>
          </div>
        )}
      </div>

      {/* Failure Diagnostic Advice Panel (if in error status) */}
      {integration.status === "error" && (
        <div className="border-rose-500/20 bg-rose-500/5 rounded-xl border p-4 text-xs">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold">
            <ShieldAlert className="size-4" />
            <span>Connection Error Diagnostics</span>
          </div>
          <p className="text-muted mt-1.5 leading-relaxed">
            The system could not establish a connection to this endpoint. Common root causes include:
          </p>
          <ul className="mt-2 list-disc list-inside space-y-1 text-muted">
            <li>Target host is offline, under maintenance, or returning internal server errors (HTTP 502/503).</li>
            <li>Network firewall or internal security group is blocking outbound traffic to this IP/Port.</li>
            <li>SSL/TLS certificate of the endpoint has expired, is untrusted, or has a domain mismatch.</li>
            <li>Target URL changed, host is unreachable, or DNS resolution failure.</li>
          </ul>
        </div>
      )}

      {/* Connection Check Logs Timeline */}
      <div className="border-border bg-surface rounded-xl border p-4 shadow-xs">
        <h3 className="text-foreground text-xs font-semibold uppercase tracking-wider text-muted">
          Recent Connection Probe History
        </h3>

        {isTelemetryLoading ? (
          <div className="mt-3 space-y-2">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton className="h-10 w-full rounded-lg" key={idx} />
            ))}
          </div>
        ) : recentLogs.length === 0 ? (
          <p className="text-muted text-xs mt-3 italic">
            No connection probe history recorded yet.
          </p>
        ) : (
          <div className="mt-3 divide-border divide-y text-xs">
            {recentLogs.map((log) => {
              const isSuccess = log.success ?? log.level === "info";
              return (
                <div
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  key={log.id}
                >
                  <div className="flex items-center gap-2.5">
                    {isSuccess ? (
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="size-4 text-rose-500 shrink-0" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{log.message}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                        <Clock className="size-3" />
                        <span>
                          {new Date(log.createdAt).toLocaleString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        {log.latencyMs !== null && log.latencyMs !== undefined && (
                          <span>· {log.latencyMs}ms</span>
                        )}
                        {log.httpStatus !== null && log.httpStatus !== undefined && (
                          <span>· HTTP {log.httpStatus}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      isSuccess
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {isSuccess ? "Success" : "Failed"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
