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

  it("parses search and filter criteria", () => {
    const result = listAuditLogsQuerySchema.parse({
      page: 2,
      limit: 50,
      search: "incident review",
      actor: "sec-officer",
      actorType: "USER",
      action: "CONFIRM_INCIDENT",
      resourceType: "incidents",
      correlationId: "corr-789",
      startDate: "2026-10-01T00:00:00.000Z",
      endDate: "2026-10-09T00:00:00.000Z",
    });
    expect(result.search).toBe("incident review");
    expect(result.actor).toBe("sec-officer");
    expect(result.actorType).toBe("USER");
    expect(result.action).toBe("CONFIRM_INCIDENT");
    expect(result.resourceType).toBe("incidents");
    expect(result.correlationId).toBe("corr-789");
  });
});

describe("auditLogDiffSchema & computePropertyChanges", () => {
  it("computes property diff and identifies change types accurately", async () => {
    const { computePropertyChanges, auditLogDiffSchema } = await import(
      "./audit-log-schema"
    );

    const before = { role: "EMPLOYEE", status: "ACTIVE", tag: "old" };
    const after = { role: "SECURITY_OFFICER", status: "ACTIVE", level: 2 };

    const changes = computePropertyChanges(before, after);

    expect(changes).toEqual([
      { property: "level", changeType: "ADDED", beforeValue: null, afterValue: 2 },
      { property: "role", changeType: "MODIFIED", beforeValue: "EMPLOYEE", afterValue: "SECURITY_OFFICER" },
      { property: "status", changeType: "UNCHANGED", beforeValue: "ACTIVE", afterValue: "ACTIVE" },
      { property: "tag", changeType: "REMOVED", beforeValue: "old", afterValue: null },
    ]);

    const diffPayload = {
      id: "550e8400-e29b-41d4-a716-446655440000",
      action: "UPDATE_USER_ROLE",
      resourceType: "users",
      resourceId: "550e8400-e29b-41d4-a716-446655440001",
      occurredAt: "2026-10-08T12:00:00.000Z",
      totalProperties: 4,
      totalModified: 1,
      totalAdded: 1,
      totalRemoved: 1,
      totalUnchanged: 1,
      hasChanges: true,
      changes,
    };

    const parsed = auditLogDiffSchema.safeParse(diffPayload);
    expect(parsed.success).toBe(true);
  });
});

