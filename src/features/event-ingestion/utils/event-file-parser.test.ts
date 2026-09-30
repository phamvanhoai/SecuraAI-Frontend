import { describe, expect, it } from "vitest";
import { detectEventFamilyFromType, parseEventFileContent } from "./event-file-parser";

describe("event-file-parser", () => {
  describe("detectEventFamilyFromType", () => {
    it("detects AUTHENTICATION family for logon and ssh event types", () => {
      expect(detectEventFamilyFromType("WINDOWS_LOGON_4624")).toBe("AUTHENTICATION");
      expect(detectEventFamilyFromType("SSH_AUTH_FAIL")).toBe("AUTHENTICATION");
    });

    it("detects VPN_SSO family for vpn and saml event types", () => {
      expect(detectEventFamilyFromType("OPENVPN_CONNECT")).toBe("VPN_SSO");
      expect(detectEventFamilyFromType("OKTA_SSO_LOGIN")).toBe("VPN_SSO");
    });

    it("detects APPLICATION_ACCESS family for privilege and database event types", () => {
      expect(detectEventFamilyFromType("SUDO_PRIVILEGE_ELEVATION")).toBe("APPLICATION_ACCESS");
      expect(detectEventFamilyFromType("POSTGRES_SQL_ACCESS")).toBe("APPLICATION_ACCESS");
    });

    it("returns undefined for unknown event types", () => {
      expect(detectEventFamilyFromType("CUSTOM_RAW_PING")).toBeUndefined();
    });
  });

  describe("parseJsonEvents", () => {
    it("parses valid JSON array of events correctly", () => {
      const json = JSON.stringify([
        {
          eventType: "LOGON_SUCCESS",
          eventFamily: "AUTHENTICATION",
          occurredAt: "2026-03-30T10:00:00Z",
          accountIdentifier: "admin@secura.local",
          sourceIp: "192.168.1.100",
        },
        {
          eventType: "LOGON_FAILURE",
          eventFamily: "AUTHENTICATION",
          occurredAt: "2026-03-30T10:05:00Z",
          accountIdentifier: "guest@secura.local",
          sourceIp: "192.168.1.101",
        },
      ]);

      const result = parseEventFileContent(json, "events.json");
      expect(result.format).toBe("JSON");
      expect(result.validCount).toBe(2);
      expect(result.invalidCount).toBe(0);
      expect(result.records).toHaveLength(2);
      expect(result.records[0]?.["eventType"]).toBe("LOGON_SUCCESS");
    });

    it("parses JSON object wrapped in events array with auto-detected family and fallback", () => {
      const json = JSON.stringify({
        events: [
          {
            eventType: "VPN_CONNECT",
            timestamp: "2026-03-30T11:00:00Z",
          },
        ],
      });

      const result = parseEventFileContent(json, "export.json", "AUTHENTICATION");
      expect(result.format).toBe("JSON");
      expect(result.validCount).toBe(1);
      expect(result.records[0]?.["occurredAt"]).toBe("2026-03-30T11:00:00Z");
      expect(result.records[0]?.["eventFamily"]).toBe("VPN_SSO");
    });

    it("handles invalid JSON syntax gracefully", () => {
      const result = parseEventFileContent("{ invalid json ...", "broken.json");
      expect(result.format).toBe("JSON");
      expect(result.validCount).toBe(0);
      expect(result.parseErrors.length).toBeGreaterThan(0);
    });

    it("identifies missing required fields in JSON items", () => {
      const json = JSON.stringify([
        {
          // missing eventType and occurredAt
          accountIdentifier: "admin",
        },
      ]);

      const result = parseEventFileContent(json, "data.json");
      expect(result.invalidCount).toBe(1);
      expect(result.validCount).toBe(0);
      expect(result.parseErrors[0]).toContain("Missing required fields");
    });
  });

  describe("parseCsvEvents", () => {
    it("parses valid CSV content with standard headers", () => {
      const csv = `eventType,eventFamily,occurredAt,accountIdentifier,sourceIp
LOGON_SUCCESS,AUTHENTICATION,2026-03-30T10:00:00Z,admin,10.0.0.1
LOGON_FAILURE,AUTHENTICATION,2026-03-30T10:01:00Z,user1,10.0.0.2`;

      const result = parseEventFileContent(csv, "events.csv");
      expect(result.format).toBe("CSV");
      expect(result.validCount).toBe(2);
      expect(result.invalidCount).toBe(0);
      expect(result.records).toHaveLength(2);
      expect(result.records[0]?.["eventType"]).toBe("LOGON_SUCCESS");
      expect(result.records[0]?.["accountIdentifier"]).toBe("admin");
    });

    it("normalizes alternative CSV header names like timestamp, user, host", () => {
      const csv = `type,timestamp,user,host,ip
SSH_LOGIN,2026-03-30T12:00:00Z,root,server-01,192.168.1.50`;

      const result = parseEventFileContent(csv, "audit.csv", "APPLICATION_ACCESS");
      expect(result.format).toBe("CSV");
      expect(result.validCount).toBe(1);
      expect(result.records[0]?.["eventType"]).toBe("SSH_LOGIN");
      expect(result.records[0]?.["occurredAt"]).toBe("2026-03-30T12:00:00Z");
      expect(result.records[0]?.["accountIdentifier"]).toBe("root");
      expect(result.records[0]?.["deviceIdentifier"]).toBe("server-01");
      expect(result.records[0]?.["sourceIp"]).toBe("192.168.1.50");
      // SSH_LOGIN is auto-detected as AUTHENTICATION instead of fallback APPLICATION_ACCESS
      expect(result.records[0]?.["eventFamily"]).toBe("AUTHENTICATION");
    });

    it("handles CSV with quoted fields and empty content", () => {
      const emptyResult = parseEventFileContent("", "empty.csv");
      expect(emptyResult.format).toBe("CSV");
      expect(emptyResult.parseErrors).toContain("CSV file is empty");

      const quotedCsv = `eventType,occurredAt,description
"COMPLEX, EVENT",2026-03-30T14:00:00Z,"Message with, commas and ""escaped quotes"""`;
      const quotedResult = parseEventFileContent(quotedCsv, "quoted.csv");
      expect(quotedResult.validCount).toBe(1);
      expect(quotedResult.records[0]?.["eventType"]).toBe("COMPLEX, EVENT");
    });
  });
});
