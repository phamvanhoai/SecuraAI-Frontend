import { describe, expect, it } from "vitest";
import { departmentReportSchema } from "./department-report-schema";
describe("department report boundary", () => {
  const counts = {
    employees: 1,
    assignedEmployees: 1,
    assigned: 2,
    completed: 1,
    overdue: 1,
    coverageRate: 100,
    completionRate: 50,
  };
  const data = {
    items: [{ ...counts, id: "unassigned", name: "No department", code: "—" }],
    summary: counts,
    pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
  };
  it("accepts backend report including employees without a department", () =>
    expect(departmentReportSchema.parse(data)).toEqual(data));
  it("rejects invalid rates and negative counts", () => {
    expect(
      departmentReportSchema.safeParse({
        ...data,
        summary: { ...counts, completionRate: 101 },
      }).success,
    ).toBe(false);
    expect(
      departmentReportSchema.safeParse({
        ...data,
        summary: { ...counts, assigned: -1 },
      }).success,
    ).toBe(false);
  });
});
