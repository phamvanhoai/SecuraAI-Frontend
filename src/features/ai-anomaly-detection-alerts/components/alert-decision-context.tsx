import { Radar } from "lucide-react";
import { StatusBadge } from "@/components/data-display/static-product";
import type { AiAlert } from "../schemas/ai-alert-schema";
import {
  formatScore,
  formatStatus,
  statusTone,
} from "./ai-alert-detail-dialog";

export function AlertDecisionContext({ alert }: { alert: AiAlert }) {
  return (
    <section
      aria-labelledby="alert-decision-context-heading"
      className="border-border bg-neutral-soft/30 rounded-lg border p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Radar
            aria-hidden="true"
            className="text-brand mt-0.5 size-5 shrink-0"
            strokeWidth={1.8}
          />
          <div className="min-w-0">
            <h3
              className="font-semibold [overflow-wrap:anywhere]"
              id="alert-decision-context-heading"
            >
              {alert.title}
            </h3>
            <p className="text-muted mt-1 font-mono text-xs [overflow-wrap:anywhere]">
              {alert.alertCode}
            </p>
          </div>
        </div>
        <StatusBadge tone={statusTone(alert.status)}>
          {formatStatus(alert.status)}
        </StatusBadge>
      </div>
      <dl className="border-border mt-4 grid gap-3 border-t pt-3 sm:grid-cols-2">
        <div>
          <dt className="text-muted text-xs font-medium">Anomaly score</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums">
            {formatScore(alert.anomalyScore)}
          </dd>
        </div>
        <div>
          <dt className="text-muted text-xs font-medium">Model version</dt>
          <dd className="mt-1 text-sm font-semibold [overflow-wrap:anywhere]">
            {alert.model.name} v{alert.model.version}
          </dd>
        </div>
      </dl>
    </section>
  );
}
