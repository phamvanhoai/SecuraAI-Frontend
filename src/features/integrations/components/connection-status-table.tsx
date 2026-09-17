"use client";

import {
  ArrowUpRight,
  Clock,
  Flame,
  Globe,
  Server,
  Shield,
  Wifi,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { useTestConnection } from "../hooks/use-integrations";
import type { Integration } from "../schemas/integration-schema";
import {
  IntegrationStatusBadge,
  IntegrationTypeBadge,
} from "./integration-status-badge";

function LatencyPill({ latencyMs, status }: { latencyMs?: number | null | undefined; status: string }) {
  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-rose-600 dark:text-rose-400">
        <span className="size-1.5 rounded-full bg-rose-500" />
        Offline
      </span>
    );
  }

  if (status === "inactive" || !latencyMs) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-muted">
        <span className="size-1.5 rounded-full bg-muted" />
        Chưa đo
      </span>
    );
  }

  if (latencyMs < 100) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        {latencyMs}ms (Nhanh)
      </span>
    );
  }

  if (latencyMs <= 500) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-amber-600 dark:text-amber-400">
        <span className="size-1.5 rounded-full bg-amber-500" />
        {latencyMs}ms (Bình thường)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-orange-600 dark:text-orange-400">
      <span className="size-1.5 rounded-full bg-orange-500" />
      {latencyMs}ms (Chậm)
    </span>
  );
}

export function ConnectionStatusTable({
  integrations,
  onOpenDetails,
}: {
  integrations: Integration[];
  onOpenDetails: (id: string) => void;
}) {
  const toast = useToast();
  const testMutation = useTestConnection();
  const [testingId, setTestingId] = useState<string | null>(null);

  async function handleSingleTest(integration: Integration) {
    if (!integration.baseUrl) {
      toast.warning(
        "Chưa có URL",
        `Hệ thống "${integration.name}" chưa được cấu hình URL kết nối.`,
      );
      onOpenDetails(integration.id);
      return;
    }

    setTestingId(integration.id);
    try {
      const result = await testMutation.mutateAsync({
        id: integration.id,
        timeoutMs: 5000,
      });

      if (result.connected) {
        toast.success(
          "Kết nối thành công",
          `${integration.name}: Phản hồi trong ${result.latencyMs}ms.`,
        );
      } else {
        toast.error("Kết nối thất bại", result.message);
      }
    } catch {
      toast.error(
        "Lỗi kiểm tra",
        "Không thể hoàn tất kiểm tra kết nối đến endpoint.",
      );
    } finally {
      setTestingId(null);
    }
  }

  return (
    <div className="border-border bg-surface overflow-hidden rounded-xl border shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-border bg-neutral-soft/50 text-muted border-b uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-3 font-semibold">Hệ thống tích hợp</th>
              <th className="px-4 py-3 font-semibold">Endpoint URL</th>
              <th className="px-4 py-3 font-semibold">Trạng thái</th>
              <th className="px-4 py-3 font-semibold">Độ trễ phản hồi</th>
              <th className="px-4 py-3 font-semibold">Lần kết nối gần nhất</th>
              <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {integrations.map((item) => {
              const isTesting = testingId === item.id;
              return (
                <tr
                  className="hover:bg-neutral-soft/30 transition-colors cursor-pointer"
                  key={item.id}
                  onClick={() => onOpenDetails(item.id)}
                >
                  {/* System & Type */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="border-border bg-neutral-soft/80 text-brand flex size-8 shrink-0 items-center justify-center rounded-lg border">
                        {item.integrationType === "siem" && <Shield className="size-4" />}
                        {item.integrationType === "firewall" && <Flame className="size-4" />}
                        {item.integrationType !== "siem" && item.integrationType !== "firewall" && (
                          <Server className="size-4" />
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-foreground hover:text-brand transition-colors">
                          {item.name}
                        </span>
                        <div className="mt-0.5">
                          <IntegrationTypeBadge type={item.integrationType} />
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* URL */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 max-w-xs truncate font-mono text-muted text-[11px]">
                      <Globe className="size-3.5 shrink-0 text-muted" />
                      <span className="truncate">{item.baseUrl || "Chưa cấu hình URL"}</span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3.5">
                    <IntegrationStatusBadge status={item.status} />
                  </td>

                  {/* Latency Pill */}
                  <td className="px-4 py-3.5">
                    <LatencyPill status={item.status} />
                  </td>

                  {/* Last Connected */}
                  <td className="px-4 py-3.5 text-muted text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 shrink-0" />
                      <span>
                        {item.lastConnectedAt
                          ? new Date(item.lastConnectedAt).toLocaleString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "Chưa từng kết nối"}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    <div
                      className="flex items-center justify-end gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        className="min-h-7 px-2.5 text-[11px] bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
                        disabled={isTesting || !item.baseUrl}
                        onClick={() => handleSingleTest(item)}
                        type="button"
                      >
                        <Wifi
                          className={`mr-1 size-3 ${isTesting ? "animate-pulse text-brand" : ""}`}
                        />
                        {isTesting ? "Đang ping..." : "Kiểm tra"}
                      </Button>

                      <Button
                        aria-label={`Xem chi tiết ${item.name}`}
                        className="min-h-7 px-2 text-[11px] bg-surface text-muted ring-border hover:text-foreground hover:bg-neutral-soft ring-1"
                        onClick={() => onOpenDetails(item.id)}
                        type="button"
                      >
                        <ArrowUpRight className="size-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
