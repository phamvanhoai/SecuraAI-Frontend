import { describe, expect, it } from "vitest";
import {
  createPolicyDraftSchema,
  policyDraftQuerySchema,
  updatePolicyDraftSchema,
} from "./policy-draft-schema";

describe("policy draft schemas", () => {
  it("normalizes a valid draft like the backend DTO", () => {
    expect(
      createPolicyDraftSchema.parse({
        policyCode: " pol-sec-001 ",
        title: " Chính sách an toàn thông tin ",
        description: " Phạm vi áp dụng ",
        versionNumber: " 1.0 ",
        content: " Nội dung chính sách ",
      }),
    ).toEqual({
      policyCode: "POL-SEC-001",
      title: "Chính sách an toàn thông tin",
      description: "Phạm vi áp dụng",
      versionNumber: "1.0",
      content: "Nội dung chính sách",
    });
  });

  it("rejects an invalid code and empty policy content", () => {
    expect(
      createPolicyDraftSchema.safeParse({
        policyCode: "bad code",
        title: "Chính sách",
        versionNumber: "1.0",
        content: "",
      }).success,
    ).toBe(false);
  });

  it("applies bounded list defaults and accepts editable draft fields", () => {
    expect(policyDraftQuerySchema.parse({})).toEqual({
      page: 1,
      limit: 20,
      sortOrder: "desc",
    });
    expect(
      updatePolicyDraftSchema.safeParse({
        title: "Chính sách cập nhật",
        description: null,
        versionNumber: "1.1",
        content: "Nội dung mới",
        changeSummary: "Bổ sung phạm vi",
      }).success,
    ).toBe(true);
  });
});
