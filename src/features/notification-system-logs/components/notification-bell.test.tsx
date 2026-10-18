import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/feedback/toast";
import { NotificationBell } from "./notification-bell";
import { useReadNotifications } from "../hooks/use-notification-inbox";

const account = "00000000-0000-4000-8000-000000000001";
const notification = "00000000-0000-4000-8000-000000000010";
function ReadButton() {
  const { read } = useReadNotifications(account);
  return (
    <>
      <button onClick={() => read.mutate(notification)}>
        Read notification
      </button>
      {read.isError ? <p role="alert">Read failed</p> : null}
    </>
  );
}
function client() {
  return new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("NotificationBell", () => {
  it("shows server unread count and refreshes both inbox queries after reading", async () => {
    let unread = 3;
    const fetchMock = vi
      .fn()
      .mockImplementation((_url: string, init: RequestInit) => {
        if (init.method === "PATCH") {
          unread = 2;
          return Promise.resolve(
            Response.json({ success: true, data: { read: true } }),
          );
        }
        return Promise.resolve(
          Response.json({
            success: true,
            data: { items: [], unreadCount: unread },
          }),
        );
      });
    vi.stubGlobal("fetch", fetchMock);
    const queryClient = client();
    queryClient.setQueryData(["notifications", "inbox", account, 50], {
      items: [],
      unreadCount: 3,
    });
    render(
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <NotificationBell userId={account} />
          <ReadButton />
        </QueryClientProvider>
      </ToastProvider>,
    );
    expect(
      await screen.findByRole("button", { name: "Notifications, 3 unread" }),
    ).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByText("Read notification"));
    expect(
      await screen.findByRole("button", { name: "Notifications, 2 unread" }),
    ).toBeInTheDocument();
    expect(
      queryClient.getQueryState(["notifications", "inbox", account, 50])
        ?.isInvalidated,
    ).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/notifications/inbox/${notification}/read`,
      expect.objectContaining({ method: "PATCH" }),
    );
    queryClient.clear();
  });
  it("keeps unread count when marking read fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, init: RequestInit) =>
        Promise.resolve(
          init.method === "PATCH"
            ? Response.json(
                {
                  success: false,
                  error: { code: "INTERNAL_ERROR", message: "Try again" },
                },
                { status: 500 },
              )
            : Response.json({
                success: true,
                data: { items: [], unreadCount: 4 },
              }),
        ),
      ),
    );
    const queryClient = client();
    render(
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <NotificationBell userId={account} />
          <ReadButton />
        </QueryClientProvider>
      </ToastProvider>,
    );
    await screen.findByRole("button", { name: "Notifications, 4 unread" });
    fireEvent.click(screen.getByText("Read notification"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Read failed");
    expect(
      screen.getByRole("button", { name: "Notifications, 4 unread" }),
    ).toBeInTheDocument();
    queryClient.clear();
  });
  it("does not leak the previous account count after switching users", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ success: true, data: { items: [], unreadCount: 8 } }),
        ),
    );
    const queryClient = client();
    const { rerender } = render(
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <NotificationBell userId={account} />
        </QueryClientProvider>
      </ToastProvider>,
    );
    await screen.findByRole("button", { name: "Notifications, 8 unread" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => new Promise(() => undefined)),
    );
    rerender(
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <NotificationBell userId="other-user" />
        </QueryClientProvider>
      </ToastProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Notifications" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("8")).not.toBeInTheDocument();
    queryClient.clear();
  });
  it("polls for newly received notifications without navigation", async () => {
    let unread = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          Response.json({
            success: true,
            data: { items: [], unreadCount: unread },
          }),
        ),
      ),
    );
    const queryClient = client();
    render(
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <NotificationBell userId={account} />
        </QueryClientProvider>
      </ToastProvider>,
    );
    await screen.findByRole("button", { name: "Notifications, 0 unread" });
    vi.useFakeTimers();
    // Re-mount the observer so its polling timer is controlled by this test.
    cleanup();
    render(
      <ToastProvider>
        <QueryClientProvider client={queryClient}>
          <NotificationBell userId={account} />
        </QueryClientProvider>
      </ToastProvider>,
    );
    unread = 1;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_100);
    });
    vi.useRealTimers();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Notifications, 1 unread" }),
      ).toBeInTheDocument(),
    );
    queryClient.clear();
  });
});

it("opens a notification preview without marking anything read", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    Response.json({
      success: true,
      data: {
        items: [
          {
            id: notification,
            title: "Security review",
            message: "Review assigned assets",
            sender: "Admin",
            priority: "IMPORTANT",
            createdAt: "2026-10-15T00:00:00Z",
            readAt: null,
          },
        ],
        unreadCount: 1,
      },
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const queryClient = client();
  const { container } = render(
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <NotificationBell userId={account} />
      </QueryClientProvider>
    </ToastProvider>,
  );
  const trigger = await screen.findByRole("button", {
    name: "Notifications, 1 unread",
  });
  const menu = container.querySelector("details");
  if (!menu) throw new Error("Notification menu was not rendered");
  menu.open = true;
  fireEvent(menu, new Event("toggle"));
  expect(
    await screen.findByRole("region", { name: "Recent notifications" }),
  ).toBeVisible();
  expect(screen.getByRole("link", { name: /Security review/ })).toHaveAttribute(
    "href",
    `/notifications#notification-${notification}`,
  );
  expect(
    fetchMock.mock.calls.every((call) => call[1]?.method !== "PATCH"),
  ).toBe(true);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(menu.open).toBe(false);
  expect(trigger).toHaveFocus();
  queryClient.clear();
});
