import { describe, expect, it } from "vitest";
import { createCourseSchema, courseMaterialSchema } from "./course-schema";
const base = {
  title: "Security awareness",
  description: "",
  content: "Learn to protect your account.",
  status: "draft",
  lessons: [
    {
      title: "Strong passwords",
      isRequired: true,
      materials: [
        { title: "Guidance", type: "text", content: "Use unique passwords." },
      ],
    },
  ],
};
describe("course lessons", () => {
  it("accepts a draft with lessons", () =>
    expect(createCourseSchema.safeParse(base).success).toBe(true));
  it("rejects empty lessons", () =>
    expect(createCourseSchema.safeParse({ ...base, lessons: [] }).success).toBe(
      false,
    ));
  it("rejects missing material sources", () =>
    expect(
      courseMaterialSchema.safeParse({ title: "Video", type: "video" }).success,
    ).toBe(false));
  it.each([
    "not a URL",
    "http://example.com",
    "https://user:password@example.com",
  ])("rejects unsafe URLs: %s", (externalUrl) =>
    expect(
      courseMaterialSchema.safeParse({
        title: "Link",
        type: "link",
        externalUrl,
      }).success,
    ).toBe(false),
  );
  it("does not publish structured content at creation", () =>
    expect(
      createCourseSchema.safeParse({ ...base, status: "published" }).success,
    ).toBe(false));
});
