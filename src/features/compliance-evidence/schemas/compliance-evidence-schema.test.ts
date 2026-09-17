import { describe, expect, it } from "vitest";
import { evidenceAssessmentsSchema } from "./compliance-evidence-schema";
describe("evidenceAssessmentsSchema", () => {
  it("rejects malformed backend data", () => { expect(() => evidenceAssessmentsSchema.parse({ items: [{ id: "bad" }], pagination: {} })).toThrow(); });
});
