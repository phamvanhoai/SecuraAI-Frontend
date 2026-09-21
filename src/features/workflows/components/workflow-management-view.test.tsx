import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WorkflowManagementView } from "./workflow-management-view";

describe("WorkflowManagementView", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  function renderView() {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={client}>
        <WorkflowManagementView />
      </QueryClientProvider>,
    );
  }

  it("renders page header, summary metrics, filters, and workflow table", async () => {
    const mockResponse = {
      success: true,
      data: {
        items: [
          {
            workflowId: "11111111-1111-4111-a111-111111111111",
            name: "Quy trình phê duyệt Kế hoạch xử lý rủi ro",
            description: "Duyệt rủi ro cấp cao",
            entityType: "risk_treatment_plan",
            isActive: true,
            stepsCount: 2,
            createdBy: {
              userId: "22222222-2222-4222-a222-222222222222",
              name: "Admin User",
              email: "admin@securaai.local",
            },
            createdAt: "2026-09-01T00:00:00.000Z",
            updatedAt: "2026-09-02T00:00:00.000Z",
          },
          {
            workflowId: "33333333-3333-4333-a333-333333333333",
            name: "Quy trình ban hành chính sách",
            description: "Ban hành chính sách ATTT",
            entityType: "policy_version",
            isActive: false,
            stepsCount: 1,
            createdBy: null,
            createdAt: "2026-09-01T00:00:00.000Z",
            updatedAt: "2026-09-02T00:00:00.000Z",
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
        summary: {
          total: 2,
          active: 1,
          inactive: 1,
        },
      },
    };

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/auth/session")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: {
                user: {
                  id: "11111111-1111-4111-a111-111111111111",
                  email: "admin@securaai.local",
                  fullName: "Admin User",
                  status: "active",
                  mustChangePassword: false,
                  roles: [{ code: "ADMIN", name: "Administrator" }],
                  permissions: ["workflows.read", "workflows.create"],
                },
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify(mockResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    renderView();

    expect(
      screen.getByRole("heading", { name: "Quy trình phê duyệt" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Tổng số quy trình")).toBeInTheDocument();

    expect(
      await screen.findByText("Quy trình phê duyệt Kế hoạch xử lý rủi ro"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Quy trình ban hành chính sách"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Kế hoạch xử lý rủi ro")).toHaveLength(2);
    expect(screen.getAllByText("Phiên bản chính sách")).toHaveLength(2);
  });

  it("renders empty state when no workflows exist", async () => {
    const mockEmptyResponse = {
      success: true,
      data: {
        items: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        summary: { total: 0, active: 0, inactive: 0 },
      },
    };

    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/auth/session")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              data: {
                user: {
                  id: "11111111-1111-4111-a111-111111111111",
                  email: "admin@securaai.local",
                  fullName: "Admin User",
                  status: "active",
                  mustChangePassword: false,
                  roles: [{ code: "ADMIN", name: "Administrator" }],
                  permissions: ["workflows.read", "workflows.create"],
                },
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        );
      }

      return Promise.resolve(
        new Response(JSON.stringify(mockEmptyResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    renderView();

    expect(
      await screen.findByText("Chưa có quy trình phê duyệt nào"),
    ).toBeInTheDocument();
  });
});
