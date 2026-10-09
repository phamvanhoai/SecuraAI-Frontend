import { describe, expect, it } from "vitest";
import {
  eventGovernanceLifecycleSummarySchema,
  eventGovernancePolicySchema,
  paginatedEventGovernancePoliciesSchema,
} from "./event-governance-schema";

describe("eventGovernancePolicySchema", () => {
  const validPolicy = {
    id: "7d191192-3490-410a-ba53-3a72d3f92d44",
    name: "Authentication Log Retention Policy",
    purpose: "Ensure authentication records are retained for compliance",
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

  it("parses valid event governance policy", () => {
    const result = eventGovernancePolicySchema.safeParse(validPolicy);
    expect(result.success).toBe(true);
  });

  it("accepts null eventFamily, accessScope, and maskingRules", () => {
    const minimalPolicy = {
      ...validPolicy,
      eventFamily: null,
      accessScope: null,
      maskingRules: null,
      archiveAfterDays: null,
      createdBy: null,
      updatedBy: null,
    };
    const result = eventGovernancePolicySchema.safeParse(minimalPolicy);
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const invalid = { ...validPolicy, status: "UNKNOWN" };
    const result = eventGovernancePolicySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("parses paginated event governance policies list", () => {
    const paginated = {
      items: [validPolicy],
      pagination: {
        page: 1,
        limit: 20,
        totalItems: 1,
        totalPages: 1,
      },
    };
    const result = paginatedEventGovernancePoliciesSchema.safeParse(paginated);
    expect(result.success).toBe(true);
  });

  it("parses lifecycle summary schema", () => {
    const summary = {
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
    const result = eventGovernanceLifecycleSummarySchema.safeParse(summary);
    expect(result.success).toBe(true);
  });
});
