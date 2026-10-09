import { describe, expect, it } from "vitest";
import {
  incidentControlOptionsSchema,
  linkIncidentControlFormSchema,
} from "./incident-control-schema";

describe("incident control schemas", () => {
  it("requires a UUID control selection", () => {
    expect(
      linkIncidentControlFormSchema.safeParse({ controlId: "" }).success,
    ).toBe(false);
    expect(
      linkIncidentControlFormSchema.safeParse({
        controlId: "33333333-3333-4333-8333-333333333333",
      }).success,
    ).toBe(true);
  });
  it("parses control options with link state", () => {
    const result = incidentControlOptionsSchema.safeParse({
      incident: {
        id: "22222222-2222-4222-8222-222222222222",
        incidentCode: "INC-001",
        title: "Suspicious login",
        status: "open",
      },
      controls: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          controlCode: "CTRL-001",
          name: "MFA",
          applicability: "applicable",
          implementationStatus: "implemented",
          linked: false,
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(result.success).toBe(true);
  });
});
