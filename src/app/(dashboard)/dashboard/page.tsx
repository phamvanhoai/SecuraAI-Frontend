"use client";

import { Activity, ArrowUpRight, BrainCircuit, Download, Info, ShieldAlert, Siren } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { DistributionDonut, RiskTrendChart } from "@/components/data-display/product-charts";
import { MetricStrip, ProductPageHeader, ProductPanel, StatusBadge } from "@/components/data-display/static-product";
import { DashboardLoadingSkeleton } from "@/components/feedback/loading-skeletons";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useSessionUser } from "@/features/authentication-account";

const recentAlerts = [
  { id: "ALT-C16E63BD", title: "Privileged login failure", score: "0.94", level: "Critical", time: "6 min ago" },
  { id: "ALT-87A21F40", title: "Unusual outbound data volume", score: "0.88", level: "High", time: "24 min ago" },
  { id: "ALT-41D99B72", title: "Repeated access policy denials", score: "0.81", level: "High", time: "1 hr ago" },
] as const;

const recentIncidents = [
  { id: "INC-C16E63BDD91A4C1F", title: "Privileged account compromise investigation", severity: "Critical", status: "Investigating" },
  { id: "INC-E628C39D70D94FF5", title: "Unusual data transfer from finance endpoint", severity: "High", status: "Containment" },
  { id: "INC-41D99B72A82248D0", title: "Unauthorized access attempts against VPN", severity: "Medium", status: "Open" },
] as const;

export default function DashboardPage() {
  const session = useSessionUser();
  const exportDialog = useRef<HTMLDialogElement>(null);
  const [reportSections, setReportSections] = useState<string[]>(["security", "risk", "incident"]);
  const [reportError, setReportError] = useState("");
  const toast = useToast();
  if (session.isPending) return <DashboardLoadingSkeleton variant="dashboard" />;
  const roles = session.data?.roles.map((role) => role.code) ?? [];
  const isSecurityOfficer = roles.includes("SECURITY_OFFICER");
  const isAuthorizedExecutive = roles.includes("EXECUTIVE");

  if (!isSecurityOfficer && !isAuthorizedExecutive) {
    return (
      <div className="space-y-5">
        <ProductPageHeader title="Security posture dashboard" description="Organization-wide security, risk, incident, and AI alert indicators." showSampleNotice={false} />
        <Alert>This dashboard is available to Security Officers and authorized Executives only.</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ProductPageHeader
        title="Security posture dashboard"
        description="Review security indicators, organizational risk, active incidents, and recent AI-generated alerts within your access scope."
        additionalActions={
          <Button type="button" onClick={() => exportDialog.current?.showModal()}>
            <Download aria-hidden="true" className="size-4" />
            Export report
          </Button>
        }
        showSampleNotice={false}
      />
      <Alert className="border-info/25 bg-info-soft text-info">
        <div className="flex items-start gap-2">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>UI preview for UC91. These example indicators are provided for documentation and will be replaced by scope-aware dashboard APIs.</p>
        </div>
      </Alert>
      <MetricStrip
        ariaLabel="Security posture summary"
        metrics={[
          { label: "Critical & high risks", value: "18", detail: "5 require owner review", tone: "danger" },
          { label: "Open incidents", value: "7", detail: "2 critical incidents", tone: "warning" },
          { label: "AI alerts (24 hours)", value: "12", detail: "3 awaiting triage", tone: "brand" },
          { label: "Control effectiveness", value: "82%", detail: "6 controls need attention", tone: "neutral" },
        ]}
      />
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <ProductPanel title="Risk exposure trend" description="Open risks by severity during the current reporting period.">
          <div className="text-muted flex flex-wrap gap-4 px-5 pt-4 text-xs">
            <ChartLegend className="text-danger" label="Critical" />
            <ChartLegend className="text-warning" label="High" />
            <ChartLegend className="text-info" label="Medium" />
            <ChartLegend className="text-success" label="Low" />
          </div>
          <div className="px-3 pb-3"><RiskTrendChart /></div>
        </ProductPanel>
        <ProductPanel title="Risk distribution" description="Current accessible risks grouped by severity.">
          <div className="p-3">
            <DistributionDonut total="42" items={[{ label: "Critical", value: "6" }, { label: "High", value: "12" }, { label: "Medium", value: "17" }, { label: "Low", value: "7" }]} />
            <div className="text-muted grid grid-cols-2 gap-2 px-2 pb-2 text-xs"><span>Critical: 6</span><span>High: 12</span><span>Medium: 17</span><span>Low: 7</span></div>
          </div>
        </ProductPanel>
      </div>
      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <ProductPanel title="Security indicators" description="Operational signals available within the current scope.">
          <div className="divide-border divide-y">
            <Indicator label="Active event sources" value="8 of 9" tone="success" />
            <Indicator label="Events processed (24 hours)" value="128,406" tone="info" />
            <Indicator label="Sources requiring attention" value="1" tone="warning" />
            <Indicator label="Untriaged critical alerts" value="2" tone="danger" />
          </div>
        </ProductPanel>
        <ProductPanel title="Recent incidents" description="Latest incident activity visible to this user.">
          <div className="divide-border divide-y">
            {recentIncidents.map((incident) => (
              <div className="flex items-start gap-3 p-4" key={incident.id}>
                <Siren aria-hidden="true" className="text-muted mt-0.5 size-4 shrink-0" />
                <div className="min-w-0 flex-1"><p className="font-mono text-xs font-semibold">{incident.id}</p><p className="mt-1 text-sm leading-5">{incident.title}</p></div>
                <div className="flex flex-wrap justify-end gap-2">
                  <StatusBadge tone={incident.severity === "Critical" ? "danger" : incident.severity === "High" ? "warning" : "info"}>{incident.severity}</StatusBadge>
                  <StatusBadge tone="neutral">{incident.status}</StatusBadge>
                </div>
              </div>
            ))}
          </div>
          <PanelLink href="/incidents" label="View incidents" />
        </ProductPanel>
      </div>
      <ProductPanel title="Recent AI-generated alerts" description="Highest-priority anomaly alerts generated during the current period.">
        <div className="divide-border divide-y">
          {recentAlerts.map((alert) => (
            <div className="flex items-start gap-3 p-4" key={alert.id}>
              <span className="bg-danger-soft text-danger grid size-9 shrink-0 place-items-center rounded-lg"><BrainCircuit aria-hidden="true" className="size-4" /></span>
              <div className="min-w-0 flex-1"><p className="text-sm font-medium">{alert.title}</p><p className="text-muted mt-1 text-xs">{alert.id} · Anomaly score {alert.score} · {alert.time}</p></div>
              <StatusBadge tone={alert.level === "Critical" ? "danger" : "warning"}>{alert.level}</StatusBadge>
            </div>
          ))}
        </div>
        <PanelLink href="/alerts" label="View AI alerts" />
      </ProductPanel>
      <Dialog
        className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto"
        dialogRef={exportDialog}
        title="Export security report"
      >
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (reportSections.length === 0) {
              setReportError("Select at least one report section.");
              return;
            }
            setReportError("");
            exportDialog.current?.close();
            toast.info(
              "Report request validated",
              "UI preview only. No PDF or Excel file was generated.",
            );
          }}
        >
          <Alert>
            UI preview for UC92. The production export will contain only data
            within your current access scope.
          </Alert>
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Reporting period</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="report-from-date">From date</Label>
                <Input defaultValue="2026-09-01" id="report-from-date" max="2026-10-06" required type="date" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-to-date">To date</Label>
                <Input defaultValue="2026-10-06" id="report-to-date" max="2026-10-06" required type="date" />
              </div>
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Report sections</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {([
                ["security", "Security indicators"],
                ["risk", "Risk summary"],
                ["incident", "Incident statistics"],
              ] as const).map(([value, label]) => (
                <label className="border-border flex min-h-11 items-center gap-3 rounded-lg border p-3 text-sm font-medium" key={value}>
                  <Checkbox
                    checked={reportSections.includes(value)}
                    onChange={(event) => {
                      setReportSections((current) =>
                        event.target.checked
                          ? [...current, value]
                          : current.filter((section) => section !== value),
                      );
                      setReportError("");
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>
            {reportError ? <p className="text-danger text-sm" role="alert">{reportError}</p> : null}
          </fieldset>
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Available filters</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="report-severity">Severity</Label>
                <Select id="report-severity" defaultValue="all">
                  <option value="all">All severities</option>
                  <option value="critical-high">Critical and high</option>
                  <option value="critical">Critical only</option>
                  <option value="high">High only</option>
                  <option value="medium-low">Medium and low</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="report-record-status">Record status</Label>
                <Select id="report-record-status" defaultValue="all">
                  <option value="all">All statuses</option>
                  <option value="open">Open / active</option>
                  <option value="closed">Closed / resolved</option>
                </Select>
              </div>
            </div>
          </fieldset>
          <div className="space-y-1.5">
            <Label htmlFor="report-format">Export format</Label>
            <Select id="report-format" defaultValue="pdf" required>
              <option value="pdf">PDF document</option>
              <option value="xlsx">Excel workbook (.xlsx)</option>
            </Select>
          </div>
          <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => exportDialog.current?.close()}>
              Cancel
            </Button>
            <Button type="submit">
              <Download aria-hidden="true" className="size-4" />
              Generate export
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

function ChartLegend({ className, label }: { className: string; label: string }) {
  return <span className={className}><span aria-hidden="true">●</span> {label}</span>;
}

function Indicator({ label, value, tone }: { label: string; value: string; tone: "success" | "info" | "warning" | "danger" }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {tone === "danger" ? <ShieldAlert aria-hidden="true" className="text-danger size-4" /> : <Activity aria-hidden="true" className="text-muted size-4" />}
      <span className="flex-1 text-sm">{label}</span><StatusBadge tone={tone}>{value}</StatusBadge>
    </div>
  );
}

function PanelLink({ href, label }: { href: string; label: string }) {
  return <Link className="text-brand border-border flex min-h-11 items-center gap-2 border-t px-4 py-3 text-sm font-medium" href={href}>{label}<ArrowUpRight aria-hidden="true" className="size-4" /></Link>;
}
