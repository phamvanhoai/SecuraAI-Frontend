import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSessionUser } from "@/features/authentication-account";
import ProfilePage from "./page";

vi.mock("@/features/authentication-account", () => ({
  useSessionUser: vi.fn(),
}));

const refetch = vi.fn();

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders account identity, roles, status, and security destinations", () => {
    vi.mocked(useSessionUser).mockReturnValue({
      data: {
        id: "00000000-0000-4000-8000-000000000001",
        email: "securityofficer@example.com",
        fullName: "Security Officer",
        status: "ACTIVE",
        mustChangePassword: false,
        roles: [{ code: "SECURITY_OFFICER", name: "Security Officer" }],
        permissions: [],
      },
      isPending: false,
      refetch,
    } as unknown as ReturnType<typeof useSessionUser>);

    render(<ProfilePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "My profile" }),
    ).toBeVisible();
    expect(screen.getAllByText("Security Officer")).toHaveLength(3);
    expect(screen.getAllByText("securityofficer@example.com")).toHaveLength(2);
    expect(screen.getAllByText("Active")).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: /Change password/u }),
    ).toHaveAttribute("href", "/change-password");
    expect(
      screen.getByRole("link", { name: /Login history/u }),
    ).toHaveAttribute("href", "/login-history");
  });

  it("shows a recoverable error state when the session user is unavailable", () => {
    vi.mocked(useSessionUser).mockReturnValue({
      data: undefined,
      isPending: false,
      refetch,
    } as unknown as ReturnType<typeof useSessionUser>);

    render(<ProfilePage />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("Profile unavailable")).toBeVisible();
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("renders a stable loading skeleton while the session is loading", () => {
    vi.mocked(useSessionUser).mockReturnValue({
      data: undefined,
      isPending: true,
      refetch,
    } as unknown as ReturnType<typeof useSessionUser>);

    render(<ProfilePage />);

    expect(
      screen.getByRole("status", { name: "Loading profile" }),
    ).toHaveAttribute("aria-busy", "true");
  });
});
