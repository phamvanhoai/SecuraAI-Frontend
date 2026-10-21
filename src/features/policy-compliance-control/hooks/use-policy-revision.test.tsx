import { act, cleanup, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { useRequestPolicyRevision } from "./use-policy-publication";
const request = vi.hoisted(() => vi.fn());
vi.mock("../api/policy-publication", () => ({
  requestPolicyRevision: request,
}));
afterEach(cleanup);
it("invalidates both draft and publication queries after requesting revision", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  client.setQueryData(["policies", "drafts", "list"], []);
  client.setQueryData(["policies", "publication", "list"], []);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  request.mockResolvedValue({});
  const { result } = renderHook(() => useRequestPolicyRevision(), { wrapper });
  await act(async () => {
    await result.current.mutateAsync({
      policyId: "policy",
      versionId: "version",
      body: { comment: "Please clarify scope." },
    });
  });
  expect(
    client.getQueryState(["policies", "drafts", "list"])?.isInvalidated,
  ).toBe(true);
  expect(
    client.getQueryState(["policies", "publication", "list"])?.isInvalidated,
  ).toBe(true);
  client.clear();
});
