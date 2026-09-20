import { afterEach, describe, expect, it, vi } from "vitest";
import { listCourses, updateCourseDraft } from "./courses";

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

  it("updates a draft through the authenticated same-origin route", async () => {
    const courseId = "e2ef8324-9ac0-4e7f-b16d-50050274a72e";
    const updated = {
      id: courseId,
      title: "Updated phishing basics",
      description: null,
      content: "Updated learning objectives and training material.",
      status: "draft",
      createdByUserId: null,
      createdAt: "2026-09-18T00:00:00.000Z",
      updatedAt: "2026-09-18T01:00:00.000Z",
      assessment: null,
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ success: true, data: updated }));

    await expect(
      updateCourseDraft(courseId, {
        title: updated.title,
        description: "",
        content: updated.content,
      }),
    ).resolves.toEqual(updated);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/training/courses/${courseId}`,
      expect.objectContaining({ method: "PATCH", credentials: "include" }),
    );
  });
});
