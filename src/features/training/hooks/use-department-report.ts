"use client";
import { useQuery } from "@tanstack/react-query";
import { getDepartmentReport } from "../api/department-report";
import type { DepartmentProgressFilter } from "../schemas/department-report-schema";

export function useDepartmentReport(
  page: number,
  q: string,
  progress: DepartmentProgressFilter,
) {
  return useQuery({
    queryKey: ["training", "department-report", page, q, progress],
    queryFn: ({ signal }) => getDepartmentReport(page, q, progress, signal),
  });
}
