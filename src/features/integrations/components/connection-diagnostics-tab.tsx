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
        "Chưa có URL",
        "Hệ thống này chưa được cấu hình URL kết nối.",
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
          "Kiểm tra thành công",
          `Kết nối phản hồi trong ${result.latencyMs}ms (HTTP ${result.statusCode ?? 200})`,
        );
      } else {
        toast.error("Kiểm tra thất bại", result.message);
      }
      refetchTelemetry();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Lỗi kiểm tra kết nối";
      toast.error("Lỗi kiểm tra", msg);
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
                {integration.baseUrl || "Chưa cấu hình URL"}
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
            Làm mới
          </Button>
        </div>

        {/* 24h Telemetry Strip */}
        <div className="border-border/60 mt-4 grid grid-cols-2 gap-3 border-t pt-3.5 sm:grid-cols-4">
          <div>
            <span className="text-muted text-[11px]">Tính sẵn sàng (24h)</span>
            <div className="text-foreground mt-0.5 text-base font-bold">
              {availability !== null && availability !== undefined
                ? `${availability}%`
                : "N/A"}
            </div>
          </div>
          <div>
            <span className="text-muted text-[11px]">Độ trễ TB (24h)</span>
            <div className="text-foreground mt-0.5 text-base font-bold">
              {avgLatency !== null && avgLatency !== undefined
                ? `${avgLatency}ms`
                : "N/A"}
            </div>
          </div>
          <div>
            <span className="text-muted text-[11px]">Lượt kiểm tra (24h)</span>
            <div className="text-foreground mt-0.5 text-base font-bold">
              {checks24h} <span className="text-muted text-xs font-normal">({successfulChecks} thành công / {failedChecks} lỗi)</span>
            </div>
          </div>
          <div>
            <span className="text-muted text-[11px]">Lần kết nối gần nhất</span>
            <div className="text-foreground mt-0.5 text-xs font-medium truncate">
              {integration.lastConnectedAt
                ? new Date(integration.lastConnectedAt).toLocaleString("vi-VN")
                : "Chưa từng kết nối"}
            </div>
          </div>
        </div>
      </div>

      {/* Manual Probe & Diagnostics Card */}
      <div className="border-border bg-surface rounded-xl border p-4 shadow-xs">
        <h3 className="text-foreground text-xs font-semibold uppercase tracking-wider text-muted">
          Thực hiện kiểm tra kết nối trực tiếp (Manual Probe)
        </h3>
        <p className="text-muted text-xs mt-1">
          Gửi yêu cầu HTTP GET an toàn kèm xác thực chống SSRF đến endpoint và đo lường độ trễ phản hồi tức thì.
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleManualProbe}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label className="text-xs" htmlFor="probe-url">
                Endpoint URL đích
              </Label>
              <div className="relative">
                <Globe className="text-muted absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
                <Input
                  className="pl-8 font-mono text-xs bg-neutral-soft/30"
                  disabled
                  id="probe-url"
                  value={integration.baseUrl || "Chưa có URL"}
                />
              </div>
            </div>

            <div className="w-full sm:w-36 space-y-1">
              <Label className="text-xs" htmlFor="probe-timeout">
                Thời gian chờ (Timeout)
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
              {testMutation.isPending ? "Đang gửi probe..." : "Kiểm tra ngay"}
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
                        ? "Kết nối thành công (Healthy)"
                        : "Kết nối thất bại (Error)"}
                    </span>
                    <span className="font-mono text-[11px] opacity-80">
                      {lastProbeResult.testedAt.toLocaleTimeString("vi-VN")}
                    </span>
                  </div>
                  <p className="mt-1">{lastProbeResult.message}</p>
                  <div className="mt-2 flex flex-wrap gap-3 font-mono text-[11px]">
                    <span>
                      Mã trạng thái HTTP:{" "}
                      <strong>
                        {lastProbeResult.statusCode !== null
                          ? lastProbeResult.statusCode
                          : "Không có phản hồi"}
                      </strong>
                    </span>
                    <span>
                      Độ trễ: <strong>{lastProbeResult.latencyMs}ms</strong>
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
            <span>Chẩn đoán nguyên nhân lỗi kết nối</span>
          </div>
          <p className="text-muted mt-1.5 leading-relaxed">
            Hệ thống đang không thể thiết lập kết nối đến endpoint. Các nguyên nhân phổ biến có thể gồm:
          </p>
          <ul className="mt-2 list-disc list-inside space-y-1 text-muted">
            <li>Máy chủ đích đang ngoại tuyến, bảo trì hoặc gặp lỗi nội bộ (HTTP 502/503).</li>
            <li>Tường lửa hoặc chính sách mạng nội bộ chặn kết nối IP/Port ra bên ngoài.</li>
            <li>Chứng chỉ bảo mật SSL/TLS của endpoint bị hết hạn hoặc không hợp lệ.</li>
            <li>Địa chỉ URL endpoint bị thay đổi hoặc không thể phân giải tên miền (DNS Failure).</li>
          </ul>
        </div>
      )}

      {/* Connection Check Logs Timeline */}
      <div className="border-border bg-surface rounded-xl border p-4 shadow-xs">
        <h3 className="text-foreground text-xs font-semibold uppercase tracking-wider text-muted">
          Lịch sử kiểm tra kết nối gần đây
        </h3>

        {isTelemetryLoading ? (
          <div className="mt-3 space-y-2">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton className="h-10 w-full rounded-lg" key={idx} />
            ))}
          </div>
        ) : recentLogs.length === 0 ? (
          <p className="text-muted text-xs mt-3 italic">
            Chưa có nhật ký kiểm tra kết nối nào được ghi nhận.
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
                          {new Date(log.createdAt).toLocaleString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            day: "2-digit",
                            month: "2-digit",
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
                    {isSuccess ? "Thành công" : "Thất bại"}
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
