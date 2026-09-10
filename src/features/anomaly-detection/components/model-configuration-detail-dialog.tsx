"use client";

import { useEffect, useRef } from "react";
import { StatusBadge } from "@/components/data-display/static-product";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { ModelConfiguration } from "../schemas/model-configuration-schema";

export function ModelConfigurationDetailDialog({
  configuration,
  onClose,
}: {
  configuration: ModelConfiguration | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (configuration && !dialog.open) dialog.showModal();
    if (!configuration && dialog.open) dialog.close();
  }, [configuration]);

  return (
    <Dialog
      className="max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100%-2rem))] overflow-y-auto"
      dialogRef={dialogRef}
      onClose={onClose}
      title="Configuration details"
    >
      {configuration ? (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold">
                {configuration.modelName} {configuration.version}
              </h3>
              <p className="text-muted mt-1 text-sm [overflow-wrap:anywhere]">
                {configuration.id}
              </p>
            </div>
            <StatusBadge tone={configuration.active ? "success" : "neutral"}>
              {configuration.active ? "Active" : "Inactive"}
            </StatusBadge>
          </div>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Algorithm" value={configuration.algorithm} />
            <Detail label="Provider" value={configuration.provider} />
            <Detail
              label="Runtime model"
              value={configuration.parameters.ollamaModel}
            />
            <Detail
              label="Model URL"
              value={configuration.modelPath ?? "Not configured"}
            />
            <Detail
              label="Detection rules"
              value={String(configuration.parameters.rules.length)}
            />
            <Detail
              label="Created"
              value={formatDate(configuration.createdAt)}
            />
          </dl>
          <section
            aria-labelledby="configured-rules-heading"
            className="space-y-3"
          >
            <div>
              <h3 className="font-semibold" id="configured-rules-heading">
                Detection rules
              </h3>
              <p className="text-muted mt-1 text-sm">
                Read-only rules preserved with this configuration version.
              </p>
            </div>
            {configuration.parameters.rules.length === 0 ? (
              <p className="border-border text-muted rounded-xl border p-4 text-sm">
                This configuration has no detection rules.
              </p>
            ) : (
              <div className="space-y-3">
                {configuration.parameters.rules.map((rule) => (
                  <article
                    className="border-border rounded-xl border p-4"
                    key={rule.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-semibold">{rule.name}</h4>
                        <p className="text-muted mt-1 text-xs [overflow-wrap:anywhere]">
                          {rule.id} · {rule.eventType}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge
                          tone={rule.enabled ? "success" : "neutral"}
                        >
                          {rule.enabled ? "Enabled" : "Disabled"}
                        </StatusBadge>
                        <StatusBadge tone={severityTone(rule.severity)}>
                          {rule.severity}
                        </StatusBadge>
                      </div>
                    </div>
                    <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                      <Detail
                        label="Threshold"
                        value={String(rule.threshold)}
                      />
                      <Detail
                        label="Time window"
                        value={`${rule.windowSeconds} seconds`}
                      />
                      <Detail
                        label="Group by"
                        value={
                          rule.groupBy === "sourceIp"
                            ? "Source IP"
                            : "Log source"
                        }
                      />
                    </dl>
                  </article>
                ))}
              </div>
            )}
          </section>
          <div className="flex justify-end">
            <Button
              onClick={() => dialogRef.current?.close()}
              variant="secondary"
            >
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium [overflow-wrap:anywhere]">
        {value}
      </dd>
    </div>
  );
}
function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
function severityTone(
  severity: ModelConfiguration["parameters"]["rules"][number]["severity"],
) {
  if (severity === "critical") return "danger" as const;
  if (severity === "high" || severity === "medium") return "warning" as const;
  return "info" as const;
}
