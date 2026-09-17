import { describe, expect, it } from "vitest";
import {
  riskListQuerySchema,
  riskListResponseSchema,
} from "./risk-list-schema";
import { riskDetailSchema } from "./risk-detail-schema";
import {
  createRiskAssessmentRequestSchema,
  createRiskAssessmentSchema,
} from "./create-risk-assessment-schema";
import { updateRiskAssessmentRequestSchema } from "./update-risk-assessment-schema";
import { cancelRiskAssessmentRequestSchema } from "./cancel-risk-assessment-schema";

describe("risk list schemas", () => {
  it("uses ten rows and newest updates by default", () => {
    expect(riskListQuerySchema.parse({})).toMatchObject({
      page: 1,
      limit: 10,
      sortBy: "updatedAt",
      sortOrder: "desc",
    });
  });

  it("rejects an inverted assessment date range", () => {
    expect(() =>
      riskListQuerySchema.parse({
        assessedFrom: "2026-09-15",
        assessedTo: "2026-09-01",
      }),
    ).toThrow();
  });

  it("accepts an asset-backed assessment", () => {
    const result = riskListResponseSchema.safeParse({
      items: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          riskCode: "RSK-001",
          title: "Example",
          likelihood: 4,
          impact: 5,
          riskScore: 20,
          riskLevel: "critical",
          status: "approved",
          target: {
            type: "asset",
            id: "22222222-2222-4222-8222-222222222222",
            code: "AST-001",
            name: "Server",
            deleted: false,
          },
          assessedBy: null,
          hasTreatmentPlan: true,
          assessedAt: "2026-09-15T10:00:00.000Z",
          updatedAt: "2026-09-15T10:00:00.000Z",
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
    expect(result.success).toBe(true);
  });
});

describe("cancel risk assessment schema", () => {
  it("requires a meaningful reason and expected update timestamp", () => {
    expect(
      cancelRiskAssessmentRequestSchema.safeParse({
        reason: "No longer required",
        expectedUpdatedAt: "2026-09-15T10:00:00.000Z",
      }).success,
    ).toBe(true);
    expect(
      cancelRiskAssessmentRequestSchema.safeParse({
        reason: "Short",
        expectedUpdatedAt: "2026-09-15T10:00:00.000Z",
      }).success,
    ).toBe(false);
  });

  it("normalizes whitespace before validating the reason", () => {
    const parsed = cancelRiskAssessmentRequestSchema.safeParse({
      reason: "  Created\n  by mistake and no longer required.  ",
      expectedUpdatedAt: "2026-09-15T10:00:00.000Z",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success)
      expect(parsed.data.reason).toBe(
        "Created by mistake and no longer required.",
      );
    expect(
      cancelRiskAssessmentRequestSchema.safeParse({
        reason: "a         b",
        expectedUpdatedAt: "2026-09-15T10:00:00.000Z",
      }).success,
    ).toBe(false);
  });
});

describe("risk detail schema", () => {
  it("accepts a complete detail response with empty linked collections", () => {
    const timestamp = "2026-09-15T10:00:00.000Z";
    expect(
      riskDetailSchema.safeParse({
        assessment: {
          id: "11111111-1111-4111-8111-111111111111",
          riskCode: "RSK-001",
          title: "Example",
          description: null,
          status: "approved",
          assessedAt: timestamp,
          closedAt: null,
          createdAt: timestamp,
          updatedAt: timestamp,
          assessedBy: null,
          cancellation: null,
        },
        target: {
          type: "asset",
          id: "22222222-2222-4222-8222-222222222222",
          code: "AST-001",
          name: "Server",
          status: "active",
          deleted: false,
        },
        inherentRisk: {
          likelihood: 4,
          impact: 5,
          score: 20,
          level: "critical",
        },
        residualRisk: null,
        threats: [],
        vulnerabilities: [],
        treatmentPlans: [],
        previousAssessment: null,
      }).success,
    ).toBe(true);
  });
});

describe("create risk assessment schemas", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  it("requires the target selected by its type", () => {
    expect(
      createRiskAssessmentSchema.safeParse({
        targetType: "asset",
        assetId: "",
        title: "Valid risk",
        likelihood: 3,
        impact: 4,
        threatIds: [],
        vulnerabilityIds: [],
      }).success,
    ).toBe(false);
  });
  it("rejects server-owned and multiple target fields", () => {
    expect(
      createRiskAssessmentRequestSchema.safeParse({
        assetId: id,
        businessProcessId: id,
        title: "Valid risk",
        likelihood: 3,
        impact: 4,
        threats: [],
        vulnerabilities: [],
        status: "approved",
      }).success,
    ).toBe(false);
  });
});

describe("update risk assessment schema", () => {
  it("requires the expected update timestamp", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(
      updateRiskAssessmentRequestSchema.safeParse({
        assetId: id,
        title: "Updated risk",
        description: null,
        likelihood: 2,
        impact: 5,
        threats: [],
        vulnerabilities: [],
      }).success,
    ).toBe(false);
  });
});
