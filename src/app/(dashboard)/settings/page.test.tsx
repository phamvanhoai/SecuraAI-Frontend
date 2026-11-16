import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/feedback/toast";
import SettingsPage from "./page";

const useSessionUserMock = vi.fn();

vi.mock("@/features/authentication-account", () => ({
  useSessionUser: () => useSessionUserMock(),
}));

vi.mock("@/features/integrations", () => ({
  ApiKeysTab: () => <div>Production API key workflow</div>,
}));

function renderSettingsPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <SettingsPage />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe("SettingsPage", () => {
  beforeEach(() => {
    useSessionUserMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        roles: [{ code: "ADMIN", name: "Administrator" }],
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("keeps Settings while removing placeholder configuration sections for ADMIN", () => {
    renderSettingsPage();

    expect(
      screen.getByRole("heading", { name: "System Settings" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Integration API Keys" }),
    ).toBeVisible();
    expect(screen.getByText("Production API key workflow")).toBeVisible();
    expect(screen.queryByText("Organization information")).not.toBeInTheDocument();
    expect(screen.queryByText("Login session policy")).not.toBeInTheDocument();
    expect(screen.queryByText("Notification rules")).not.toBeInTheDocument();
  });

  it("restricts Integration API Keys access for non-ADMIN users", () => {
    useSessionUserMock.mockReturnValue({
      isPending: false,
      isError: false,
      data: {
        roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }],
      },
    });

    renderSettingsPage();

    expect(
      screen.getByText(
        "System integration settings and API key management are restricted to administrators only.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByText("Production API key workflow"),
    ).not.toBeInTheDocument();
  });
});
