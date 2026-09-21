import { describe, expect, it } from "vitest";
import { issuedCertificatesSchema } from "./issued-certificates-schema";

const response = {
  items: [
    {
      id: "00000000-0000-4000-8000-000000000001",
      number: "SEC-TR-123",
      issuedAt: "2026-09-20T00:00:00.000Z",
      issuedBy: "Officer",
      enrollmentId: "00000000-0000-4000-8000-000000000002",
      completedAt: "2026-09-19T00:00:00.000Z",
      learner: {
        name: "Employee One",
        email: "employee@example.com",
        employeeCode: "E001",
        department: "Operations",
      },
      campaignTitle: "Autumn",
      courseTitle: "Phishing",
    },
  ],
  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
};

describe("issued certificates boundary", () => {
  it("accepts learner and certificate metadata", () => {
    expect(issuedCertificatesSchema.safeParse(response).success).toBe(true);
  });

  it("rejects an invalid learner email", () => {
    expect(
      issuedCertificatesSchema.safeParse({
        ...response,
        items: [
          {
            ...response.items[0],
            learner: { ...response.items[0]?.learner, email: "bad" },
          },
        ],
      }).success,
    ).toBe(false);
  });
});
