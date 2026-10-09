import { describe, expect, it } from "vitest";
import {
  assignIncidentFormSchema,
  updateIncidentProgressFormSchema,
  incidentEvidenceListSchema,
  incidentDetailSchema,
  incidentSchema,
  removeIncidentEvidenceFormSchema,
  classifyIncidentFormSchema,
  reportIncidentFormSchema,
} from "./report-incident-schema";
describe("reportIncidentFormSchema", () => {
  it("accepts a complete report", () =>
    expect(
      reportIncidentFormSchema.safeParse({
        creationMode: "source",
        sourceId: "22222222-2222-4222-8222-222222222222",
        title: "Suspicious email",
        description:
          "The sender requested credentials through an unknown link.",
        severity: "high",
        occurredAt: "",
      }).success,
    ).toBe(true));
  it("requires a useful description", () =>
    expect(
      reportIncidentFormSchema.safeParse({
        creationMode: "source",
        sourceId: "22222222-2222-4222-8222-222222222222",
        title: "Suspicious email",
        description: "Too short",
        severity: "high",
        occurredAt: "",
      }).success,
    ).toBe(false));

  it("accepts a manual incident without a source", () =>
    expect(
      reportIncidentFormSchema.safeParse({
        creationMode: "manual",
        sourceId: "",
        title: "Unreported physical security incident",
        description:
          "A security officer observed unauthorized access without an existing alert or finding.",
        severity: "medium",
        occurredAt: "",
      }).success,
    ).toBe(true));

  it("requires a source for source-based creation", () =>
    expect(
      reportIncidentFormSchema.safeParse({
        creationMode: "source",
        sourceId: "",
        title: "Confirmed suspicious activity",
        description:
          "The confirmed activity requires incident investigation and response.",
        severity: "high",
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
describe("incidentDetailSchema", () => {
  it("accepts affected assets, response actions and handling history", () => {
    const parsed = incidentDetailSchema.parse({
      id: "22222222-2222-4222-8222-222222222222",
      incidentCode: "INC-2026-001",
      title: "Suspicious administrative login",
      description: "An unexpected privileged login was detected.",
      category: null,
      severity: "high",
      status: "triage",
      occurredAt: "2026-09-30T00:00:00.000Z",
      detectedAt: "2026-09-30T00:00:00.000Z",
      confirmedAt: "2026-09-30T00:15:00.000Z",
      closedAt: null,
      createdAt: "2026-09-30T00:00:00.000Z",
      updatedAt: "2026-09-30T01:00:00.000Z",
      classified: true,
      classificationCount: 0,
      lastClassification: null,
      currentAssignment: null,
      createdBy: null,
      relatedCounts: { actions: 1, assets: 1, controls: 0, evidence: 0, risks: 0 },
      affectedAssets: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          assetCode: "AST-001",
          name: "Identity gateway",
          assetType: "Application",
          criticality: "HIGH",
          status: "active",
          linkedAt: "2026-09-30T00:30:00.000Z",
          linkedBy: null,
        },
      ],
      responseActions: [
        {
          id: "44444444-4444-4444-8444-444444444444",
          phase: "containment",
          description: "Disabled the affected privileged account.",
          performedAt: "2026-09-30T01:00:00.000Z",
          performedBy: null,
        },
      ],
      handlingHistory: [
        {
          id: "reported-22222222-2222-4222-8222-222222222222",
          type: "reported",
          description: "Incident report created",
          occurredAt: "2026-09-30T00:00:00.000Z",
          actor: null,
          phase: null,
        },
      ],
    });
    expect(parsed.affectedAssets[0]?.assetCode).toBe("AST-001");
    expect(parsed.responseActions[0]?.phase).toBe("containment");
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
