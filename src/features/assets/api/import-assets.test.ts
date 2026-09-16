import { afterEach, describe, expect, it, vi } from "vitest";
import { importAssets } from "./import-assets";

afterEach(() => vi.unstubAllGlobals());

describe("importAssets", () => {
  it("uploads the workbook as multipart form data and returns the import result", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            id: "00000000-0000-4000-8000-000000000001",
            importType: "assets",
            status: "completed",
            totalRows: 3,
            successRows: 1,
            failedRows: 2,
            summary: {
              totalRows: 3,
              importedRows: 1,
              duplicateRows: 1,
              invalidRows: 1,
              message:
                "Import completed: 1 asset imported, 1 duplicate skipped, 1 invalid row.",
            },
            errors: [],
            createdAt: "2026-09-10T00:00:00.000Z",
            completedAt: "2026-09-10T00:00:01.000Z",
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["content"], "assets.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    await expect(importAssets(file)).resolves.toMatchObject({
      successRows: 1,
      summary: { importedRows: 1, duplicateRows: 1, invalidRows: 1 },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/assets/import",
      expect.objectContaining({ method: "POST", body: expect.any(FormData) }),
    );
  });
});
