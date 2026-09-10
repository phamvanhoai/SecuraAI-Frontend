import { describe, expect, it } from "vitest";
import {
  createIntegrationFormSchema,
  createSyncScheduleFormSchema,
  integrationListSchema,
  integrationSchema,
  testConnectionResultSchema,
  updateIntegrationFormSchema,
} from "./integration-schema";

describe("integration-schema", () => {
  it("validates a valid integration record", () => {
    const raw = {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Splunk Production SIEM",
      integrationType: "siem",
      baseUrl: "https://siem.enterprise.local:8089",
      configuration: { index: "security_logs" },
      status: "active",
      lastConnectedAt: "2026-09-01T12:00:00.000Z",
      createdByUserId: "22222222-2222-4222-8222-222222222222",
      createdAt: "2026-09-01T10:00:00.000Z",
      updatedAt: "2026-09-01T12:00:00.000Z",
    };

    const parsed = integrationSchema.parse(raw);
    expect(parsed.name).toBe("Splunk Production SIEM");
    expect(parsed.integrationType).toBe("siem");
    expect(parsed.status).toBe("active");
  });

  it("validates integration list with pagination", () => {
    const raw = {
      items: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          name: "Fortinet FortiGate Firewall",
          integrationType: "firewall",
          baseUrl: "https://fortigate.enterprise.local/api/v2",
          status: "active",
          lastConnectedAt: null,
          createdAt: "2026-09-01T10:00:00.000Z",
          updatedAt: "2026-09-01T10:00:00.000Z",
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    };

    const parsed = integrationListSchema.parse(raw);
    expect(parsed.items).toHaveLength(1);
    expect(parsed.pagination.total).toBe(1);
  });

  it("validates and transforms createIntegrationFormSchema", () => {
    const valid = createIntegrationFormSchema.parse({
      name: "  Wazuh XDR Manager  ",
      integrationType: "siem",
      baseUrl: "https://wazuh.enterprise.local:55000",
      configuration: { verifySsl: true },
    });
    expect(valid.name).toBe("Wazuh XDR Manager");
    expect(valid.baseUrl).toBe("https://wazuh.enterprise.local:55000");

    // Empty URL transforms to null
    const noUrl = createIntegrationFormSchema.parse({
      name: "Generic Log Source",
      integrationType: "log_source",
      baseUrl: "",
    });
    expect(noUrl.baseUrl).toBeNull();
  });

  it("rejects invalid inputs on createIntegrationFormSchema", () => {
    expect(() =>
      createIntegrationFormSchema.parse({
        name: "",
        integrationType: "siem",
      }),
    ).toThrow();

    expect(() =>
      createIntegrationFormSchema.parse({
        name: "Test SIEM",
        integrationType: "siem",
        baseUrl: "not-a-url",
      }),
    ).toThrow();
  });

  it("validates testConnectionResultSchema", () => {
    const raw = {
      success: true,
      latencyMs: 124,
      message: "Connected successfully to remote SIEM endpoint",
      checkedAt: "2026-09-01T12:00:00.000Z",
    };
    const parsed = testConnectionResultSchema.parse(raw);
    expect(parsed.latencyMs).toBe(124);
    expect(parsed.success).toBe(true);
  });

  it("validates createSyncScheduleFormSchema", () => {
    const valid = createSyncScheduleFormSchema.parse({
      scheduleExpression: "*/15 * * * *",
      isActive: true,
    });
    expect(valid.scheduleExpression).toBe("*/15 * * * *");
    expect(valid.isActive).toBe(true);
  });

  it("validates updateIntegrationFormSchema", () => {
    const valid = updateIntegrationFormSchema.parse({
      name: "Updated SIEM",
      baseUrl: "https://siem-updated.example.com",
      status: "inactive",
    });
    expect(valid.name).toBe("Updated SIEM");
    expect(valid.status).toBe("inactive");
  });
});
