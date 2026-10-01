import { describe, expect, it } from "vitest";
import {
  incidentRiskOptionsSchema,
  linkIncidentRiskFormSchema,
} from "./incident-risk-schema";
describe("incident risk schemas", () => {
  it("requires a UUID risk selection", () => {
    expect(linkIncidentRiskFormSchema.safeParse({ riskId: "" }).success).toBe(
      false,
    );
    expect(
      linkIncidentRiskFormSchema.safeParse({
        riskId: "33333333-3333-4333-8333-333333333333",
      }).success,
    ).toBe(true);
  });
  it("parses risk options", () => {
    expect(
      incidentRiskOptionsSchema.safeParse({
        incident: {
          id: "22222222-2222-4222-8222-222222222222",
          incidentCode: "INC-001",
          title: "Login",
          status: "open",
        },
        risks: [
          {
            id: "33333333-3333-4333-8333-333333333333",
            riskCode: "RSK-001",
            title: "Credential compromise",
            status: "open",
            reviewDate: "2027-01-15T00:00:00.000Z",
            linked: false,
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }).success,
    ).toBe(true);
  });
});
