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
const securityOfficerRole = {
  ...systemRole,
  id: "33333333-3333-4333-8333-333333333333",
  code: "SECURITY_OFFICER",
  name: "Security Officer",
  isSystem: false,
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

  it("keeps Admin read-only and updates permissions for another fixed role", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      if (init?.method === "PATCH") {
        return Response.json({ success: true, data: securityOfficerRole });
      }
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
          items: [systemRole, securityOfficerRole],
          pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
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
    expect(detailDialog.getByText("System role")).toBeVisible();
    await user.click(detailDialog.getByRole("button", { name: "Close" }));
    expect(
      screen.queryByRole("button", { name: "Create role" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit permissions" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Actions for Security Officer" }),
    );
    await user.click(screen.getByRole("button", { name: "Edit permissions" }));
    const permissionDialog = within(
      screen.getByRole("dialog", { name: "Edit permissions" }),
    );
    expect(permissionDialog.getByText("SECURITY_OFFICER")).toBeVisible();
    await user.click(
      permissionDialog.getByRole("checkbox", { name: /roles\.read/ }),
    );
    await user.click(
      permissionDialog.getByRole("button", { name: "Save permissions" }),
    );
    expect(await screen.findByText("Permissions updated")).toBeVisible();
    expect(
      fetchMock.mock.calls.some(([, init]) => init?.method === "PATCH"),
    ).toBe(true);
  });
});
