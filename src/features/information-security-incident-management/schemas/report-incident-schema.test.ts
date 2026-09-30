import { describe, expect, it } from "vitest";
import {
  assignIncidentFormSchema,
  updateIncidentProgressFormSchema,
  incidentEvidenceListSchema,
  incidentSchema,
  removeIncidentEvidenceFormSchema,
  classifyIncidentFormSchema,
  reportIncidentFormSchema,
} from "./report-incident-schema";
describe("reportIncidentFormSchema", () => {
  it("accepts a complete report", () =>
    expect(
      reportIncidentFormSchema.safeParse({
        title: "Suspicious email",
        description:
          "The sender requested credentials through an unknown link.",
        category: "phishing",
        occurredAt: "",
      }).success,
    ).toBe(true));
  it("requires a useful description", () =>
    expect(
      reportIncidentFormSchema.safeParse({
        title: "Suspicious email",
        description: "Too short",
        category: "phishing",
        occurredAt: "",
      }).success,
    ).toBe(false));
});
describe("incidentSchema", () => {
  it("accepts V2 incident list and detail records", () => {
    const parsed = incidentSchema.parse({
      id: "22222222-2222-4222-8222-222222222222",
      incidentCode: "INC-2026-001",
      title: "Suspicious administrative login",
      description: "An unexpected privileged login was detected.",
      category: null,
      severity: "high",
      status: "triage",
      occurredAt: "2026-09-30T00:00:00.000Z",
      detectedAt: "2026-09-30T00:00:00.000Z",
      confirmedAt: null,
      closedAt: null,
      createdAt: "2026-09-30T00:00:00.000Z",
      updatedAt: "2026-09-30T00:00:00.000Z",
      classified: true,
      classificationCount: 0,
      lastClassification: null,
      currentAssignment: null,
      createdBy: {
        id: "33333333-3333-4333-8333-333333333333",
        name: "Security Officer",
        email: "officer@example.com",
      },
      relatedCounts: {
        actions: 1,
        assets: 2,
        controls: 3,
        evidence: 4,
        risks: 1,
      },
    });
    expect(parsed.relatedCounts.evidence).toBe(4);
  });
});
describe("classifyIncidentFormSchema", () => {
  it("accepts an approved severity with rationale", () =>
    expect(
      classifyIncidentFormSchema.safeParse({
        severity: "high",
        rationale:
          "The incident affects a production service and remains active.",
      }).success,
    ).toBe(true));
  it("rejects unsupported severity", () =>
    expect(
      classifyIncidentFormSchema.safeParse({
        severity: "urgent",
        rationale:
          "The incident affects a production service and remains active.",
      }).success,
    ).toBe(false));
});
describe("assignIncidentFormSchema", () => {
  it("requires an eligible user identifier and documented reason", () => {
    expect(
      assignIncidentFormSchema.safeParse({
        assigneeUserId: "22222222-2222-4222-8222-222222222222",
        note: "Assign to the officer responsible for endpoint response.",
      }).success,
    ).toBe(true);
    expect(
      assignIncidentFormSchema.safeParse({ assigneeUserId: "", note: "short" })
        .success,
    ).toBe(false);
  });
});
describe("updateIncidentProgressFormSchema", () => {
  it("requires a supported next status and meaningful progress note", () => {
    expect(
      updateIncidentProgressFormSchema.safeParse({
        status: "resolved",
        note: "Containment is complete and validation found no remaining exposure.",
      }).success,
    ).toBe(true);
    expect(
      updateIncidentProgressFormSchema.safeParse({
        status: "assigned",
        note: "short",
      }).success,
    ).toBe(false);
  });
});
describe("incidentEvidenceListSchema", () => {
  it("rejects malformed evidence metadata", () => {
    expect(() =>
      incidentEvidenceListSchema.parse({ items: [{ id: "invalid" }] }),
    ).toThrow();
  });
  it("accepts paginated evidence metadata", () => {
    expect(
      incidentEvidenceListSchema.parse({
        items: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      }).pagination.total,
    ).toBe(0);
  });
});
describe("removeIncidentEvidenceFormSchema", () => {
  it("requires a meaningful audit reason", () => {
    expect(
      removeIncidentEvidenceFormSchema.parse({
        reason: "  Uploaded to the wrong incident.  ",
      }),
    ).toEqual({ reason: "Uploaded to the wrong incident." });
    expect(
      removeIncidentEvidenceFormSchema.safeParse({ reason: "mistake" }).success,
    ).toBe(false);
  });
});
