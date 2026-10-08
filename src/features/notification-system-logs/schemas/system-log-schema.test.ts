import { describe, expect, it } from "vitest";
import { systemLogSearchResponseSchema } from "./system-log-schema";

describe("systemLogSearchResponseSchema", () => {
  it("accepts a permission-scoped system log response", () => {
    const result = systemLogSearchResponseSchema.parse({
      items: [{
        id: "00000000-0000-4000-8000-000000000001",
        occurredAt: "2026-10-09T10:00:00.000Z",
        eventType: "USER_UPDATED",
        source: "User Management",
        actor: "Administrator",
        actorDetail: "admin@example.com",
        status: "SUCCESS",
        resourceType: "USER",
        correlationId: null,
        errorCode: null,
      }],
      pagination: { page: 1, limit: 20, total: 1, pageCount: 1 },
    });
    expect(result.items[0]?.eventType).toBe("USER_UPDATED");
  });

  it("rejects an unsupported processing status", () => {
    expect(() => systemLogSearchResponseSchema.parse({
      items: [{ id: "00000000-0000-4000-8000-000000000001", occurredAt: "2026-10-09T10:00:00.000Z", eventType: "TEST", source: "Test", actor: "System", actorDetail: null, status: "PENDING", resourceType: "TEST", correlationId: null, errorCode: null }],
      pagination: { page: 1, limit: 20, total: 1, pageCount: 1 },
    })).toThrow();
  });
});
