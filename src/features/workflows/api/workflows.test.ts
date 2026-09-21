import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getWorkflowDefinitions } from "./workflows";

describe("getWorkflowDefinitions API", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("fetches and parses workflow definitions successfully", async () => {
    const mockResponse = {
      success: true,
      data: {
        items: [
          {
            workflowId: "11111111-1111-4111-a111-111111111111",
            name: "Quy trình duyệt rủi ro",
            description: "Mô tả",
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
          total: 1,
          active: 1,
          inactive: 0,
        },
      },
    };

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await getWorkflowDefinitions({ page: 1, limit: 10 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.name).toBe("Quy trình duyệt rủi ro");
    expect(result.summary.active).toBe(1);
  });
});
