import { afterEach, describe, expect, it, vi } from "vitest";
import { listCourses } from "./courses";

const emptyCourses = {
  items: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
};

afterEach(() => vi.restoreAllMocks());

describe("training courses API", () => {
  it("sends a selected status to the backend-backed list", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ success: true, data: emptyCourses }));

    await expect(listCourses(1, "phishing", "published")).resolves.toEqual(
      emptyCourses,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/training/courses?page=1&limit=20&q=phishing&status=published",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("omits the status parameter for the all-statuses option", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ success: true, data: emptyCourses }));

    await listCourses(1, "", "all");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/training/courses?page=1&limit=20",
      expect.any(Object),
    );
  });
});
