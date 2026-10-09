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
});
