import { describe, expect, it } from "vitest";
import {
  registerEventSourceFormSchema,
  updateEventSourceFormSchema,
  eventSourceResponseSchema,
  eventSourceListQuerySchema,
  paginatedEventSourcesSchema,
  eventSourceDetailResponseSchema,
} from "./event-source-schema";

describe("registerEventSourceFormSchema", () => {
  it("validates a complete API event source configuration", () => {
    const valid = {
      name: "Wazuh Production SIEM",
      sourceType: "WAZUH",
      endpoint: "https://wazuh.internal.corp:55000",
      ingestionMethod: "API",
      authenticationType: "BEARER_TOKEN",
      status: "ACTIVE",
      description: "Production event stream",
      eventFamilies: ["AUTHENTICATION", "VPN_SSO"],
    };

    const parsed = registerEventSourceFormSchema.parse(valid);
    expect(parsed.name).toBe("Wazuh Production SIEM");
    expect(parsed.ingestionMethod).toBe("API");
    expect(parsed.eventFamilies).toHaveLength(2);
  });

  it("validates a FILE ingestion source without endpoint", () => {
    const valid = {
      name: "Syslog Batch Upload",
      sourceType: "SYSLOG",
      ingestionMethod: "FILE",
      status: "ACTIVE",
      eventFamilies: ["APPLICATION_ACCESS"],
    };

    const parsed = registerEventSourceFormSchema.parse(valid);
    expect(parsed.name).toBe("Syslog Batch Upload");
    expect(parsed.ingestionMethod).toBe("FILE");
  });

  it("fails when API ingestion has empty endpoint", () => {
    const invalid = {
      name: "Wazuh SIEM",
      sourceType: "WAZUH",
      endpoint: "  ",
      ingestionMethod: "API",
      eventFamilies: ["AUTHENTICATION"],
    };

    expect(() => registerEventSourceFormSchema.parse(invalid)).toThrow(
      /Connection endpoint is required/i,
    );
  });

  it("fails when eventFamilies is empty", () => {
    const invalid = {
      name: "Wazuh SIEM",
      sourceType: "WAZUH",
      endpoint: "https://wazuh.local",
      ingestionMethod: "API",
      eventFamilies: [],
    };

    expect(() => registerEventSourceFormSchema.parse(invalid)).toThrow(
      /Select at least one event family/i,
    );
  });
});

describe("eventSourceResponseSchema", () => {
  it("validates a complete response object", () => {
    const response = {
      id: "3a9bf33a-02db-48e4-a8ad-90517278d7f2",
      name: "Wazuh SIEM",
      sourceType: "WAZUH",
      endpoint: "https://wazuh.local:55000",
      ingestionMethod: "API",
      authenticationType: "BEARER_TOKEN",
      status: "ACTIVE",
      description: "Test description",
      eventFamilies: ["AUTHENTICATION", "VPN_SSO"],
      createdBy: "9a9bf33a-02db-48e4-a8ad-90517278d7f2",
      createdAt: "2026-09-27T10:00:00Z",
      updatedAt: "2026-09-27T10:00:00Z",
    };

    const parsed = eventSourceResponseSchema.parse(response);
    expect(parsed.id).toBe("3a9bf33a-02db-48e4-a8ad-90517278d7f2");
    expect(parsed.eventFamilies).toContain("AUTHENTICATION");
  });
});

describe("eventSourceListQuerySchema and paginatedEventSourcesSchema", () => {
  it("parses query parameters with defaults", () => {
    const parsed = eventSourceListQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
    expect(parsed.sortBy).toBe("updatedAt");
    expect(parsed.sortOrder).toBe("desc");
  });

  it("validates paginated event sources payload", () => {
    const payload = {
      items: [
        {
          id: "3a9bf33a-02db-48e4-a8ad-90517278d7f2",
          name: "Wazuh Agent",
          sourceType: "WAZUH",
          endpoint: "https://wazuh.local",
          ingestionMethod: "API",
          authenticationType: "BEARER_TOKEN",
          status: "ACTIVE",
          description: null,
          eventFamilies: ["AUTHENTICATION"],
          createdBy: "9a9bf33a-02db-48e4-a8ad-90517278d7f2",
          createdAt: "2026-09-27T10:00:00Z",
          updatedAt: "2026-09-27T10:00:00Z",
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    };

    const parsed = paginatedEventSourcesSchema.parse(payload);
    expect(parsed.items).toHaveLength(1);
    expect(parsed.pagination.total).toBe(1);
  });
});

describe("eventSourceDetailResponseSchema", () => {
  it("validates comprehensive event source detail payload", () => {
    const detailPayload = {
      id: "3a9bf33a-02db-48e4-a8ad-90517278d7f2",
      name: "Wazuh Production SIEM",
      sourceType: "WAZUH",
      endpoint: "https://wazuh.internal:55000",
      ingestionMethod: "API",
      authenticationType: "API_KEY",
      status: "ACTIVE",
      description: "Production event log collector",
      eventFamilies: ["AUTHENTICATION", "VPN_SSO"],
      createdBy: "9a9bf33a-02db-48e4-a8ad-90517278d7f2",
      creator: {
        id: "9a9bf33a-02db-48e4-a8ad-90517278d7f2",
        email: "secops@secura.ai",
        fullName: "Security Operations",
      },
      apiKeys: [
        {
          id: "3a9bf33a-02db-48e4-a8ad-90517278d7f9",
          name: "Agent Key",
          keyPrefix: "sec_live_1234",
          maskedKey: "sec_live_1234...****",
          status: "ACTIVE",
          expiresAt: null,
          lastUsedAt: "2026-09-28T14:00:00Z",
          lastUsedIp: "127.0.0.1",
          createdAt: "2026-09-20T10:00:00Z",
        },
      ],
      stats: {
        totalIngestedEvents: 1000,
        totalBatches: 20,
        lastIngestedAt: "2026-09-28T14:00:00Z",
      },
      createdAt: "2026-09-20T10:00:00Z",
      updatedAt: "2026-09-27T12:00:00Z",
    };

    const parsed = eventSourceDetailResponseSchema.parse(detailPayload);
    expect(parsed.id).toBe("3a9bf33a-02db-48e4-a8ad-90517278d7f2");
    expect(parsed.apiKeys[0]?.maskedKey).toBe("sec_live_1234...****");
    expect(parsed.stats.totalIngestedEvents).toBe(1000);
    expect(parsed.creator?.email).toBe("secops@secura.ai");
  });
});

describe("updateEventSourceFormSchema", () => {
  it("validates a complete update payload", () => {
    const valid = {
      name: "Updated Wazuh Manager",
      endpoint: "https://wazuh-new.internal:55000",
      ingestionMethod: "API" as const,
      authenticationType: "BEARER_TOKEN",
      status: "INACTIVE" as const,
      description: "Updated operational notes",
      eventFamilies: ["AUTHENTICATION" as const],
    };

    const parsed = updateEventSourceFormSchema.parse(valid);
    expect(parsed.name).toBe("Updated Wazuh Manager");
    expect(parsed.status).toBe("INACTIVE");
    expect(parsed.eventFamilies).toEqual(["AUTHENTICATION"]);
  });

  it("fails when name is empty", () => {
    const invalid = {
      name: "   ",
      endpoint: "https://wazuh.internal:55000",
      ingestionMethod: "API" as const,
      eventFamilies: ["AUTHENTICATION" as const],
    };

    expect(() => updateEventSourceFormSchema.parse(invalid)).toThrow(/Source name cannot be empty/i);
  });

  it("fails when API ingestion method has empty endpoint", () => {
    const invalid = {
      name: "Wazuh SIEM",
      endpoint: "   ",
      ingestionMethod: "API" as const,
      eventFamilies: ["AUTHENTICATION" as const],
    };

    expect(() => updateEventSourceFormSchema.parse(invalid)).toThrow(/Connection endpoint is required/i);
  });
});
