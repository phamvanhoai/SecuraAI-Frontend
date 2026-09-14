import { describe, expect, it } from "vitest";
import { createCourseSchema } from "./course-schema";

describe("createCourseSchema", () => {
  it("accepts a course draft", () => {
    expect(createCourseSchema.parse({ title: "Phishing basics", description: "", content: "Learn to identify phishing emails." }).title).toBe("Phishing basics");
  });
  it("rejects empty content", () => {
    expect(createCourseSchema.safeParse({ title: "Phishing", description: "", content: " " }).success).toBe(false);
  });
});
