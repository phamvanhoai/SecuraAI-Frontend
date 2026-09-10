"use client";

import { AlertCircle, AlertTriangle, ChevronDown, ChevronRight, Info } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useIntegrationLogs } from "../hooks/use-integrations";
import type { IntegrationLog } from "../schemas/integration-schema";

export function IntegrationLogsTab({
  integrationId,
}: {
  integrationId: string;
}) {
  const [level, setLevel] = useState<string>("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const logsQuery = useIntegrationLogs({
    integrationId,
    level: level || undefined,
    limit: 25,
  });

  const logs: readonly IntegrationLog[] = logsQuery.data?.items ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Audit & Diagnostic Logs</h3>
          <p className="text-muted text-xs">
            System events, connection attempts, and debug traces for this integration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            className="w-36 text-xs h-8"
            onChange={(e) => setLevel(e.target.value)}
            value={level}
          >
            <option value="">All Levels</option>
            <option value="info">INFO</option>
            <option value="warn">WARN</option>
            <option value="error">ERROR</option>
          </Select>
        </div>
      </div>

      {logsQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : logs.length === 0 ? (
        <div className="border-border rounded-lg border border-dashed p-6 text-center text-xs text-muted">
          No logs recorded for this integration yet.
        </div>
      ) : (
        <div className="divide-border border-border divide-y rounded-lg border text-xs">
          {logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const hasDetails = Boolean(log.details);

            return (
              <div className="p-3" key={log.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {log.level === "info" && (
                      <Info className="text-brand mt-0.5 size-3.5 shrink-0" />
                    )}
                    {log.level === "warn" && (
                      <AlertTriangle className="text-warning mt-0.5 size-3.5 shrink-0" />
                    )}
                    {log.level === "error" && (
                      <AlertCircle className="text-danger mt-0.5 size-3.5 shrink-0" />
                    )}

                    <div className="space-y-0.5">
                      <p className="text-foreground font-medium">{log.message}</p>
                      <p className="text-muted text-[11px]">
                        {new Date(log.createdAt).toLocaleString("en-US")}
                      </p>
                    </div>
                  </div>

                  {hasDetails ? (
                    <Button
                      className="min-h-6 px-1.5 text-[11px] bg-surface text-muted ring-border hover:bg-neutral-soft ring-1"
                      onClick={() =>
                        setExpandedLogId(isExpanded ? null : log.id)
                      }
                      type="button"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronDown className="mr-1 size-3" /> Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronRight className="mr-1 size-3" /> View Payload
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>

                {isExpanded && log.details ? (
                  <div className="mt-2.5 border-t border-border/50 pt-2">
                    <pre className="bg-neutral-soft/80 border-border rounded border p-2 font-mono text-[11px] overflow-x-auto text-foreground">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
