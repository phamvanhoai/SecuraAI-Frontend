import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/feedback/toast";
import { RolesManager } from "./roles-manager";

const permissionId = "11111111-1111-4111-8111-111111111111";
const systemRole = {
  id: "22222222-2222-4222-8222-222222222222",
  code: "ADMIN",
  name: "Administrator",
  description: null,
  isSystem: true,
  permissions: [
    {
      id: permissionId,
      code: "roles.read",
      module: "access-control",
      action: "read",
      description: "View roles",
    },
  ],
  assignedUserCount: 1,
  workflowStepCount: 0,
  createdAt: "2026-09-10T00:00:00.000Z",
  updatedAt: "2026-09-10T00:00:00.000Z",
};

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

describe("RolesManager", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows fixed roles as a read-only access overview", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      if (String(input).includes("/api/access-control/permissions")) {
        return Response.json({
          success: true,
          data: {
            items: systemRole.permissions,
            pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
          },
        });
      }
      return Response.json({
        success: true,
        data: {
          items: [systemRole],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <RolesManager />
        </ToastProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText("Administrator")).toBeVisible();
    expect(
      screen.queryByText("Dữ liệu mẫu phục vụ thiết kế giao diện"),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Actions for Administrator" }),
    );
    await user.click(screen.getByRole("button", { name: "View details" }));
    const detailDialog = within(
      screen.getByRole("dialog", { name: "Role details" }),
    );
    expect(detailDialog.getByText("roles.read")).toBeVisible();
    expect(detailDialog.getByText("Fixed")).toBeVisible();
    await user.click(detailDialog.getByRole("button", { name: "Close" }));
    expect(
      screen.queryByRole("button", { name: "Create role" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === "POST"),
    ).toBe(false);
  });
});
