import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/api-client", () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from "@/lib/api/api-client";
import { listAuditLogs } from "./audit-logs";

const sampleAuditItem = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  actorType: "USER" as const,
  actorUserId: "550e8400-e29b-41d4-a716-446655440001",
  actorApiKeyId: null,
  actor: {
    id: "550e8400-e29b-41d4-a716-446655440001",
    type: "USER" as const,
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

describe("audit logs API client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listAuditLogs calls /api/audit-logs with query params", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [sampleAuditItem],
      pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
    });

    const result = await listAuditLogs({
      page: 1,
      limit: 20,
    });

    expect(apiRequest).toHaveBeenCalledWith(
      "/api/audit-logs?page=1&limit=20",
      { target: "same-origin" },
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.action).toBe("UPDATE_USER_ROLE");
  });

  it("listAuditLogs serializes search, actor, action, resource, correlationId and date range", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [sampleAuditItem],
      pagination: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
    });

    await listAuditLogs({
      page: 2,
      limit: 10,
      search: "role update",
      actor: "admin",
      actorType: "USER",
      action: "UPDATE_USER_ROLE",
      resourceType: "users",
      correlationId: "corr-12345",
      startDate: "2026-10-01T00:00:00.000Z",
      endDate: "2026-10-08T23:59:59.000Z",
    });

    expect(apiRequest).toHaveBeenCalledWith(
      expect.stringContaining("search=role+update"),
      { target: "same-origin" },
    );
    expect(apiRequest).toHaveBeenCalledWith(
      expect.stringContaining("actor=admin"),
      { target: "same-origin" },
    );
    expect(apiRequest).toHaveBeenCalledWith(
      expect.stringContaining("actorType=USER"),
      { target: "same-origin" },
    );
    expect(apiRequest).toHaveBeenCalledWith(
      expect.stringContaining("correlationId=corr-12345"),
      { target: "same-origin" },
    );
  });

  it("getAuditLogDetail calls /api/audit-logs/:id", async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce(sampleAuditItem);

    const result = await (await import("./audit-logs")).getAuditLogDetail(
      "550e8400-e29b-41d4-a716-446655440000",
    );

    expect(apiRequest).toHaveBeenCalledWith(
      "/api/audit-logs/550e8400-e29b-41d4-a716-446655440000",
      { target: "same-origin" },
    );
    expect(result.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(result.action).toBe("UPDATE_USER_ROLE");
  });
});

