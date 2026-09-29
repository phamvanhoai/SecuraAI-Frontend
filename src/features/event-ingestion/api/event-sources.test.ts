import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequestMock = vi.fn();
vi.mock("@/lib/api/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

import { createEventSource, listEventSources } from "./event-sources";

describe("event-sources API client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createEventSource", () => {
    it("sends formatted payload to /api/event-sources and parses result", async () => {
      const rawResult = {
        id: "ec178d52-2959-47fd-93db-aa693158668c",
        name: "Wazuh Production SIEM",
        sourceType: "WAZUH",
        endpoint: "https://wazuh.internal.corp:55000",
        ingestionMethod: "API",
        authenticationType: "BEARER_TOKEN",
        status: "ACTIVE",
        description: "SIEM log stream",
        eventFamilies: ["AUTHENTICATION", "VPN_SSO"],
        createdBy: "ac178d52-2959-47fd-93db-aa693158668d",
        createdAt: "2026-09-27T10:00:00Z",
        updatedAt: "2026-09-27T10:00:00Z",
      };

      apiRequestMock.mockResolvedValue(rawResult);

      const result = await createEventSource({
        name: "  Wazuh Production SIEM  ",
        sourceType: "  WAZUH  ",
        endpoint: "https://wazuh.internal.corp:55000",
        ingestionMethod: "API",
        authenticationType: "BEARER_TOKEN",
        status: "ACTIVE",
        description: "SIEM log stream",
        eventFamilies: ["AUTHENTICATION", "VPN_SSO"],
      });

      expect(apiRequestMock).toHaveBeenCalledWith("/api/event-sources", {
        target: "same-origin",
        method: "POST",
        body: {
          name: "Wazuh Production SIEM",
          sourceType: "WAZUH",
          endpoint: "https://wazuh.internal.corp:55000",
          ingestionMethod: "API",
          authenticationType: "BEARER_TOKEN",
          status: "ACTIVE",
          description: "SIEM log stream",
          eventFamilies: ["AUTHENTICATION", "VPN_SSO"],
        },
      });

      expect(result).toEqual(rawResult);
    });
  });

  describe("listEventSources", () => {
    it("fetches event sources list with query parameters and parses result", async () => {
      const rawResult = {
        items: [
          {
            id: "ec178d52-2959-47fd-93db-aa693158668c",
            name: "Wazuh SIEM",
            sourceType: "WAZUH",
            endpoint: "https://wazuh.corp:55000",
            ingestionMethod: "API",
            authenticationType: "BEARER_TOKEN",
            status: "ACTIVE",
            description: null,
            eventFamilies: ["AUTHENTICATION"],
            createdBy: "ac178d52-2959-47fd-93db-aa693158668d",
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

      apiRequestMock.mockResolvedValue(rawResult);

      const result = await listEventSources({
        page: 1,
        limit: 20,
        q: "Wazuh",
        status: "ACTIVE",
      });

      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/event-sources?page=1&limit=20&q=Wazuh&status=ACTIVE",
        {
          target: "same-origin",
          method: "GET",
        },
      );

      expect(result).toEqual(rawResult);
    });
  });
});
