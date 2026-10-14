import {
  exportReportRequestSchema,
  listExportReportsResponseSchema,
  reportExportItemSchema,
  type ExportReportRequest,
  type ListExportReportsResponse,
  type ReportExportItem,
} from "../schemas/export-report-schema";

export async function fetchExportReports(params?: {
  page?: number | undefined;
  limit?: number | undefined;
  reportType?: string | undefined;
  status?: string | undefined;
}): Promise<ListExportReportsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.reportType) searchParams.set("reportType", params.reportType);
  if (params?.status) searchParams.set("status", params.status);

  const query = searchParams.toString();
  const res = await fetch(`/api/reports/exports${query ? `?${query}` : ""}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  const payload = await res.json();
  if (!res.ok || !payload.success) {
    throw new Error(payload?.error?.message || "Failed to load report exports");
  }

  return listExportReportsResponseSchema.parse(payload.data);
}

export async function createExportReport(
  input: ExportReportRequest,
): Promise<ReportExportItem> {
  const validated = exportReportRequestSchema.parse(input);
  const res = await fetch("/api/reports/exports", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(validated),
  });

  const payload = await res.json();
  if (!res.ok || !payload.success) {
    throw new Error(payload?.error?.message || "Failed to generate report export");
  }

  return reportExportItemSchema.parse(payload.data);
}

export async function revokeExportReport(
  exportId: string,
  reason: string,
): Promise<ReportExportItem> {
  const res = await fetch(`/api/reports/exports/${exportId}/revoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ reason }),
  });

  const payload = await res.json();
  if (!res.ok || !payload.success) {
    throw new Error(payload?.error?.message || "Failed to revoke report export");
  }

  return reportExportItemSchema.parse(payload.data);
}
