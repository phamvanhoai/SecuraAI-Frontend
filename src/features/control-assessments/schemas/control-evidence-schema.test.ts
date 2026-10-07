import { describe, expect, it } from "vitest";
import {
  addControlEvidenceSchema,
  controlEvidenceListSchema,
  evidenceDocumentUrlSchema,
  linkControlEvidenceSchema,
  listControlEvidenceQuerySchema,
} from "./control-evidence-schema";
const body = {
  requestId: "00000000-0000-4000-8000-000000000001",
  name: "MFA test",
  source: "MFA test report",
  description: "Ten administrative accounts were tested",
  documentUrl: "https://docs.example.test/mfa",
  collectedAt: "2020-01-01T00:00:00Z",
  validUntil: null,
};
describe("Control Evidence reference contract", () => {
  it("accepts metadata/reference without inventing an uploaded file or review", () =>
    expect(addControlEvidenceSchema.parse(body)).toEqual(body));
  it.each([
    "http://docs.example.test/mfa",
    "javascript:alert(1)",
    "file:///D:/mfa",
    "https://user:secret@docs.example.test/mfa",
    "https://docs.example.test/a\nb",
    "https://docs.example.test/a b",
  ])("rejects unsafe URLs %s", (documentUrl) =>
    expect(
      addControlEvidenceSchema.safeParse({ ...body, documentUrl }).success,
    ).toBe(false),
  );
  it("normalizes stable document references", () =>
    expect(
      evidenceDocumentUrlSchema.parse(" https://DOCS.example.test:443/mfa "),
    ).toBe(body.documentUrl));
  it("rejects missing description, invalid collection and reversed validity", () => {
    expect(
      addControlEvidenceSchema.safeParse({ ...body, description: " " }).success,
    ).toBe(false);
    expect(
      addControlEvidenceSchema.safeParse({ ...body, collectedAt: "yesterday" })
        .success,
    ).toBe(false);
    expect(
      addControlEvidenceSchema.safeParse({
        ...body,
        validUntil: "2019-12-31T23:59:59Z",
      }).success,
    ).toBe(false);
  });
  it.each([
    "ownerUserId",
    "reviewedAt",
    "reviewedBy",
    "status",
    "effectiveness",
    "fileSize",
    "integrityHash",
  ])("rejects client-controlled %s", (key) =>
    expect(
      addControlEvidenceSchema.safeParse({ ...body, [key]: "fake" }).success,
    ).toBe(false),
  );
  it("requires link relevance and accepts no unrelated edits", () => {
    expect(
      linkControlEvidenceSchema.safeParse({
        evidenceId: body.requestId,
        reason: " ",
      }).success,
    ).toBe(false);
    expect(
      linkControlEvidenceSchema.safeParse({
        evidenceId: body.requestId,
        reason: "Tests the MFA control",
        documentUrl: body.documentUrl,
      }).success,
    ).toBe(false);
  });
  it("limits search to 10 results/page and bounded query", () => {
    expect(listControlEvidenceQuerySchema.parse({})).toEqual({
      page: 1,
      limit: 10,
      q: "",
      view: "linked",
    });
    expect(
      listControlEvidenceQuerySchema.safeParse({ limit: 11 }).success,
    ).toBe(false);
    expect(
      listControlEvidenceQuerySchema.safeParse({ q: "a".repeat(101) }).success,
    ).toBe(false);
    expect(controlEvidenceListSchema.safeParse({ items: [] }).success).toBe(
      false,
    );
  });
});
