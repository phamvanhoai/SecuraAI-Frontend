import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock("@/components/feedback/toast", () => ({
  useToast: () => ({ success: mocks.success, error: mocks.error }),
}));
vi.mock("../hooks/use-notification-preferences", () => ({
  useNotificationPreferences: () => ({
    data: { channels: { inSystem: true, email: true }, updatedAt: null },
    isPending: false,
    isError: false,
  }),
  useUpdateNotificationPreferences: () => ({ mutate: mocks.mutate, isPending: false }),
}));

import { PersonalNotificationChannelManager } from "./personal-notification-channel-manager";

describe("PersonalNotificationChannelManager", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("loads saved channels and persists a changed selection", () => {
    render(<PersonalNotificationChannelManager email="user@example.test" />);
    expect(screen.getByRole("checkbox", { name: /in-system notifications/i })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: /email notifications/i }));
    fireEvent.click(screen.getByRole("button", { name: "Save preferences" }));
    expect(mocks.mutate).toHaveBeenCalledWith(
      { channels: { inSystem: true, email: false } },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
  });

  it("prevents saving when every channel is disabled", () => {
    render(<PersonalNotificationChannelManager email="user@example.test" />);
    fireEvent.click(screen.getByRole("checkbox", { name: /in-system notifications/i }));
    fireEvent.click(screen.getByRole("checkbox", { name: /email notifications/i }));
    expect(screen.getByRole("button", { name: "Save preferences" })).toBeDisabled();
    expect(screen.getByText(/select at least one notification channel/i)).toBeInTheDocument();
  });
});
