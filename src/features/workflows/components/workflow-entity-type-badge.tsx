import { StatusBadge } from "@/components/data-display/static-product";
import {
  WORKFLOW_ENTITY_LABELS,
  type WorkflowEntityType,
} from "../schemas/workflow-schema";

export function WorkflowEntityTypeBadge({
  entityType,
}: {
  entityType: WorkflowEntityType | string;
}) {
  const tones: Record<string, "info" | "warning" | "danger" | "neutral"> = {
    risk_treatment_plan: "warning",
    policy_version: "info",
    incident_report: "danger",
    access_request: "neutral",
  };

  const label =
    WORKFLOW_ENTITY_LABELS[entityType as WorkflowEntityType] ?? entityType;
  const tone = tones[entityType] ?? "neutral";

  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}
