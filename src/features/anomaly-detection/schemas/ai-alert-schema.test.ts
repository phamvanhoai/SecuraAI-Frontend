import { describe, expect, it } from "vitest";
import { aiAlertListSchema } from "./ai-alert-schema";

const response = {
  items: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      alertCode: "AI-2026-001",
      anomalyScore: 0.92,
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
  it("rejects an unsupported alert status", () => {
    expect(
      aiAlertListSchema.safeParse({
        ...response,
        items: [{ ...response.items[0], status: "open" }],
      }).success,
    ).toBe(false);
  });
});
