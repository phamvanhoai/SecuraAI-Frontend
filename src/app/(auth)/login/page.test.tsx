import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/features/authentication-account", () => ({
  LoginForm: ({ returnUrl, passwordChanged }: { returnUrl: string; passwordChanged: boolean }) =>
    <div data-testid="login-config">{JSON.stringify({ returnUrl, passwordChanged })}</div>,
}));
import LoginPage from "./page";
afterEach(cleanup);
it.each(["passwordChanged", "sessionExpired"])("starts from Overview after %s instead of the old protected page", async (flag) => {
  render(await LoginPage({ searchParams: Promise.resolve({ [flag]: "1", returnUrl: "/change-password" }) }));
  const expected = { returnUrl: "/dashboard", passwordChanged: flag === "passwordChanged" };
  expect(screen.getByTestId("login-config")).toHaveTextContent(JSON.stringify(expected));
});
it("preserves an ordinary permitted return URL outside the forced sign-in flow", async () => {
  render(await LoginPage({ searchParams: Promise.resolve({ returnUrl: "/users" }) }));
  expect(screen.getByTestId("login-config")).toHaveTextContent(JSON.stringify({ returnUrl: "/users", passwordChanged: false }));
});
