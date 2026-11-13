import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/feedback/toast";
import SettingsPage from "./page";

vi.mock("@/features/integrations", () => ({
  ApiKeysTab: () => <div>Production API key workflow</div>,
}));

describe("SettingsPage", () => {
  it("keeps Settings while removing placeholder configuration sections", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={client}>
        <ToastProvider>
          <SettingsPage />
        </ToastProvider>
      </QueryClientProvider>,
    );

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
});
