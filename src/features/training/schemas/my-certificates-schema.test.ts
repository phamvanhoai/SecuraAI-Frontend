import { describe, expect, it } from "vitest";
import { myCertificatesSchema } from "./my-certificates-schema";

const item = {
  id: "00000000-0000-4000-8000-000000000001",
  number: "SEC-TR-123",
  issuedAt: "2026-09-20T00:00:00.000Z",
  issuedBy: null,
  enrollmentId: "00000000-0000-4000-8000-000000000002",
  completedAt: "2026-09-19T00:00:00.000Z",
  campaignTitle: "Autumn",
  courseTitle: "Phishing",
};

describe("my certificates boundary", () => {
  it("accepts issued metadata and pagination", () => {
    expect(
      myCertificatesSchema.safeParse({
        items: [item],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }).success,
    ).toBe(true);
  });
  it("rejects invalid certificate IDs and dates", () => {
    expect(
      myCertificatesSchema.safeParse({
        items: [{ ...item, id: "bad" }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }).success,
    ).toBe(false);
    expect(
      myCertificatesSchema.safeParse({
        items: [{ ...item, issuedAt: "yesterday" }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }).success,
    ).toBe(false);
  });
});
