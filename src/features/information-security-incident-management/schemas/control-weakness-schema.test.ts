import { describe, expect, it } from "vitest";
import {
  controlWeaknessHistorySchema,
  recordControlWeaknessFormSchema,
} from "./control-weakness-schema";
describe("control weakness schema", () => {
  it("requires a linked control and meaningful description", () => {
    expect(
      recordControlWeaknessFormSchema.safeParse({
        controlId: "",
        severity: "high",
        description: "too short",
      }).success,
    ).toBe(false);
    expect(
      recordControlWeaknessFormSchema.safeParse({
        controlId: "33333333-3333-4333-8333-333333333333",
        severity: "high",
        description: "MFA was not enforced for the affected account.",
      }).success,
    ).toBe(true);
  });
});

describe("control weakness history schema", () => {
  it("accepts an auditable paginated history item", () => {
    const result = controlWeaknessHistorySchema.parse({
      incident: {
        id: "11111111-1111-4111-8111-111111111111",
        incidentCode: "INC-1",
        title: "Privileged login failure",
      },
      items: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          severity: "high",
          description: "MFA was not enforced for the affected account.",
          status: "open",
          identifiedAt: "2026-10-01T02:00:00.000Z",
          resolvedAt: null,
          control: {
            id: "33333333-3333-4333-8333-333333333333",
            controlCode: "CTRL-1",
            name: "MFA",
          },
          identifiedBy: {
            id: "44444444-4444-4444-8444-444444444444",
            fullName: "Security Officer",
          },
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    expect(result.items[0]?.identifiedBy.fullName).toBe("Security Officer");
  });
});
