import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/feedback/toast";
import { ApiKeysTab } from "./api-keys-tab";
import { OneTimeSecretDialog } from "./one-time-secret-dialog";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("OneTimeSecretDialog", () => {
  it("renders secret token and warning alert, supports copy", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ToastProvider>
        <OneTimeSecretDialog
          keyName="Test Wazuh Key"
          onClose={vi.fn()}
          open={true}
          secret="sec_test_secret_12345"
        />
      </ToastProvider>,
    );

    expect(screen.getByText("API Key Secret Token")).toBeInTheDocument();
    expect(screen.getByDisplayValue("sec_test_secret_12345")).toBeInTheDocument();
    expect(
      screen.getByText(/không thể xem lại/i),
    ).toBeInTheDocument();

    const copyBtn = screen.getByRole("button", { name: /sao chép/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith("sec_test_secret_12345");
  });
});

describe("ApiKeysTab", () => {
  const fetchMock = vi.fn();
  const integrationId = "11111111-1111-4111-8111-111111111111";
  const keyId1 = "22222222-2222-4222-8222-222222222222";
  const keyId2 = "33333333-3333-4333-8333-333333333333";
  const keyId3 = "44444444-4444-4444-8444-444444444444";

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  function renderComponent() {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <ApiKeysTab integrationId={integrationId} />
        </ToastProvider>
      </QueryClientProvider>,
    );
  }

  const mockApiKeys = [
    {
      id: keyId1,
      integrationId,
      keyName: "Production Ingestion Key",
      keyFingerprint: "sec_a1b2...9z0",
      expiresAt: "2030-01-01T00:00:00.000Z",
      isActive: true,
      status: "ACTIVE" as const,
      createdAt: "2026-09-01T00:00:00.000Z",
    },
    {
      id: keyId2,
      integrationId,
      keyName: "Staging Test Key",
      keyFingerprint: "sec_c3d4...8y1",
      expiresAt: null,
      isActive: false,
      status: "INACTIVE" as const,
      createdAt: "2026-09-02T00:00:00.000Z",
    },
    {
      id: keyId3,
      integrationId,
      keyName: "Old Firewall Key",
      keyFingerprint: "sec_e5f6...7x2",
      expiresAt: "2025-01-01T00:00:00.000Z",
      isActive: true,
      status: "EXPIRED" as const,
      createdAt: "2024-09-01T00:00:00.000Z",
    },
  ];

  it("renders existing API keys with computed badges and fingerprints", async () => {
    fetchMock.mockImplementation(() => {
      return Promise.resolve(
        new Response(JSON.stringify({ success: true, data: mockApiKeys }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Production Ingestion Key")).toBeInTheDocument();
      expect(screen.getByText("Staging Test Key")).toBeInTheDocument();
      expect(screen.getByText("Old Firewall Key")).toBeInTheDocument();

      expect(screen.getByText("sec_a1b2...9z0")).toBeInTheDocument();
      expect(screen.getByText("sec_c3d4...8y1")).toBeInTheDocument();
      expect(screen.getByText("sec_e5f6...7x2")).toBeInTheDocument();

      expect(screen.getAllByText("Hoạt động").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Vô hiệu hóa").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Đã hết hạn")).toBeInTheDocument();
    });
  });

  it("filters keys by search term", async () => {
    fetchMock.mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      const urlObj = new URL(urlStr, "http://localhost");
      const searchParam = urlObj.searchParams.get("search");

      const filtered = searchParam
        ? mockApiKeys.filter((k) =>
            k.keyName.toLowerCase().includes(searchParam.toLowerCase()),
          )
        : mockApiKeys;

      return Promise.resolve(
        new Response(JSON.stringify({ success: true, data: filtered }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Production Ingestion Key")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Tìm kiếm theo tên khóa...");
    fireEvent.change(searchInput, { target: { value: "Staging" } });

    await waitFor(() => {
      expect(screen.queryByText("Production Ingestion Key")).not.toBeInTheDocument();
      expect(screen.getByText("Staging Test Key")).toBeInTheDocument();
      expect(screen.queryByText("Old Firewall Key")).not.toBeInTheDocument();
    });
  });

  it("opens Create API Key modal when click Thêm API Key mới", async () => {
    fetchMock.mockImplementation(() => {
      return Promise.resolve(
        new Response(JSON.stringify({ success: true, data: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /thêm api key mới/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /thêm api key mới/i }));

    expect(screen.getByText("Tạo mới API Key")).toBeInTheDocument();
    expect(screen.getByLabelText(/tên định danh khóa/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^tạo api key$/i })).toBeInTheDocument();
  });

  it("revokes an active API key after confirmation", async () => {
    fetchMock.mockImplementation((url: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = url.toString();
      const method = (init?.method || "GET").toUpperCase();

      if (method === "POST" && urlStr.includes("/revoke")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: {
                ...mockApiKeys[0],
                isActive: false,
                status: "INACTIVE",
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify({ success: true, data: [mockApiKeys[0]] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: `Thu hồi API key ${mockApiKeys[0]!.keyName}` }),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: `Thu hồi API key ${mockApiKeys[0]!.keyName}` }),
    );

    expect(screen.getByText("Xác nhận thu hồi API Key")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /xác nhận thu hồi/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/api/integrations/${integrationId}/api-keys/${keyId1}/revoke`),
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("reactivates an inactive API key", async () => {
    fetchMock.mockImplementation((_url: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method || "GET").toUpperCase();

      if (method === "PATCH") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: {
                ...mockApiKeys[1],
                isActive: true,
                status: "ACTIVE",
              },
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify({ success: true, data: [mockApiKeys[1]] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: `Kích hoạt lại API key ${mockApiKeys[1]!.keyName}` }),
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: `Kích hoạt lại API key ${mockApiKeys[1]!.keyName}` }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining(`/api/integrations/${integrationId}/api-keys/${keyId2}`),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ isActive: true }),
        }),
      );
    });
  });
});
