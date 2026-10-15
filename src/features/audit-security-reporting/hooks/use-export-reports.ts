import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createExportReport, fetchExportReports, revokeExportReport } from "../api/export-report";
import type {
  ExportReportRequest,
  ListExportReportsResponse,
  ReportExportItem,
} from "../schemas/export-report-schema";

export function useExportReportsQuery(params?: {
  page?: number | undefined;
  limit?: number | undefined;
  reportType?: string | undefined;
  status?: string | undefined;
}) {
  return useQuery<ListExportReportsResponse, Error>({
    queryKey: ["export-reports", params],
    queryFn: () => fetchExportReports(params),
  });
}

export function useCreateExportReportMutation() {
  const queryClient = useQueryClient();

  return useMutation<ReportExportItem, Error, ExportReportRequest>({
    mutationFn: (data: ExportReportRequest) => createExportReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["export-reports"] });
    },
  });
}

export function useRevokeExportReportMutation() {
  const queryClient = useQueryClient();

  return useMutation<ReportExportItem, Error, { exportId: string; reason: string }>({
    mutationFn: ({ exportId, reason }) => revokeExportReport(exportId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["export-reports"] });
    },
  });
}
