import { z } from "zod";

const counts = z.object({
  employees: z.number().int().nonnegative(),
  assigned: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  overdue: z.number().int().nonnegative(),
  completionRate: z.number().min(0).max(100),
});
export const departmentReportSchema = z.object({
  items: z.array(
    counts.extend({ id: z.string(), name: z.string(), code: z.string() }),
  ),
  summary: counts,
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().positive(),
  }),
});
export type DepartmentReportRow = z.infer<
  typeof departmentReportSchema
>["items"][number];
export type DepartmentProgressFilter =
  "all" | "overdue" | "completed" | "no_assignments";
