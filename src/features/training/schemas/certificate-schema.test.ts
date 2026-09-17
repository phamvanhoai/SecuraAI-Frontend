import { describe, expect, it } from "vitest";
import { trainingCertificateSchema } from "./certificate-schema";
const value = {
  enrollmentId: "00000000-0000-4000-8000-000000000001",
  learnerName: "Employee",
  courseTitle: "Course",
  campaignTitle: "Campaign",
  completedAt: null,
  eligible: false,
  certificate: null,
};
describe("training certificate boundary", () => {
  it("accepts an enrollment without a certificate", () =>
    expect(trainingCertificateSchema.safeParse(value).success).toBe(true));
  it("rejects untrusted identifiers and invalid dates", () => {
    expect(
      trainingCertificateSchema.safeParse({ ...value, enrollmentId: "bad" })
        .success,
    ).toBe(false);
    expect(
      trainingCertificateSchema.safeParse({
        ...value,
        completedAt: "yesterday",
      }).success,
    ).toBe(false);
  });
});
