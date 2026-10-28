import { describe, expect, it } from "vitest";
import {
  findDuplicateEndpointSource,
  normalizeEndpointUrl,
} from "./endpoint-helpers";

describe("endpoint-helpers", () => {
  describe("normalizeEndpointUrl", () => {
    it("handles empty or null inputs", () => {
      expect(normalizeEndpointUrl("")).toBe("");
      expect(normalizeEndpointUrl(null)).toBe("");
      expect(normalizeEndpointUrl(undefined)).toBe("");
    });

    it("trims and lowercases URLs", () => {
      expect(normalizeEndpointUrl("  HTTPS://Wazuh.Corp:55000/  ")).toBe(
        "https://wazuh.corp:55000"
      );
    });

    it("strips trailing slashes", () => {
      expect(normalizeEndpointUrl("http://localhost:5555///")).toBe(
        "http://localhost:5555"
      );
    });
  });

  describe("findDuplicateEndpointSource", () => {
    const existingSources = [
      {
        id: "source-1",
        name: "Wazuh SIEM - Master",
        endpoint: "http://localhost:5555",
      },
      {
        id: "source-2",
        name: "Wazuh Edge Collector",
        endpoint: "/api/v1/integrations/wazuh/events",
      },
    ];

    it("returns matching source ignoring case and trailing slashes", () => {
      const match = findDuplicateEndpointSource(
        "HTTP://LOCALHOST:5555/",
        existingSources
      );
      expect(match).toEqual(existingSources[0]);
    });

    it("returns null when no duplicate exists", () => {
      const match = findDuplicateEndpointSource(
        "http://localhost:9999",
        existingSources
      );
      expect(match).toBeNull();
    });

    it("excludes the current source when updating", () => {
      const match = findDuplicateEndpointSource(
        "http://localhost:5555",
        existingSources,
        "source-1"
      );
      expect(match).toBeNull();
    });

    it("returns null for empty endpoint", () => {
      expect(findDuplicateEndpointSource("", existingSources)).toBeNull();
      expect(findDuplicateEndpointSource("/", existingSources)).toBeNull();
    });
  });
});
