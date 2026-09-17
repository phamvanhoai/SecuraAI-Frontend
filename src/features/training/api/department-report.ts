import { apiRequest } from "@/lib/api/api-client";
import {
  departmentReportSchema,
  type DepartmentProgressFilter,
} from "../schemas/department-report-schema";

export async function getDepartmentReport(
  page: number,
  q: string,
  progress: DepartmentProgressFilter,
  signal?: AbortSignal,
) {
  return departmentReportSchema.parse(
    await apiRequest<unknown>("/api/training/department-report", {
      target: "same-origin",
      query: {
        page,
        limit: 10,
        q,
        ...(progress !== "all" ? { progress } : {}),
      },
      ...(signal ? { signal } : {}),
    }),
  );
}
