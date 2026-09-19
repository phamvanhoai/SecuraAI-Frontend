import { afterEach, describe, expect, it, vi } from "vitest";
import { getCourseDraft, listCourses, updateCourseDraft } from "./courses";

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

  it("loads and updates a complete draft through the authenticated route", async () => {
    const courseId = "e2ef8324-9ac0-4e7f-b16d-50050274a72e";
    const draft = {
      id: courseId,
      title: "Security basics",
      description: null,
      content: "Learn secure daily practices.",
      status: "draft",
      updatedAt: "2026-09-19T08:00:00.000Z",
      lessons: [
        {
          title: "Passwords",
          description: "",
          isRequired: true,
          materials: [
            {
              title: "Guide",
              type: "text" as const,
              content: "Use unique passwords.",
            },
          ],
        },
      ],
      assessment: null,
    };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() =>
        Promise.resolve(Response.json({ success: true, data: draft })),
      );

    await expect(getCourseDraft(courseId)).resolves.toEqual(draft);
    await updateCourseDraft(courseId, {
      title: draft.title,
      description: "",
      content: draft.content,
      lessons: draft.lessons,
      expectedUpdatedAt: draft.updatedAt,
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      `/api/training/courses/${courseId}`,
      expect.objectContaining({ method: "PATCH", credentials: "include" }),
    );
  });
});
