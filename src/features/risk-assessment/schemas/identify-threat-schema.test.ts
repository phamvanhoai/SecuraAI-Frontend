import { describe, expect, it } from "vitest";
import { identifyThreatSchema } from "./identify-threat-schema";

describe("identify threat form", () => {
  it("accepts a threat linked to a vulnerability", () => {
    expect(
      identifyThreatSchema.safeParse({
        name: "Credential stuffing",
        description:
          "An attacker reuses exposed credentials against the portal.",
        vulnerabilityIds: ["00000000-0000-4000-8000-000000000001"],
      }).success,
    ).toBe(true);
  });
  it("rejects a threat without vulnerability links", () => {
    expect(
      identifyThreatSchema.safeParse({
        name: "Phishing",
        description: "A targeted phishing campaign.",
        vulnerabilityIds: [],
      }).success,
    ).toBe(false);
  });
});
