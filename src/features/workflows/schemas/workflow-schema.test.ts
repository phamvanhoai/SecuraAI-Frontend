import { describe, expect, it } from "vitest";
import {
  queryWorkflowDefinitionsSchema,
  workflowListResponseSchema,
} from "./workflow-schema";

describe("workflow-schema", () => {
  it("validates a valid workflow list response payload", () => {
    const payload = {
      items: [
        {
          workflowId: "11111111-1111-4111-a111-111111111111",
          name: "Quy trình duyệt rủi ro",
          description: "Mô tả quy trình",
          entityType: "risk_treatment_plan",
          isActive: true,
          stepsCount: 2,
          createdBy: {
            userId: "22222222-2222-4222-a222-222222222222",
            name: "Admin User",
            email: "admin@securaai.local",
          },
          createdAt: "2026-09-01T00:00:00.000Z",
          updatedAt: "2026-09-02T00:00:00.000Z",
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
      summary: {
        total: 5,
        active: 4,
        inactive: 1,
      },
    };

    const parsed = workflowListResponseSchema.parse(payload);
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0]?.name).toBe("Quy trình duyệt rủi ro");
    expect(parsed.summary.total).toBe(5);
    expect(parsed.summary.active).toBe(4);
    expect(parsed.summary.inactive).toBe(1);
  });

  it("handles null creator and description", () => {
    const payload = {
      items: [
        {
          workflowId: "33333333-3333-4333-a333-333333333333",
          name: "Policy Workflow",
          description: null,
          entityType: "policy_version",
          isActive: false,
          stepsCount: 0,
          createdBy: null,
          createdAt: "2026-09-01T00:00:00.000Z",
          updatedAt: "2026-09-02T00:00:00.000Z",
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
      summary: {
        total: 1,
        active: 0,
        inactive: 1,
      },
    };

    const parsed = workflowListResponseSchema.parse(payload);
    expect(parsed.items[0]?.createdBy).toBeNull();
    expect(parsed.items[0]?.description).toBeNull();
  });

  it("applies defaults for query schema", () => {
    const query = queryWorkflowDefinitionsSchema.parse({});
    expect(query.page).toBe(1);
    expect(query.limit).toBe(10);
    expect(query.sortBy).toBe("updatedAt");
    expect(query.sortOrder).toBe("desc");
  });
});
