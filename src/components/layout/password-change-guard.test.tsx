import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  pathname: "/dashboard",
  session: {
    isPending: false,
    data: {
      mustChangePassword: false,
    } as { mustChangePassword: boolean } | null,
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("@/features/authentication-account", () => ({
  useSessionUser: () => mocks.session,
}));

import { PasswordChangeGuard } from "./password-change-guard";

describe("PasswordChangeGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.pathname = "/dashboard";
    mocks.session.isPending = false;
    mocks.session.data = { mustChangePassword: false };
  });
  afterEach(cleanup);

  it("allows an authenticated role that does not require a password change", () => {
    render(
      <PasswordChangeGuard>
        <p>Protected content</p>
      </PasswordChangeGuard>,
    );
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });

  it("redirects any authenticated role marked for a mandatory password change", async () => {
    mocks.session.data = { mustChangePassword: true };
    render(
      <PasswordChangeGuard>
        <p>Protected content</p>
      </PasswordChangeGuard>,
    );

    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/change-password?required=1"),
    );
    expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
  });

  it("allows the password-change route while the requirement is active", () => {
    mocks.pathname = "/change-password";
    mocks.session.data = { mustChangePassword: true };
    render(
      <PasswordChangeGuard>
        <p>Change password content</p>
      </PasswordChangeGuard>,
    );
    expect(screen.getByText("Change password content")).toBeInTheDocument();
  });
});
