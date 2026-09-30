import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequestMock = vi.fn();
vi.mock("@/lib/api/api-client", () => ({
  apiRequest: (...args: unknown[]) => apiRequestMock(...args),
}));

import {
  createEventSource,
  getEventSource,
  listEventSources,
  testEventSourceConnection,
  updateEventSource,
} from "./event-sources";

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

  describe("getEventSource", () => {
    it("fetches event source detail by ID and parses result", async () => {
      const rawResult = {
        id: "ec178d52-2959-47fd-93db-aa693158668c",
        name: "Wazuh SIEM",
        sourceType: "WAZUH",
        endpoint: "https://wazuh.corp:55000",
        ingestionMethod: "API",
        authenticationType: "BEARER_TOKEN",
        status: "ACTIVE",
        description: "SIEM collector",
        eventFamilies: ["AUTHENTICATION"],
        createdBy: "ac178d52-2959-47fd-93db-aa693158668d",
        creator: {
          id: "ac178d52-2959-47fd-93db-aa693158668d",
          email: "admin@secura.ai",
          fullName: "Admin",
        },
        apiKeys: [],
        stats: {
          totalIngestedEvents: 120,
          totalBatches: 5,
          lastIngestedAt: null,
        },
        createdAt: "2026-09-27T10:00:00Z",
        updatedAt: "2026-09-27T10:00:00Z",
      };

      apiRequestMock.mockResolvedValue(rawResult);

      const result = await getEventSource("ec178d52-2959-47fd-93db-aa693158668c");

      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/event-sources/ec178d52-2959-47fd-93db-aa693158668c",
        {
          target: "same-origin",
          method: "GET",
        },
      );

      expect(result).toEqual(rawResult);
    });
  });

  describe("updateEventSource", () => {
    it("sends PUT payload to /api/event-sources/:id and returns parsed response", async () => {
      const rawResult = {
        id: "ec178d52-2959-47fd-93db-aa693158668c",
        name: "Wazuh Updated Name",
        sourceType: "WAZUH",
        endpoint: "https://wazuh-updated.internal:55000",
        ingestionMethod: "API",
        authenticationType: "BEARER_TOKEN",
        status: "INACTIVE",
        description: "Updated notes",
        eventFamilies: ["AUTHENTICATION"],
        createdBy: "ac178d52-2959-47fd-93db-aa693158668d",
        createdAt: "2026-09-27T10:00:00Z",
        updatedAt: "2026-09-29T14:00:00Z",
      };

      apiRequestMock.mockResolvedValue(rawResult);

      const result = await updateEventSource("ec178d52-2959-47fd-93db-aa693158668c", {
        name: "  Wazuh Updated Name  ",
        endpoint: "https://wazuh-updated.internal:55000",
        ingestionMethod: "API",
        authenticationType: "BEARER_TOKEN",
        status: "INACTIVE",
        description: "Updated notes",
        eventFamilies: ["AUTHENTICATION"],
      });

      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/event-sources/ec178d52-2959-47fd-93db-aa693158668c",
        {
          target: "same-origin",
          method: "PUT",
          body: {
            name: "Wazuh Updated Name",
            endpoint: "https://wazuh-updated.internal:55000",
            ingestionMethod: "API",
            authenticationType: "BEARER_TOKEN",
            status: "INACTIVE",
            description: "Updated notes",
            eventFamilies: ["AUTHENTICATION"],
          },
        },
      );

      expect(result).toEqual(rawResult);
    });
  });

  describe("testEventSourceConnection", () => {
    it("sends test connection parameters to /api/event-sources/test-connection and parses diagnostic response", async () => {
      const rawResult = {
        connected: true,
        statusCode: 200,
        latencyMs: 140,
        message: "Wazuh API connected and authenticated successfully",
        provider: "wazuh",
        details: {
          title: "Wazuh REST API",
          apiVersion: "v4.8.0",
          hostname: "wazuh-manager",
        },
        verifySslWarning: false,
      };

      apiRequestMock.mockResolvedValue(rawResult);

      const result = await testEventSourceConnection({
        endpoint: "  https://192.168.56.101:55000  ",
        username: "  wazuh-wui  ",
        password: "secret_password",
        verifySsl: false,
        timeoutMs: 6000,
      });

      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/event-sources/test-connection",
        {
          target: "same-origin",
          method: "POST",
          body: {
            endpoint: "https://192.168.56.101:55000",
            username: "wazuh-wui",
            password: "secret_password",
            verifySsl: false,
            timeoutMs: 6000,
          },
        },
      );

      expect(result).toEqual(rawResult);
    });
  });
});
