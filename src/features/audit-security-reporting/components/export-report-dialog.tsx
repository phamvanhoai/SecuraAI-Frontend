"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { useToast } from "@/components/feedback/toast";
import { useCreateExportReportMutation } from "../hooks/use-export-reports";
import type {
  ExportReportRequest,
  ReportFormat,
  ReportType,
} from "../schemas/export-report-schema";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";

interface ExportReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportReportDialog({ isOpen, onClose }: ExportReportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();

  const [reportType, setReportType] = useState<ReportType>("RISK");
  const [format, setFormat] = useState<ReportFormat>("EXCEL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [severity, setSeverity] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateExportReportMutation();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      if (typeof dialog.showModal === "function") {
        dialog.showModal();
      } else {
        dialog.setAttribute("open", "");
      }
    } else if (!isOpen && dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setFormError("Start date cannot be later than end date.");
      return;
    }

    try {
      const payload: ExportReportRequest = {
        reportType,
        format,
      };
      if (startDate) payload.startDate = startDate;
      if (endDate) payload.endDate = endDate;
      if (severity) payload.severity = severity;
      if (status) payload.status = status;

      const result = await createMutation.mutateAsync(payload);

      toast.success(
        "Report Generated Successfully",
        `Your ${reportType} report (${format}) is ready and download has started.`,
      );

      if (result.id) {
        window.open(`/api/reports/exports/${result.id}/download`, "_blank");
      }

      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setFormError(message);
    }
  };

  return (
    <Dialog
      dialogRef={dialogRef}
      onClose={onClose}
      title="Export Security & Risk Report"
      className="max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100%-2rem))] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <Alert className="border-danger/30 bg-danger-soft text-danger text-sm">
            {formError}
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="report-type">Report Type</Label>
          <Select
            id="report-type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
          >
            <option value="RISK">Security Risk Register (Risk assessments & treatments)</option>
            <option value="INCIDENT">Security Incident Log (Incident records & resolutions)</option>
            <option value="SECURITY_POSTURE">Organization Security Posture (Executive posture & compliance)</option>
          </Select>
          <p className="text-muted text-xs">
            {reportType === "RISK" && "Includes identified risks, impact scores, likelihood ratings, and risk treatment strategies."}
            {reportType === "INCIDENT" && "Detailed records of security incidents, affected scopes, severity levels, and resolution logs."}
            {reportType === "SECURITY_POSTURE" && "Executive summary of organizational security health, anomaly metrics, and ISO 27001 indicators."}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="report-format">Export Format</Label>
          <Select
            id="report-format"
            value={format}
            onChange={(e) => setFormat(e.target.value as ReportFormat)}
          >
            <option value="EXCEL">Microsoft Excel (.xlsx)</option>
            <option value="PDF">PDF Document (.pdf)</option>
            <option value="CSV">Comma Separated Values (.csv)</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="start-date">Start Date (From)</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="end-date">End Date (To)</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {reportType !== "SECURITY_POSTURE" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="severity-filter">Severity Level</Label>
              <Select
                id="severity-filter"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status-filter">Record Status</Label>
              <Select
                id="status-filter"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                {reportType === "RISK" ? (
                  <>
                    <option value="OPEN">Open</option>
                    <option value="UNDER_TREATMENT">Under Treatment</option>
                    <option value="ACCEPTED">Accepted</option>
                    <option value="CLOSED">Closed</option>
                    <option value="ARCHIVED">Archived</option>
                  </>
                ) : (
                  <>
                    <option value="OPEN">Open</option>
                    <option value="TRIAGE">Triage</option>
                    <option value="CONTAINMENT">Containment</option>
                    <option value="ERADICATION">Eradication</option>
                    <option value="RECOVERY">Recovery</option>
                    <option value="LESSONS_LEARNED">Lessons Learned</option>
                    <option value="CLOSED">Closed</option>
                  </>
                )}
              </Select>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border bg-surface-subtle p-3 text-xs text-muted space-y-1">
          <p className="font-medium text-foreground">Role & SoD Governance (ISO/IEC 27001):</p>
          <p>
            Only <strong>Security Officers</strong> and authorized <strong>Executives</strong> are permitted to export reports. All export actions are recorded in an immutable audit trail.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                {format === "EXCEL" ? (
                  <FileSpreadsheet className="size-4" />
                ) : (
                  <FileText className="size-4" />
                )}
                <span>Generate Report</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
