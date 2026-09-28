import { describe, expect, it } from "vitest";
import {
  registerEventSourceFormSchema,
  eventSourceResponseSchema,
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
