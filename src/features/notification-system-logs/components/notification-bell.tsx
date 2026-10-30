"use client";
import { Bell } from "lucide-react";
import Link from "next/link";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import {
  useNotificationInbox,
} from "../hooks/use-notification-inbox";

export function NotificationBell({ userId }: { userId: string | undefined }) {
  const inbox = useNotificationInbox(userId, 10, true);
  const unread = userId ? inbox.data?.unreadCount : undefined;
  const label =
    unread === undefined ? "Notifications" : `Notifications, ${unread} unread`;
  return (
    <DropdownMenu
      triggerLabel={label}
      menuWidth={360}
      contentClassName="p-0"
      label={
        <span className="relative grid size-7 place-items-center">
          <Bell aria-hidden="true" className="size-5" strokeWidth={1.8} />
          {unread !== undefined && unread > 0 ? (
            <span
              aria-hidden="true"
              className="bg-danger dark:text-background absolute -top-1 -right-1 grid min-h-4.5 min-w-4.5 place-items-center rounded-full px-1 text-[10px] font-semibold text-white tabular-nums"
            >
              {unread > 99 ? "99+" : unread}
            </span>
          ) : null}
          <span className="sr-only" role="status" aria-atomic="true">
            {unread === undefined ? "" : `${unread} unread notifications`}
          </span>
        </span>
      }
    >
      <section aria-label="Recent notifications">
        <div className="border-border flex items-center justify-between gap-3 border-b p-4">
          <h2 className="font-semibold">Notifications</h2>
          {unread !== undefined ? (
            <span className="text-muted text-xs">{unread} unread</span>
          ) : null}
        </div>
        {inbox.isError ? (
          <div role="alert" className="p-4 text-sm">
            <p>Unable to load notifications.</p>
            <button
              type="button"
              className="text-brand mt-2 min-h-10 underline"
              onClick={(event) => {
                event.stopPropagation();
                void inbox.refetch();
              }}
            >
              Try again
            </button>
          </div>
        ) : inbox.isPending ? (
          <p className="text-muted p-4 text-sm">Loading notifications...</p>
        ) : !inbox.data?.items.some((item) => !item.readAt) ? (
          <p className="text-muted p-4 text-sm">No unread notifications.</p>
        ) : (
          <ul className="divide-border divide-y">
            {inbox.data.items.filter((item) => !item.readAt).map((item) => (
              <li key={item.id}>
                <Link
                  href={`/notifications#notification-${item.id}`}
                  onNavigate={(event) => {
                    if (window.location.pathname !== "/notifications") return;
                    event.preventDefault();
                    const hash = `#notification-${item.id}`;
                    if (window.location.hash === hash) {
                      window.dispatchEvent(new HashChangeEvent("hashchange"));
                    } else {
                      window.location.hash = hash;
                    }
                  }}
                  className={`focus-visible:outline-brand hover:bg-neutral-soft block p-4 transition-colors focus-visible:outline-2 ${item.readAt ? "bg-surface" : "bg-info-soft/45"}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="min-w-0 flex-1">
                      <span className="text-foreground block font-medium [overflow-wrap:anywhere]">
                        {item.title}
                      </span>
                      <span className="text-muted mt-1 line-clamp-2 block text-sm [overflow-wrap:anywhere]">
                        {item.message}
                      </span>
                      <span className="text-muted mt-2 block text-xs">
                        {item.sender} ·{" "}
                        {new Date(item.createdAt).toLocaleString("en-GB")}
                      </span>
                    </span>
                    {!item.readAt ? (
                      <span className="bg-brand mt-1.5 size-2 shrink-0 rounded-full">
                        <span className="sr-only">Unread</span>
                      </span>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/notifications"
          className="text-brand border-border hover:bg-neutral-soft block border-t px-4 py-3 text-center text-sm font-medium"
        >
          View all notifications
        </Link>
      </section>
    </DropdownMenu>
  );
}
