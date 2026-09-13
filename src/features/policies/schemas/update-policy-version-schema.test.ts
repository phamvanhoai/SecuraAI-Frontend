import { describe, expect, it } from "vitest";
import {
  newPolicyVersionSchema,
  updatePolicyVersionFormSchema,
} from "./update-policy-version-schema";

const validForm = {
  policyId: "00000000-0000-4000-8000-000000000010",
  title: "",
  description: "",
  versionNumber: "1.1",
  content: "Updated policy content",
  changeSummary: "Added access review requirements",
};

describe("update policy version schemas", () => {
  it("normalizes the form and leaves blank optional policy fields unchanged", () => {
    expect(updatePolicyVersionFormSchema.parse(validForm)).toEqual({
      ...validForm,
      title: undefined,
      description: undefined,
    });
  });

  it("rejects an invalid policy ID and missing version content", () => {
    const result = updatePolicyVersionFormSchema.safeParse({
      ...validForm,
      policyId: "ISP-001",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a response that is not a newly-created draft version", () => {
    const result = newPolicyVersionSchema.safeParse({
      policyId: validForm.policyId,
      policyCode: "ISP-001",
      title: "Information Security Policy",
      description: null,
      ownerUserId: null,
      policyStatus: "published",
      version: {
        id: "00000000-0000-4000-8000-000000000011",
        versionNumber: "1.1",
        content: validForm.content,
        changeSummary: validForm.changeSummary,
        status: "published",
        createdByUserId: null,
        createdAt: "2026-09-13T00:00:00.000Z",
      },
      updatedAt: "2026-09-13T00:00:00.000Z",
    });
    expect(result.success).toBe(false);
  });
});
