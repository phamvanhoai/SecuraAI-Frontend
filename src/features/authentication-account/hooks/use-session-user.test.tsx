import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { getSessionUser } from "../api/get-session-user";
import { useSessionUser } from "./use-session-user";
vi.mock("../api/get-session-user", () => ({ getSessionUser: vi.fn() }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });
it("detects a revoked session on another device without user interaction", async () => {
  vi.useFakeTimers();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.mocked(getSessionUser).mockResolvedValueOnce({
    id: "user-1", email: "user@example.test", fullName: "User", status: "active",
    mustChangePassword: false, roles: [{ code: "EMPLOYEE", name: "Employee" }], permissions: [],
  }).mockResolvedValue(null);
  const { result, unmount } = renderHook(() => useSessionUser(), {
    wrapper: ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
  });
  await act(async () => { await vi.advanceTimersByTimeAsync(10); });
  expect(result.current.data?.id).toBe("user-1");
  await act(async () => { await vi.advanceTimersByTimeAsync(5010); });
  expect(result.current.data).toBeNull();
  unmount(); client.clear();
});
