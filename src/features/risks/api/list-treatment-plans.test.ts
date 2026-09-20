import { afterEach, describe, expect, it, vi } from "vitest";
import { listTreatmentPlans } from "./list-treatment-plans";

afterEach(() => vi.unstubAllGlobals());

describe("listTreatmentPlans", () => {
  it("calls the same-origin BFF with server-side filters", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            items: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await listTreatmentPlans({
      page: 1,
      limit: 10,
      status: "in_progress",
      overdue: "true",
      sortBy: "updatedAt",
      sortOrder: "desc",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/risks/treatment-plans?page=1&limit=10&status=in_progress&overdue=true&sortBy=updatedAt&sortOrder=desc",
      expect.objectContaining({ credentials: "include", method: "GET" }),
    );
  });

  it("rejects malformed successful responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            success: true,
            data: { items: [{}], pagination: {} },
          }),
          { status: 200 },
        ),
      ),
    );
    await expect(
      listTreatmentPlans({
        page: 1,
        limit: 10,
        sortBy: "updatedAt",
        sortOrder: "desc",
      }),
    ).rejects.toMatchObject({ status: 502, code: "UNKNOWN_ERROR" });
  });
});
