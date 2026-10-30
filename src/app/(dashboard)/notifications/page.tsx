"use client";
import { NotificationDetail } from "@/features/notification-system-logs/components/notification-detail";
import {
  BellRing,
  CheckCheck,
  Circle,
  History,
  Mail,
  Send,
  Settings2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/api-client";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/data-display/data-table";
import { Pagination } from "@/components/data-display/pagination";
import {
  ProductPageHeader,
  ProductPanel,
  StatusBadge,
} from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useSessionUser } from "@/features/authentication-account";
import {
  PersonalNotificationChannelManager,
  SendEmailNotificationManager,
  SendInSystemNotificationManager,
  useNotificationInbox,
  useReadNotifications,
} from "@/features/notification-system-logs";
import { cn } from "@/lib/utils";

type NotificationView =
  "inbox" | "history" | "preferences" | "in-system" | "email";
export default function NotificationsPage() {
  const [activeView, setActiveView] = useState<NotificationView>("inbox");
  const session = useSessionUser();
  useEffect(() => {
    const showLinkedNotification = () => {
      if (window.location.hash.startsWith("#notification-"))
        setActiveView("inbox");
    };
    window.addEventListener("hashchange", showLinkedNotification);
    return () =>
      window.removeEventListener("hashchange", showLinkedNotification);
  }, []);
  const accountEmail = session.data?.email ?? "your account email";
  const isAdmin =
    session.data?.roles.some((role) => role.code === "ADMIN") ?? false;
  return (
    <div className="space-y-5">
      <ProductPageHeader
        title="Notifications"
        description={
          isAdmin
            ? "Review notification activity, manage delivery preferences, and send targeted communications."
            : "Review your notifications and configure your preferred delivery channels."
        }
        showSampleNotice={false}
      />
      {session.isPending ? (
        <div
          aria-label="Loading notifications"
          className="bg-neutral-soft h-56 animate-pulse rounded-xl"
        />
      ) : session.isError ? (
        <Alert>Unable to check your notification access.</Alert>
      ) : (
        <div className="space-y-5">
          <div
            aria-label="Notification functions"
            className="border-border bg-surface inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border p-1 shadow-xs"
            role="tablist"
          >
            <ChannelTab
              active={activeView === "inbox"}
              icon={BellRing}
              label="My Notifications"
              onClick={() => setActiveView("inbox")}
            />
            {isAdmin ? (
              <ChannelTab
                active={activeView === "history"}
                icon={History}
                label="Delivery History"
                onClick={() => setActiveView("history")}
              />
            ) : null}
            <ChannelTab
              active={activeView === "preferences"}
              icon={Settings2}
              label="Personal Channels"
              onClick={() => setActiveView("preferences")}
            />
            {isAdmin ? (
              <>
                <ChannelTab
                  active={activeView === "in-system"}
                  icon={Send}
                  label="Send in-system"
                  onClick={() => setActiveView("in-system")}
                />
                <ChannelTab
                  active={activeView === "email"}
                  icon={Mail}
                  label="Send email"
                  onClick={() => setActiveView("email")}
                />
              </>
            ) : null}
          </div>

          <div aria-live="polite" role="tabpanel">
            {activeView === "preferences" ? (
              <PersonalNotificationChannelManager email={accountEmail} />
            ) : activeView === "in-system" && isAdmin ? (
              <SendInSystemNotificationManager />
            ) : activeView === "email" && isAdmin ? (
              <SendEmailNotificationManager />
            ) : activeView === "inbox" ? (
              <NotificationInbox />
            ) : activeView === "history" && isAdmin ? (
              <NotificationHistory />
            ) : (
              <PersonalNotificationChannelManager email={accountEmail} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationInbox() {
  const session = useSessionUser();
  const inbox = useNotificationInbox(session.data?.id);
  const { read, markAll } = useReadNotifications(session.data?.id);
  const readError = read.error ?? markAll.error;
  const focusedNotification = useRef("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useEffect(() => {
    const focusNotification = (event?: Event) => {
      const hash = window.location.hash;
      if (
        !hash.startsWith("#notification-") ||
        (!event && hash === focusedNotification.current)
      )
        return;
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      target.scrollIntoView({ block: "center" });
      target.focus({ preventScroll: true });
      focusedNotification.current = hash;
    };
    focusNotification();
    window.addEventListener("hashchange", focusNotification);
    return () => window.removeEventListener("hashchange", focusNotification);
  }, [inbox.data]);
  const items = inbox.data?.items ?? [];
  return (
    <ProductPanel
      title="My Notifications"
      description={`${inbox.data?.unreadCount ?? 0} unread notifications`}
    >
      {selectedId ? <NotificationDetail key={selectedId} id={selectedId} userId={session.data?.id} onClose={(readId) => {
        setSelectedId(null);
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
        focusedNotification.current = "";
        if (readId) read.mutate(readId);
      }} /> : null}
      {inbox.isError ? (
        <Alert>Unable to load notifications. Please try again.</Alert>
      ) : null}
      {readError ? (
        <Alert>Unable to mark notifications as read. Please try again.</Alert>
      ) : null}
      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <p className="text-muted text-sm">
          Showing {items.length} recent in-system notification
          {items.length === 1 ? "" : "s"}
        </p>
        <Button
          type="button"
          variant="secondary"
          disabled={!inbox.data?.unreadCount || markAll.isPending}
          onClick={() => markAll.mutate()}
        >
          <CheckCheck aria-hidden="true" className="size-4" />
          Mark all as read
        </Button>
      </div>
      <div className="p-4">
        {inbox.isPending ? (
          <div className="space-y-3">
            {[1, 2, 3].map((value) => (
              <div
                aria-hidden="true"
                className="bg-neutral-soft h-20 animate-pulse rounded-lg"
                key={value}
              />
            ))}
          </div>
        ) : items.length ? (
          <div className="border-border divide-border divide-y overflow-hidden rounded-xl border">
            {items.map((item) => (
              <article
                key={item.id}
                id={`notification-${item.id}`}
                tabIndex={-1}
                className={`target:ring-brand/40 flex scroll-mt-24 gap-3 px-4 py-4 outline-none target:ring-2 ${item.readAt ? "bg-surface" : "bg-info-soft/45"}`}
              >
                <div className="pt-1">
                  {item.readAt ? (
                    <Circle
                      aria-hidden="true"
                      className="text-muted size-3 fill-current"
                    />
                  ) : (
                    <Circle
                      aria-label="Unread"
                      className="text-brand size-3 fill-current"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold"><button type="button" className="text-left hover:underline" onClick={() => setSelectedId(item.id)}>{item.title}</button></h3>
                        <span className="border-border bg-surface text-muted rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase">
                          {item.priority}
                        </span>
                      </div>
                      <p className="text-muted mt-1 text-xs">
                        {item.sender} ·{" "}
                        {new Date(item.createdAt).toLocaleString("en-GB")}
                      </p>
                    </div>
                    <Button variant="secondary" type="button" className="min-h-9 shrink-0 px-2 text-xs" onClick={() => setSelectedId(item.id)}>View details</Button>
                    {item.readAt ? null : (
                      <Button
                        variant="secondary"
                        type="button"
                        className="min-h-9 shrink-0 px-2 text-xs"
                        onClick={() => read.mutate(item.id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                  <p className="text-foreground/85 mt-3 max-w-3xl text-sm leading-6">
                    {item.message}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <BellRing
              aria-hidden="true"
              className="text-muted mx-auto mb-3 size-10"
            />
            <h3 className="text-foreground text-base font-semibold">
              No notifications yet
            </h3>
            <p className="text-muted mx-auto mt-1 max-w-sm text-sm">
              New in-system updates and assigned messages will appear here.
            </p>
          </div>
        )}
      </div>
    </ProductPanel>
  );
}

function NotificationHistory() {
  const [page, setPage] = useState(1);
  const history = useQuery({
    queryKey: ["notifications", "history", page],
    queryFn: () =>
      apiRequest<NotificationHistoryResponse>("/api/notifications/history", {
        target: "same-origin",
        query: { page, limit: 20 },
      }),
  });
  const items = history.data?.items ?? [];
  const columns: readonly DataTableColumn<NotificationHistoryItem>[] = [
    {
      key: "notification",
      header: "Notification",
      cell: (item) => (
        <div className="max-w-md py-0.5">
          <strong
            className="text-foreground block truncate font-medium"
            title={item.title}
          >
            {item.title}
          </strong>
          <span className="text-muted mt-1 block text-xs whitespace-nowrap">
            {new Date(item.createdAt).toLocaleString("en-GB")}
          </span>
        </div>
      ),
    },
    {
      key: "channel",
      header: "Channels",
      cell: (item) => (
        <div className="flex flex-wrap gap-1.5">
          {item.channel.map((channel) => (
            <span
              className="border-border bg-neutral-soft rounded-md border px-2 py-0.5 text-xs font-medium"
              key={channel}
            >
              {channel.replaceAll("_", " ")}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "recipients",
      header: "Recipients",
      cell: (item) => (
        <span className="tabular-nums">{item.recipientCount}</span>
      ),
    },
    {
      key: "delivered",
      header: "Delivered",
      cell: (item) => <span className="tabular-nums">{item.sentCount}</span>,
    },
    {
      key: "status",
      header: "Delivery status",
      cell: (item) => (
        <StatusBadge tone={item.failedCount > 0 ? "danger" : "success"}>
          {item.failedCount > 0 ? `${item.failedCount} failed` : "Completed"}
        </StatusBadge>
      ),
    },
  ];
  return (
    <ProductPanel
      title="Notification delivery history"
      description="Review recent in-system and email notification deliveries."
    >
      <div className="p-4">
        {history.isPending ? (
          <TableSkeleton rows={6} />
        ) : history.isError ? (
          <Alert>
            Unable to load notification delivery history. Check the backend
            connection and try again.
          </Alert>
        ) : items.length ? (
          <div className="space-y-4">
            <div className="text-muted text-xs">
              Showing {items.length} of{" "}
              {history.data?.pagination.total ?? items.length} sent
              notifications
            </div>
            <DataTable
              columns={columns}
              rows={items}
              getRowKey={(item) => item.id}
            />
            <div className="border-border border-t pt-4">
              <Pagination
                page={history.data?.pagination.page ?? page}
                pageCount={history.data?.pagination.pageCount ?? 1}
                onPageChange={setPage}
              />
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <History
              aria-hidden="true"
              className="text-muted mx-auto mb-3 size-10"
            />
            <h3 className="text-foreground text-base font-semibold">
              No delivery history yet
            </h3>
            <p className="text-muted mx-auto mt-1 max-w-sm text-sm">
              Notifications sent by administrators will be recorded here.
            </p>
          </div>
        )}
      </div>
    </ProductPanel>
  );
}

type NotificationHistoryItem = {
  id: string;
  title: string;
  channel: string[];
  createdAt: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
};

type NotificationHistoryResponse = {
  items: NotificationHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pageCount: number;
  };
};

function ChannelTab({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof BellRing;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-selected={active}
      className={cn(
        "focus-visible:outline-brand inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2",
        active
          ? "bg-brand text-white shadow-sm"
          : "text-muted hover:bg-neutral-soft hover:text-foreground",
      )}
      onClick={onClick}
      role="tab"
      type="button"
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.8} />
      <span>{label}</span>
    </button>
  );
}
