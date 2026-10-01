import { describe, expect, it } from "vitest";
import {
  riskRegisterDetailSchema,
  riskRegisterQuerySchema,
  riskRegisterResponseSchema,
} from "./risk-register-schema";

const now = "2026-09-29T00:00:00.000Z";
const item = {
  id: "00000000-0000-4000-8000-000000000001",
  riskCode: "RSK-001",
  title: "Privileged access",
  description: null,
  status: "open",
  owner: null,
  reviewDate: null,
  assets: [],
  latestAssessment: null,
  linkedCounts: { controls: 0, treatmentPlans: 0, incidents: 0 },
  activeTreatmentPlan: null,
  createdAt: now,
  updatedAt: now,
};

describe("risk register contracts", () => {
  it("normalizes bounded filters", () => {
    expect(
      riskRegisterQuerySchema.parse({ q: " access ", page: "2" }),
    ).toMatchObject({ q: "access", page: 2, limit: 10, sortBy: "updatedAt" });
  });
  it("rejects invalid ranges", () => {
    expect(riskRegisterQuerySchema.safeParse({ limit: 101 }).success).toBe(
      false,
    );
    expect(
      riskRegisterQuerySchema.safeParse({
        reviewFrom: "2026-10-02",
        reviewTo: "2026-10-01",
      }).success,
    ).toBe(false);
  });
  it("accepts V2 list and detail envelopes", () => {
    expect(
      riskRegisterResponseSchema.safeParse({
        items: [item],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }).success,
    ).toBe(true);
    expect(
      riskRegisterDetailSchema.safeParse({
        ...item,
        createdBy: null,
        assessments: [],
        threats: [],
        vulnerabilities: [],
        controls: [],
        treatmentPlans: [],
        incidents: [],
        acceptances: [],
      }).success,
    ).toBe(true);
  });
});
