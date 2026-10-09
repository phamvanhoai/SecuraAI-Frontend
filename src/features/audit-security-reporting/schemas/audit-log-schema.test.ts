import { describe, expect, it } from "vitest";
import {
  auditLogItemSchema,
  listAuditLogsQuerySchema,
  paginatedAuditLogsSchema,
} from "./audit-log-schema";

describe("auditLogItemSchema", () => {
  const validAuditLog = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    actorType: "USER",
    actorUserId: "550e8400-e29b-41d4-a716-446655440001",
    actorApiKeyId: null,
    actor: {
      id: "550e8400-e29b-41d4-a716-446655440001",
      type: "USER",
      name: "Admin User",
      email: "admin@securaai.internal",
      role: "ADMIN",
    },
    action: "UPDATE_USER_ROLE",
    resourceType: "users",
    resourceId: "550e8400-e29b-41d4-a716-446655440002",
    occurredAt: "2026-10-08T12:00:00.000Z",
    beforeData: { role: "EMPLOYEE" },
    afterData: { role: "SECURITY_OFFICER" },
    correlationId: "corr-12345",
    source: "web-ui",
    sourceIp: "192.168.1.100",
    userAgent: "Mozilla/5.0",
    previousHash: "prev-hash-123",
    recordHash: "rec-hash-456",
    createdAt: "2026-10-08T12:00:00.000Z",
  };

  it("successfully parses valid audit log item", () => {
    const result = auditLogItemSchema.safeParse(validAuditLog);
    expect(result.success).toBe(true);
  });

  it("fails when id is not a valid uuid", () => {
    const result = auditLogItemSchema.safeParse({
      ...validAuditLog,
      id: "invalid-id",
    });
    expect(result.success).toBe(false);
  });
});

describe("paginatedAuditLogsSchema", () => {
  it("parses valid paginated response", () => {
    const payload = {
      items: [],
      pagination: {
        page: 1,
        limit: 20,
        totalItems: 0,
        totalPages: 1,
      },
    };
    const result = paginatedAuditLogsSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

describe("listAuditLogsQuerySchema", () => {
  it("applies default values", () => {
    const result = listAuditLogsQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.sortBy).toBe("occurredAt");
    expect(result.sortOrder).toBe("desc");
  });
});
