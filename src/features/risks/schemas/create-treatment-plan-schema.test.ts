import { describe, expect, it } from "vitest";
import { createTreatmentPlanRequestSchema } from "./create-treatment-plan-schema";

const valid = {
  riskAssessmentId: "00000000-0000-4000-8000-000000000001",
  expectedRiskUpdatedAt: "2026-09-21T01:00:00.000Z",
  strategy: "mitigate" as const,
  description: "Reduce unauthorized access to the service.",
  ownerUserId: "00000000-0000-4000-8000-000000000002",
  targetDate: "2026-10-31",
  actions: [
    {
      title: "Enable multi-factor authentication",
      assignedToUserId: "00000000-0000-4000-8000-000000000003",
      dueDate: "2026-10-15",
    },
  ],
};

describe("createTreatmentPlanRequestSchema", () => {
  it("accepts a complete treatment plan", () => {
    expect(createTreatmentPlanRequestSchema.parse(valid).actions).toHaveLength(1);
  });

  it("requires actions for mitigation", () => {
    expect(() =>
      createTreatmentPlanRequestSchema.parse({ ...valid, actions: [] }),
    ).toThrow();
  });

  it("rejects action due dates after the plan target", () => {
    expect(() =>
      createTreatmentPlanRequestSchema.parse({
        ...valid,
        actions: [{ ...valid.actions[0], dueDate: "2026-11-01" }],
      }),
    ).toThrow();
  });
});
