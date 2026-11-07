"use client";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
} from "lucide-react";
import Link from "next/link";
import { DistributionDonut } from "@/components/data-display/product-charts";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/features/authentication-account";
import { useSecurityDashboard } from "../hooks/use-security-dashboard";

export function SecurityDashboardView() {
  const session = useSessionUser();
  const canView =
    session.data?.roles.some(
      (r) => r.code === "SECURITY_OFFICER" || r.code === "EXECUTIVE",
    ) ?? false;

  const { data, isLoading, isError, error, refetch, isFetching } =
    useSecurityDashboard(canView);

  if (session.isPending || (canView && isLoading)) {
    return (
      <div className="space-y-5" data-testid="dashboard-loading-skeleton">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              className="border-border bg-surface rounded-[10px] border p-4 space-y-2"
              key={i}
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.2fr]">
          <Skeleton className="h-72 rounded-[10px]" />
          <Skeleton className="h-72 rounded-[10px]" />
          <Skeleton className="h-72 rounded-[10px]" />
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="space-y-5">
        <ProductPageHeader
          title="Security & Risk Posture Dashboard"
          description="View aggregated security posture, risk indicators, incident telemetry, and real-time anomaly alerts."
        />
        <div
          className="border-danger/30 bg-danger/10 text-danger rounded-xl border p-6 text-center space-y-3"
          data-testid="dashboard-unauthorized-state"
        >
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger/20 text-danger">
            <ShieldAlert className="size-6" />
          </div>
          <h3 className="text-base font-semibold">
            Access Restricted
          </h3>
          <p className="text-muted mx-auto max-w-md text-xs">
            This security dashboard is available to Security Officers and Executives only.
          </p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-5">
        <ProductPageHeader
          title="Security & Risk Posture Dashboard"
          description="View aggregated security posture, risk indicators, incident telemetry, and real-time anomaly alerts."
        />
        <div
          className="border-danger/30 bg-danger/10 text-danger rounded-xl border p-6 text-center space-y-3"
          data-testid="dashboard-error-state"
        >
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger/20 text-danger">
            <ShieldAlert className="size-6" />
          </div>
          <h3 className="text-base font-semibold">
            Failed to Load Security Dashboard
          </h3>
          <p className="text-muted mx-auto max-w-md text-xs">
            {error instanceof Error
              ? error.message
              : "Unable to retrieve organization security posture data from the server."}
          </p>
          <Button
            className="mt-2 min-h-8 text-xs"
            onClick={() => refetch()}
            type="button"
            variant="secondary"
          >
            <RefreshCw className="mr-1.5 size-3.5" />
            Retry Dashboard Telemetry
          </Button>
        </div>
      </div>
    );
  }

  const {
    userRole,
    securityIndicators,
    riskMetrics,
    incidentStatistics,
    aiAlertMetrics,
    operationalDetails,
    executiveSummary,
  } = data;

  const roleBadge = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="border-border bg-surface text-muted inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
        <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
        Telemetry: <strong className="text-foreground">Last 24 Hours</strong>
      </span>
      <span className="border-border bg-surface text-muted inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
        <Shield className="text-brand size-3.5" />
        Role: <strong className="text-foreground">{userRole}</strong>
      </span>
      <Button
        className="min-h-7 h-7 px-2.5 text-xs text-muted hover:text-foreground"
        disabled={isFetching}
        onClick={() => refetch()}
        title="Refresh posture data"
        type="button"
        variant="secondary"
      >
        <RefreshCw className={`size-3 ${isFetching ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );

  const metricsData = [
    {
      label: "Total IT Assets",
      value: securityIndicators.totalAssets.toLocaleString("en-US"),
      detail: `${securityIndicators.criticalAssets} critical / high priority`,
      tone: "brand" as const,
    },
    {
      label: "Open Risks",
      value: riskMetrics.openRisks.toLocaleString("en-US"),
      detail: `${riskMetrics.criticalRisks} critical risk items`,
      tone: riskMetrics.criticalRisks > 0 ? ("danger" as const) : ("neutral" as const),
    },
    {
      label: "Active Incidents",
      value: incidentStatistics.openIncidents.toLocaleString("en-US"),
      detail: `${incidentStatistics.criticalIncidents} critical incidents`,
      tone:
        incidentStatistics.criticalIncidents > 0
          ? ("danger" as const)
          : incidentStatistics.openIncidents > 0
            ? ("warning" as const)
            : ("neutral" as const),
    },
    {
      label: "24h AI Alerts",
      value: aiAlertMetrics.totalAlerts24h.toLocaleString("en-US"),
      detail: `${aiAlertMetrics.confirmedIncidents24h} confirmed incidents`,
      tone: "brand" as const,
    },
    {
      label: "Security Controls",
      value: securityIndicators.totalSecurityControls.toLocaleString("en-US"),
      detail: `${securityIndicators.activeEventSources} active log sources`,
      tone: "neutral" as const,
    },
  ];

  const donutItems = [
    { label: "Critical", value: String(riskMetrics.criticalRisks) },
    { label: "High", value: String(riskMetrics.highRisks) },
    { label: "Medium", value: String(riskMetrics.mediumRisks) },
    { label: "Low", value: String(riskMetrics.lowRisks) },
  ];

  const totalAssessedRisks =
    riskMetrics.criticalRisks +
    riskMetrics.highRisks +
    riskMetrics.mediumRisks +
    riskMetrics.lowRisks;

  return (
    <div className="space-y-5" data-testid="security-dashboard-view">
      <ProductPageHeader
        additionalActions={roleBadge}
        description={
          userRole === "EXECUTIVE"
            ? "Strategic executive summary synthesizing security posture health, compliance benchmarks, and risk exposure."
            : "Operational overview summarizing IT assets, active risks, incident response telemetry, and real-time AI anomaly alerts."
        }
        title={
          userRole === "EXECUTIVE"
            ? "Executive Security Posture Dashboard"
            : "Security & Risk Posture Dashboard"
        }
      />

      {/* Strategic Executive Summary Card (Visible for Executive and Admin) */}
      {executiveSummary ? (
        <section
          aria-label="Executive Security Posture Summary"
          className="border-border bg-surface overflow-hidden rounded-[10px] border p-5 shadow-[0_4px_18px_rgba(28,55,100,0.035)]"
          data-testid="executive-summary-section"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border pb-4">
            <div className="space-y-1">
              <span className="text-muted text-xs font-medium uppercase tracking-wider">
                Overall Security Health Score
              </span>
              <div className="flex items-center gap-3">
                <span
                  className={`text-3xl font-bold tracking-tight ${
                    executiveSummary.postureScore >= 80
                      ? "text-success"
                      : executiveSummary.postureScore >= 60
                        ? "text-warning"
                        : "text-danger"
                  }`}
                >
                  {executiveSummary.postureScore} / 100
                </span>
                <StatusBadge
                  tone={
                    executiveSummary.postureLevel === "STRONG"
                      ? "success"
                      : executiveSummary.postureLevel === "ADEQUATE"
                        ? "info"
                        : executiveSummary.postureLevel === "NEEDS_ATTENTION"
                          ? "warning"
                          : "danger"
                  }
                >
                  {executiveSummary.postureLevel}
                </StatusBadge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs">
              <div>
                <span className="text-muted block">Control Compliance Rate</span>
                <strong className="text-foreground text-sm font-semibold">
                  {executiveSummary.complianceRate}%
                </strong>
              </div>
              <div>
                <span className="text-muted block">Pending Reassessments</span>
                <strong className="text-foreground text-sm font-semibold">
                  {riskMetrics.pendingReassessments}
                </strong>
              </div>
              <div>
                <span className="text-muted block">Monitored Ingest Sources</span>
                <strong className="text-foreground text-sm font-semibold">
                  {securityIndicators.activeEventSources}
                </strong>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-brand" />
              Strategic Executive Highlights:
            </h4>
            <ul className="grid gap-2 sm:grid-cols-2 text-xs text-muted">
              {executiveSummary.strategicHighlights.map((highlight, idx) => (
                <li className="flex items-start gap-2" key={idx}>
                  <span className="text-brand mt-0.5">•</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* Core Security Indicators Metric Strip */}
      <MetricStrip ariaLabel="Security posture indicators" metrics={metricsData} />

      {/* Middle Analytical Grid */}
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.2fr]">
        {/* Risk Severity Distribution */}
        <ProductPanel
          description={`Categorization of ${totalAssessedRisks} evaluated organizational risks.`}
          title="Risk Rating Distribution"
        >
          <div className="p-4 space-y-3">
            <DistributionDonut
              items={donutItems}
              total={String(totalAssessedRisks)}
            />
            <div className="grid grid-cols-2 gap-2 text-xs border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-danger flex items-center gap-1">
                  ● Critical
                </span>
                <strong className="text-foreground">{riskMetrics.criticalRisks}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-warning flex items-center gap-1">
                  ● High
                </span>
                <strong className="text-foreground">{riskMetrics.highRisks}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand flex items-center gap-1">
                  ● Medium
                </span>
                <strong className="text-foreground">{riskMetrics.mediumRisks}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-success flex items-center gap-1">
                  ● Low
                </span>
                <strong className="text-foreground">{riskMetrics.lowRisks}</strong>
              </div>
            </div>
          </div>
        </ProductPanel>

        {/* Incident Lifecycle Overview */}
        <ProductPanel
          description={`Tracking ${incidentStatistics.totalIncidents} total logged security incidents.`}
          title="Incident Lifecycle Status"
        >
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-lg border border-border bg-neutral-soft/40 p-3">
                <span className="text-muted block text-xs">Open / Triage</span>
                <span className="text-foreground text-xl font-bold">
                  {incidentStatistics.openIncidents}
                </span>
              </div>
              <div className="rounded-lg border border-border bg-neutral-soft/40 p-3">
                <span className="text-muted block text-xs">In Progress</span>
                <span className="text-foreground text-xl font-bold">
                  {incidentStatistics.inProgressIncidents}
                </span>
              </div>
              <div className="rounded-lg border border-border bg-neutral-soft/40 p-3">
                <span className="text-muted block text-xs">Resolved / Closed</span>
                <span className="text-success text-xl font-bold">
                  {incidentStatistics.resolvedIncidents}
                </span>
              </div>
              <div className="rounded-lg border border-border bg-neutral-soft/40 p-3">
                <span className="text-muted block text-xs">Critical Severity</span>
                <span className="text-danger text-xl font-bold">
                  {incidentStatistics.criticalIncidents}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-border/80 bg-surface p-3 text-xs flex items-center justify-between">
              <span className="text-muted flex items-center gap-1.5">
                <Activity className="size-3.5 text-brand" />
                Response Health
              </span>
              <span className="font-medium text-foreground">
                {incidentStatistics.openIncidents === 0
                  ? "All Incidents Contained"
                  : `${incidentStatistics.openIncidents} Pending Response`}
              </span>
            </div>
          </div>
        </ProductPanel>

        {/* AI Anomaly Detection Telemetry */}
        <ProductPanel
          description="Real-time telemetry from deployed anomaly detection models."
          title="AI Anomaly Alerts (24h)"
        >
          <div className="p-4 space-y-3">
            {/* 24h Ingested Events to AI Alerts Funnel */}
            <div className="rounded-lg border border-border/80 bg-neutral-soft/30 p-2.5 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted flex items-center gap-1.5">
                  <Activity className="size-3.5 text-brand" />
                  24h Ingested Events:
                </span>
                <strong className="text-foreground font-semibold">
                  {aiAlertMetrics.totalEvents24h.toLocaleString("en-US")}
                </strong>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted">AI Noise Reduction:</span>
                <span className="text-emerald-500 font-medium">
                  {aiAlertMetrics.totalEvents24h > 0
                    ? `${(
                        ((aiAlertMetrics.totalEvents24h - aiAlertMetrics.totalAlerts24h) /
                          aiAlertMetrics.totalEvents24h) *
                        100
                      ).toFixed(1)}% Noise Filtered`
                    : "100% Filtered"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded border border-border bg-neutral-soft/30 p-2">
                <span className="text-muted block">New</span>
                <strong className="text-brand text-sm">{aiAlertMetrics.newAlerts24h}</strong>
              </div>
              <div className="rounded border border-border bg-neutral-soft/30 p-2">
                <span className="text-muted block">Reviewing</span>
                <strong className="text-warning text-sm">
                  {aiAlertMetrics.reviewingAlerts24h}
                </strong>
              </div>
              <div className="rounded border border-border bg-neutral-soft/30 p-2">
                <span className="text-muted block">Confirmed</span>
                <strong className="text-danger text-sm">
                  {aiAlertMetrics.confirmedIncidents24h}
                </strong>
              </div>
            </div>

            <div className="border-t border-border pt-2 divide-y divide-border/60">
              {operationalDetails?.recentAlerts &&
              operationalDetails.recentAlerts.length > 0 ? (
                operationalDetails.recentAlerts.slice(0, 3).map((alert) => (
                  <div
                    className="flex items-center justify-between py-2 text-xs"
                    key={alert.id}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <BrainCircuit className="size-3.5 text-brand shrink-0" />
                      <span className="truncate font-medium text-foreground">
                        {alert.detectionType || "Anomaly Detection"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <StatusBadge
                        tone={
                          alert.severity.toUpperCase() === "CRITICAL" ||
                          alert.severity.toUpperCase() === "HIGH"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {alert.severity}
                      </StatusBadge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-muted">
                  No active anomaly alerts in the latest evaluation cycle.
                </div>
              )}
            </div>

            <Link
              className="text-brand hover:underline flex items-center justify-end gap-1 text-xs font-medium pt-1"
              href="/anomaly-monitoring"
            >
              View All Alerts <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </ProductPanel>
      </div>

      {/* Operational Details (Visible for Security Officer and Admin) */}
      {operationalDetails ? (
        <div
          className="grid gap-4 xl:grid-cols-2"
          data-testid="operational-details-section"
        >
          {/* High Risk Assets */}
          <ProductPanel
            description="Mission-critical IT assets requiring stringent control verification."
            title="Monitored High Criticality Assets"
          >
            <div className="divide-y divide-border">
              {operationalDetails.highRiskAssets.length > 0 ? (
                operationalDetails.highRiskAssets.map((asset) => (
                  <div
                    className="flex items-center justify-between px-5 py-3 text-xs"
                    key={asset.id}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <HardDrive className="size-4 text-muted shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {asset.name}
                        </p>
                        <p className="text-muted text-[11px]">{asset.assetCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted border border-border rounded px-1.5 py-0.5">
                        <AlertTriangle className="size-3 text-amber-500" />
                        {asset.openRisksCount} risks
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted border border-border rounded px-1.5 py-0.5">
                        <Siren className="size-3 text-rose-500" />
                        {asset.activeIncidentsCount} incidents
                      </span>
                      <StatusBadge
                        tone={
                          asset.criticality === "CRITICAL"
                            ? "danger"
                            : asset.criticality === "HIGH"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {asset.criticality}
                      </StatusBadge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-muted">
                  No high-criticality assets identified in current scope.
                </div>
              )}
            </div>
            <div className="border-t border-border px-5 py-2.5 bg-neutral-soft/20 flex justify-between items-center text-xs">
              <span className="text-muted">
                Open Control Weaknesses:{" "}
                <strong className="text-foreground">
                  {operationalDetails.openControlWeaknessesCount}
                </strong>
              </span>
              <Link className="text-brand hover:underline flex items-center gap-1" href="/assets">
                Manage Assets <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </ProductPanel>

          {/* Recent Security Incidents */}
          <ProductPanel
            description="Active investigations and recent security incident tickets."
            title="Recent Incident Investigations"
          >
            <div className="divide-y divide-border">
              {operationalDetails.recentIncidents.length > 0 ? (
                operationalDetails.recentIncidents.map((incident) => (
                  <div
                    className="flex items-center justify-between px-5 py-3 text-xs"
                    key={incident.id}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Siren className="size-4 text-muted shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {incident.title}
                        </p>
                        <p className="text-muted text-[11px]">{incident.incidentCode}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge
                        tone={
                          incident.severity.toUpperCase() === "CRITICAL"
                            ? "danger"
                            : incident.severity.toUpperCase() === "HIGH"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {incident.severity}
                      </StatusBadge>
                      <StatusBadge
                        tone={
                          incident.status === "CLOSED" ||
                          incident.status === "LESSONS_LEARNED"
                            ? "success"
                            : "info"
                        }
                      >
                        {incident.status}
                      </StatusBadge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-muted">
                  No active incidents recorded in the investigation queue.
                </div>
              )}
            </div>
            <div className="border-t border-border px-5 py-2.5 bg-neutral-soft/20 flex justify-end text-xs">
              <Link className="text-brand hover:underline flex items-center gap-1" href="/incidents">
                View All Incidents <ArrowUpRight className="size-3" />
              </Link>
            </div>
          </ProductPanel>
        </div>
      ) : null}
    </div>
  );
}
