import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { expect, it, vi } from "vitest";
import { useAssignIncidentHandler } from "./use-incidents";

vi.mock("../api/incidents", () => ({
  assignIncidentHandler: vi.fn().mockResolvedValue({}),
}));

it("refreshes all inactive assignment history pages before save completes", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
  });
  let saved = false;
  const history = vi.fn(async () => ({
    handler: saved ? "New Officer" : "Previous Officer",
  }));
  const first = ["incidents", "assignment-history", "incident", 1];
  const second = ["incidents", "assignment-history", "incident", 2];
  await client.fetchQuery({ queryKey: first, queryFn: history });
  await client.fetchQuery({ queryKey: second, queryFn: history });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const { result, unmount } = renderHook(useAssignIncidentHandler, { wrapper });
  saved = true;
  await act(async () => {
    await result.current.mutateAsync({
      id: "incident",
      values: {
        assigneeUserId: "new-officer",
        note: "Changed incident handler.",
      },
    });
  });
  expect(history).toHaveBeenCalledTimes(4);
  expect(client.getQueryData(first)).toEqual({ handler: "New Officer" });
  expect(client.getQueryData(second)).toEqual({ handler: "New Officer" });
  unmount();
  client.clear();
});
