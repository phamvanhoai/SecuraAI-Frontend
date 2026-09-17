import { StatusBadge } from "@/components/data-display/static-product";
import type {
  IntegrationStatus,
  IntegrationType,
} from "../schemas/integration-schema";

export function IntegrationAdminBadge({
  isEnabled,
}: {
  isEnabled: boolean;
}) {
  return isEnabled ? (
    <StatusBadge tone="success">Enabled</StatusBadge>
  ) : (
    <StatusBadge tone="neutral">Disabled</StatusBadge>
  );
}

export function IntegrationConnectionBadge({
  status,
}: {
  status: IntegrationStatus | string;
}) {
  switch (status) {
    case "active":
      return <StatusBadge tone="success">Connected</StatusBadge>;
    case "error":
      return <StatusBadge tone="danger">Connection Error</StatusBadge>;
    case "pending":
      return <StatusBadge tone="warning">Pending Probe</StatusBadge>;
    case "inactive":
    case "disabled":
    default:
      return <StatusBadge tone="neutral">Offline</StatusBadge>;
  }
}

export function IntegrationStatusBadge({
  status,
}: {
  status: IntegrationStatus | string;
}) {
  switch (status) {
    case "active":
      return <StatusBadge tone="success">Active</StatusBadge>;
    case "error":
      return <StatusBadge tone="danger">Connection Error</StatusBadge>;
    case "pending":
      return <StatusBadge tone="warning">Pending</StatusBadge>;
    case "inactive":
    case "disabled":
    default:
      return <StatusBadge tone="neutral">Disabled</StatusBadge>;
  }
}

export function IntegrationTypeBadge({
  type,
}: {
  type: IntegrationType | string;
}) {
  const labels: Record<string, string> = {
    siem: "SIEM",
    firewall: "Firewall",
    log_source: "Log Source",
    api: "REST API",
  };

  const tones: Record<string, "success" | "warning" | "info" | "danger" | "neutral"> = {
    siem: "info",
    firewall: "warning",
    log_source: "neutral",
    api: "neutral",
  };

  return (
    <StatusBadge tone={tones[type] ?? "neutral"}>
      {labels[type] ?? type.toUpperCase()}
    </StatusBadge>
  );
}

