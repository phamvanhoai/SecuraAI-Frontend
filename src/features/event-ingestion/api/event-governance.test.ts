import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/lib/api/api-client";
import {
  getEventGovernanceLifecycleSummary,
  getEventGovernancePolicy,
  listEventGovernancePolicies,
} from "./event-governance";

vi.mock("@/lib/api/api-client", () => ({
  apiRequest: vi.fn(),
}));

describe("eventGovernance api client", () => {
  const samplePolicy = {
    id: "7d191192-3490-410a-ba53-3a72d3f92d44",
    name: "Authentication Retention Policy",
    purpose: "Retain authentication logs",
    eventFamily: "AUTHENTICATION" as const,
    retentionDays: 90,
    accessScope: "SECURITY_OPERATIONS",
    maskingRules: { maskIp: true },
    exportAllowed: true,
    archiveAfterDays: 30,
    deletionEnabled: true,
    status: "ACTIVE" as const,
    createdBy: {
      id: "9a9bf33a-02db-48e4-a8ad-90517278d7f2",
      name: "Admin User",
      email: "admin@securaai.internal",
    },
    updatedBy: {
      id: "9a9bf33a-02db-48e4-a8ad-90517278d7f2",
      name: "Admin User",
      email: "admin@securaai.internal",
    },
    createdAt: "2026-10-01T08:00:00.000Z",
    updatedAt: "2026-10-01T08:00:00.000Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listEventGovernancePolicies", () => {
    it("calls endpoint with query parameters and returns parsed paginated data", async () => {
      vi.mocked(apiRequest).mockResolvedValue({
        items: [samplePolicy],
        pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
      });

      const result = await listEventGovernancePolicies({
        page: 1,
        limit: 20,
        eventFamily: "AUTHENTICATION",
        status: "ACTIVE",
        search: "auth",
      });

      expect(apiRequest).toHaveBeenCalledWith(
        "/api/event-governance/policies?page=1&limit=20&search=auth&eventFamily=AUTHENTICATION&status=ACTIVE",
        { target: "same-origin", method: "GET" },
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe("Authentication Retention Policy");
    });
  });

  describe("getEventGovernancePolicy", () => {
    it("fetches single policy detail by id", async () => {
      vi.mocked(apiRequest).mockResolvedValue(samplePolicy);

      const result = await getEventGovernancePolicy(samplePolicy.id);

      expect(apiRequest).toHaveBeenCalledWith(
        `/api/event-governance/policies/${samplePolicy.id}`,
        { target: "same-origin", method: "GET" },
      );
      expect(result.id).toBe(samplePolicy.id);
      expect(result.retentionDays).toBe(90);
    });
  });

  describe("getEventGovernanceLifecycleSummary", () => {
    it("fetches lifecycle metrics summary", async () => {
      const sampleSummary = {
        totalPolicies: 3,
        activePolicies: 3,
        inactivePolicies: 0,
        minRetentionDays: 30,
        maxRetentionDays: 365,
        avgRetentionDays: 161,
        policiesWithArchival: 2,
        policiesWithAutomatedDeletion: 3,
        exportAllowedCount: 2,
      };

      vi.mocked(apiRequest).mockResolvedValue(sampleSummary);

      const result = await getEventGovernanceLifecycleSummary();

      expect(apiRequest).toHaveBeenCalledWith(
        "/api/event-governance/policies/summary",
        { target: "same-origin", method: "GET" },
      );
      expect(result.totalPolicies).toBe(3);
      expect(result.minRetentionDays).toBe(30);
    });
  });
});
