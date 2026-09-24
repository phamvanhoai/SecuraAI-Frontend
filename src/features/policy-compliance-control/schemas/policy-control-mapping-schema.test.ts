import { describe, expect, it } from "vitest";
import {
  policyControlMappingQuerySchema,
  replacePolicyControlMappingsRequestSchema,
} from "./policy-control-mapping-schema";

describe("policy control mapping schemas", () => {
  it("uses bounded pagination defaults", () => {
    expect(policyControlMappingQuerySchema.parse({})).toEqual({
      page: 1,
      limit: 20,
    });
    expect(() =>
      policyControlMappingQuerySchema.parse({ limit: 101 }),
    ).toThrow();
  });

  it("validates control mapping identifiers", () => {
    expect(() =>
      replacePolicyControlMappingsRequestSchema.parse({
        mappings: [{ controlId: "bad" }],
      }),
    ).toThrow();
  });
});
