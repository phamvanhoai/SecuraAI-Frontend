import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/ai-alerts", () => ({
  issueAiAlertRealtimeTicket: vi.fn(),
}));

import { issueAiAlertRealtimeTicket } from "../api/ai-alerts";
import { useAiAlertRealtime } from "./use-ai-alerts";

class FakeWebSocket extends EventTarget {
  static instances: FakeWebSocket[] = [];
  readonly url: string;
  readonly protocols: string[];
  readyState = 0;

  constructor(url: string | URL, protocols?: string | string[]) {
    super();
    this.url = String(url);
    this.protocols =
      typeof protocols === "string" ? [protocols] : (protocols ?? []);
    FakeWebSocket.instances.push(this);
    queueMicrotask(() => {
      this.readyState = 1;
      this.dispatchEvent(new Event("open"));
    });
  }

  close(): void {
    this.readyState = 3;
  }
}

afterEach(() => {
  FakeWebSocket.instances = [];
  vi.unstubAllGlobals();
});

describe("useAiAlertRealtime", () => {
  it("connects with a scoped ticket and invalidates REST queries on an update", async () => {
    vi.mocked(issueAiAlertRealtimeTicket).mockResolvedValue({
      ticket: "signed-ticket",
      expiresInSeconds: 30,
      path: "/api/v1/ai-alerts/realtime",
    });
    vi.stubGlobal("WebSocket", FakeWebSocket);
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useAiAlertRealtime(true), { wrapper });
    await waitFor(() => expect(result.current).toBe("live"));
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2));

    const socket = FakeWebSocket.instances[0];
    expect(socket).toBeDefined();
    expect(socket?.url).toBe("ws://localhost:3000/api/v1/ai-alerts/realtime");
    expect(socket?.protocols).toEqual([
      "securaai-alerts.v1",
      "ticket.signed-ticket",
    ]);

    act(() => {
      socket?.dispatchEvent(
        new MessageEvent("message", {
          data: JSON.stringify({ type: "ai-alerts.updated" }),
        }),
      );
    });
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(4));
  });
});
