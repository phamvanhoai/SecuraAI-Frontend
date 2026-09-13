import { describe, expect, it } from "vitest";
import {
  aiAlertFeedbackSchema,
  aiAlertFeedbackListSchema,
  aiAlertListSchema,
  aiAlertExplanationSchema,
  confirmAiAlertResultSchema,
  confirmAiAlertSchema,
  evaluateAiAlertReliabilitySchema,
  markFalsePositiveSchema,
  markFalsePositiveResultSchema,
} from "./ai-alert-schema";

describe("aiAlertExplanationSchema", () => {
  it("accepts stored explanation text and JSON factors", () => {
    expect(aiAlertExplanationSchema.safeParse({
      id: "11111111-1111-4111-8111-111111111111",
      alertId: "22222222-2222-4222-8222-222222222222",
      explanationText: "The event exceeded its baseline.",
      featureContributions: { failedSignIns: 5 },
      baselineData: null,
      createdAt: "2026-09-13T00:00:00.000Z",
    }).success).toBe(true);
  });
});

const response = {
  items: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      alertCode: "AI-2026-001",
      anomalyScore: 0.92,
      riskScore: 8.5,
      riskLevel: "high",
      title: "Unusual authentication activity",
      description: "Multiple failed sign-ins were detected.",
      status: "new",
      detectedAt: "2026-09-11T03:00:00.000Z",
      asset: null,
      logSource: {
        id: "22222222-2222-4222-8222-222222222222",
        name: "Windows Authentication",
        sourceType: "authentication",
      },
      model: {
        id: "33333333-3333-4333-8333-333333333333",
        name: "anomaly-detector",
        version: "1.0.0",
        provider: "ollama",
      },
      event: {
        id: "44444444-4444-4444-8444-444444444444",
        eventType: "authentication.failed",
        eventTime: "2026-09-11T02:59:00.000Z",
      },
      createdAt: "2026-09-11T03:00:01.000Z",
    },
  ],
  serverTime: "2026-09-11T03:00:02.000Z",
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

describe("aiAlertListSchema", () => {
  it("accepts the backend alert list contract", () => {
    expect(aiAlertListSchema.safeParse(response).success).toBe(true);
  });
  it("accepts alerts without an AI risk suggestion", () => {
    expect(aiAlertListSchema.safeParse({
      ...response,
      items: [{ ...response.items[0], riskScore: null, riskLevel: null }],
    }).success).toBe(true);
  });
  it("rejects an unsupported alert status", () => {
    expect(
      aiAlertListSchema.safeParse({
        ...response,
        items: [{ ...response.items[0], status: "open" }],
      }).success,
    ).toBe(false);
  });
});

describe("confirmAiAlertSchema", () => {
  it("omits empty optional comments and trims a review comment", () => {
    expect(confirmAiAlertSchema.parse({ comment: "  " })).toEqual({
      comment: undefined,
    });
    expect(
      confirmAiAlertSchema.parse({ comment: "  Verified activity  " }),
    ).toEqual({ comment: "Verified activity" });
  });

  it("rejects oversized comments and validates the changed status", () => {
    expect(
      confirmAiAlertSchema.safeParse({ comment: "x".repeat(2001) }).success,
    ).toBe(false);
    expect(
      confirmAiAlertResultSchema.safeParse({
        id: "11111111-1111-4111-8111-111111111111",
        alertCode: "AI-2026-001",
        status: "confirmed",
        reviewedByUserId: "22222222-2222-4222-8222-222222222222",
        reviewedAt: "2026-09-13T00:00:00.000Z",
        changed: true,
      }).success,
    ).toBe(true);
    expect(
      confirmAiAlertResultSchema.safeParse({ status: "new" }).success,
    ).toBe(false);
  });
});

describe("mark false positive", () => {
  it("omits empty optional comments and trims a reason", () => {
    expect(markFalsePositiveSchema.parse({ comment: "  " })).toEqual({
      comment: undefined,
    });
    expect(
      markFalsePositiveSchema.parse({ comment: "  Known scanner  " }),
    ).toEqual({ comment: "Known scanner" });
  });

  it("enforces the comment limit and validates the status-changing response", () => {
    expect(
      markFalsePositiveSchema.safeParse({ comment: "x".repeat(2001) }).success,
    ).toBe(false);
    expect(
      markFalsePositiveResultSchema.safeParse({
        id: "11111111-1111-4111-8111-111111111111",
        alertCode: "AI-2026-001",
        status: "false_positive",
        reviewedByUserId: "22222222-2222-4222-8222-222222222222",
        reviewedAt: "2026-09-13T00:00:00.000Z",
        changed: true,
      }).success,
    ).toBe(true);
    expect(
      markFalsePositiveResultSchema.safeParse({ status: "new" }).success,
    ).toBe(false);
  });
});

describe("evaluateAiAlertReliabilitySchema", () => {
  it("normalizes an empty optional comment", () => {
    expect(
      evaluateAiAlertReliabilitySchema.parse({
        feedbackLabel: "confirmed_incident",
        comment: "   ",
      }),
    ).toEqual({ feedbackLabel: "confirmed_incident", comment: undefined });
  });

  it("rejects a missing assessment and an oversized comment", () => {
    expect(
      evaluateAiAlertReliabilitySchema.safeParse({
        feedbackLabel: "",
        comment: "x".repeat(2001),
      }).success,
    ).toBe(false);
  });

  it("accepts the backend feedback response", () => {
    expect(
      aiAlertFeedbackSchema.safeParse({
        id: "55555555-5555-4555-8555-555555555555",
        alertId: "11111111-1111-4111-8111-111111111111",
        reviewedByUserId: "66666666-6666-4666-8666-666666666666",
        feedbackLabel: "needs_review",
        comment: null,
        createdAt: "2026-09-13T03:00:00.000Z",
      }).success,
    ).toBe(true);
  });

  it("accepts paginated feedback including a system reviewer", () => {
    expect(
      aiAlertFeedbackListSchema.safeParse({
        items: [
          {
            id: "55555555-5555-4555-8555-555555555555",
            alertId: "11111111-1111-4111-8111-111111111111",
            reviewedByUserId: null,
            feedbackLabel: "false_positive",
            comment: "Automated review",
            createdAt: "2026-09-13T03:00:00.000Z",
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }).success,
    ).toBe(true);
  });
});
