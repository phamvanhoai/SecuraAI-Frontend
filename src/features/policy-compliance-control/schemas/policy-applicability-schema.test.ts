import { describe, expect, it } from "vitest";
import {
  definePolicyApplicabilitySchema,
  policyApplicabilitySchema,
} from "./policy-applicability-schema";

describe("policy applicability schemas", () => {
  it("accepts a department and documented basis", () => {
    expect(
      definePolicyApplicabilitySchema.safeParse({
        departmentIds: ["773d8356-e68c-421b-9ce3-29ea4601970f"],
        roleCodes: [],
        userGroups: [],
        organizationalScope: null,
        rationale:
          "This department processes information covered by the policy.",
        referenceBasis: "ISO/IEC 27001",
      }).success,
    ).toBe(true);
  });

  it("rejects an undocumented empty scope", () => {
    expect(
      definePolicyApplicabilitySchema.safeParse({
        departmentIds: [],
        roleCodes: [],
        userGroups: [],
        organizationalScope: null,
        rationale: "Too short",
        referenceBasis: "ISO",
      }).success,
    ).toBe(false);
  });

  it("validates the backend response boundary", () => {
    expect(
      policyApplicabilitySchema.safeParse({
        policyId: "f249f96c-7a87-47e2-a6fd-2bebc29294c5",
        versionId: "ec178d52-2959-47fd-93db-aa693158668c",
        policyCode: "POL-1",
        title: "Access policy",
        editable: true,
        applicability: null,
        options: { departments: [], roles: ["EMPLOYEE"] },
      }).success,
    ).toBe(true);
  });
});
