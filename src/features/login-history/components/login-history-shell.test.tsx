import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthSessionUser } from "@/features/auth";
const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  user: null as AuthSessionUser | null,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace }),
  usePathname: () => "/admin/login-history",
}));
vi.mock("@/features/auth", () => ({
  useSessionUser: () => ({
    isSuccess: true,
    isPending: false,
    data: mocks.user,
  }),
}));
import { LoginHistoryShell } from "./login-history-shell";
const item = {
  id: "11111111-1111-4111-8111-111111111111",
  userId: null,
  userName: "Other User",
  email: "other@example.test",
  loginTime: "2026-09-18T08:00:00Z",
  status: "failed",
  ipAddress: "::1",
  userAgent: "Test browser",
  failureReason: "INVALID_CREDENTIALS",
};
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <LoginHistoryShell />
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user = {
    id: "admin",
    email: "admin@example.test",
    fullName: "Admin",
    status: "active",
    mustChangePassword: false,
    mfaEnabled: false,
    roles: [{ code: "ADMIN", name: "Admin" }],
    permissions: ["login-history.read"],
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        success: true,
        data: {
          items: [item],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
      }),
    ),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("LoginHistoryShell", () => {
  it("redirects a disallowed role without fetching history", async () => {
    if (mocks.user) mocks.user.roles = [{ code: "EMPLOYEE", name: "Employee" }];
    mount();
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/forbidden"),
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByText("Other User")).not.toBeInTheDocument();
  });
  it("renders another user's login and applies search and status filters", async () => {
    const user = userEvent.setup();
    mount();
    expect(await screen.findByText("Other User")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Search by name or email"), "other");
    await user.selectOptions(screen.getByLabelText("Status"), "failed");
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("search=other"),
        expect.objectContaining({ method: "GET" }),
      ),
    );
  });
  it("validates IP inline without sending another request", async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByText("Other User");
    await user.type(screen.getByLabelText("IP address"), "hostname");
    expect(
      await screen.findByText("Enter a valid IPv4 or IPv6 address."),
    ).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("loads typed search automatically and cancels pending text when filters are cleared", async () => {
    const user = userEvent.setup();
    mount();
    await screen.findByText("Other User");
    expect(
      screen.queryByRole("button", { name: "Apply" }),
    ).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Search by name or email"), "other");
    expect(fetch).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("search=other"),
        expect.any(Object),
      ),
    );
    await user.type(
      screen.getByLabelText("Search by name or email"),
      "pending",
    );
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    await user.selectOptions(screen.getByLabelText("Status"), "success");
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("status=success"),
        expect.any(Object),
      ),
    );
    expect(
      vi
        .mocked(fetch)
        .mock.calls.some(([url]) =>
          String(url).includes("search=otherpending"),
        ),
    ).toBe(false);
    expect(screen.getByLabelText("Search by name or email")).toHaveValue("");
  });
  it("redirects when the backend revokes access with 403", async () => {
    vi.mocked(fetch).mockResolvedValue(
      Response.json(
        { success: false, error: { message: "internal detail" } },
        { status: 403 },
      ),
    );
    mount();
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/forbidden"),
    );
    expect(screen.queryByText("internal detail")).not.toBeInTheDocument();
  });
});
