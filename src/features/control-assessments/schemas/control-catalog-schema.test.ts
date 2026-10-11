import { describe, expect, it } from "vitest";
import {
  createControlSchema,
  editControlSchema,
  controlOwnersSchema,
} from "./control-catalog-schema";
const body = {
  controlCode: "CTRL-MFA",
  name: "Administrator MFA",
  description: "Require MFA for privileged access",
  ownerUserId: null,
  applicability: "under_review",
  implementationStatus: "not_implemented",
};
describe("Control catalog contract", () => {
  it("accepts an unassigned control without manufacturing an assessment", () =>
    expect(createControlSchema.parse(body)).toEqual(body));
  it.each([
    { controlCode: "bad code" },
    { name: " " },
    { description: "short" },
    { applicability: "bad" },
    { ownerUserId: "bad" },
    { effectiveness: 100 },
    { evidenceIds: [] },
    { riskId: "risk" },
  ])("rejects invalid or unrelated fields %j", (value) =>
    expect(createControlSchema.safeParse({ ...body, ...value }).success).toBe(
      false,
    ),
  );
  it("requires a reason and both version fields and rejects an editable code", () => {
    const { controlCode: _code, ...fields } = body;
    expect(_code).toBe("CTRL-MFA");
    const edit = {
      ...fields,
      reason: "Correct the description",
      expectedUpdatedAt: "2026-10-07T00:00:00Z",
      expectedRevision: "a".repeat(64),
    };
    expect(editControlSchema.safeParse(edit).success).toBe(true);
    expect(
      editControlSchema.safeParse({ ...edit, controlCode: "NEW" }).success,
    ).toBe(false);
    expect(editControlSchema.safeParse({ ...edit, reason: " " }).success).toBe(
      false,
    );
    expect(
      editControlSchema.safeParse({ ...edit, expectedRevision: undefined })
        .success,
    ).toBe(false);
  });
  it("bounds owner responses to ten results", () =>
    expect(
      controlOwnersSchema.safeParse({
        items: Array.from({ length: 11 }, () => ({
          id: "00000000-0000-4000-8000-000000000001",
          fullName: "Demo owner",
        })),
      }).success,
    ).toBe(false));
});
