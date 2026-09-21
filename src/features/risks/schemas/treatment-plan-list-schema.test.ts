import { describe, expect, it } from "vitest";
import {
  treatmentPlanListQuerySchema,
  treatmentPlanListResponseSchema,
} from "./treatment-plan-list-schema";

describe("treatment plan list contracts", () => {
  it("normalizes supported filters and pagination defaults", () => {
    expect(
      treatmentPlanListQuerySchema.parse({
        page: "2",
        q: " server ",
        status: "in_progress",
        strategy: "mitigate",
        overdue: "true",
      }),
    ).toMatchObject({
      page: 2,
      limit: 10,
      q: "server",
      status: "in_progress",
      strategy: "mitigate",
      overdue: "true",
      sortBy: "updatedAt",
      sortOrder: "desc",
    });
  });

  it("rejects invalid filters and reversed target dates", () => {
    expect(
      treatmentPlanListQuerySchema.safeParse({ limit: "101" }).success,
    ).toBe(false);
    expect(
      treatmentPlanListQuerySchema.safeParse({ status: "unknown" }).success,
    ).toBe(false);
    expect(
      treatmentPlanListQuerySchema.safeParse({
        targetFrom: "2026-09-20",
        targetTo: "2026-09-19",
      }).success,
    ).toBe(false);
  });

  it("accepts a valid treatment plan list response", () => {
    expect(
      treatmentPlanListResponseSchema.safeParse({
        items: [
          {
            id: "00000000-0000-4000-8000-000000000001",
            risk: {
              id: "00000000-0000-4000-8000-000000000002",
              riskCode: "RSK-001",
              title: "Unauthorized access",
              riskLevel: "critical",
              status: "in_treatment",
            },
            strategy: "mitigate",
            status: "in_progress",
            owner: null,
            targetDate: "2026-10-01T00:00:00.000Z",
            progressPercent: 50,
            completedActions: 1,
            totalActions: 2,
            isOverdue: false,
            createdAt: "2026-09-01T00:00:00.000Z",
            updatedAt: "2026-09-19T00:00:00.000Z",
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }).success,
    ).toBe(true);
  });
});
