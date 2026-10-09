"use client";
import {
  BellRing,
  CalendarClock,
  CheckCheck,
  Circle,
  History,
  Mail,
  Settings2,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/api-client";
import {
  ProductPageHeader,
  ProductPanel,
} from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useSessionUser } from "@/features/authentication-account";
import {
  ComplianceRemindersManager,
  PersonalNotificationChannelManager,
  SendEmailNotificationManager,
  SendInSystemNotificationManager,
} from "@/features/notification-system-logs";
import { cn } from "@/lib/utils";

type NotificationView =
  "inbox" | "history" | "preferences" | "in-system" | "email" | "reminders";
type InboxItem = {
  id: string;
  title: string;
  message: string;
  priority: string;
  sender: string;
  createdAt: string;
  readAt: string | null;
};

export default function NotificationsPage() {
  const [activeView, setActiveView] = useState<NotificationView>("inbox");
  const session = useSessionUser();
  const permissions = session.data?.permissions ?? [];
  const accountEmail = session.data?.email ?? "your account email";
  const isAdmin =
    session.data?.roles.some((role) => role.code === "ADMIN") ?? false;
  const canViewCompliance = permissions.some((permission) =>
    [
      "compliance.assess-controls",
      "compliance.evidence.upload",
      "policies.acknowledge",
    ].includes(permission),
  );
  return (
    <div className="space-y-5">
      <ProductPageHeader
        title="Notifications"
        description={
          isAdmin
            ? "Send targeted notifications and configure how your own eligible notifications are delivered."
            : "Configure your notification channels and review reminders assigned to your account."
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
            className="border-border bg-surface flex w-full flex-wrap gap-1 rounded-xl border p-1"
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
                  icon={BellRing}
                  label="Send In-System Notification"
                  onClick={() => setActiveView("in-system")}
                />
                <ChannelTab
                  active={activeView === "email"}
                  icon={Mail}
                  label="Send Email Notification"
                  onClick={() => setActiveView("email")}
                />
              </>
            ) : null}
            {canViewCompliance ? (
              <ChannelTab
                active={activeView === "reminders"}
                icon={CalendarClock}
                label="My Reminders"
                onClick={() => setActiveView("reminders")}
              />
            ) : null}
          </div>

          <div aria-live="polite" role="tabpanel">
            {activeView === "preferences" ? (
              <PersonalNotificationChannelManager email={accountEmail} />
            ) : activeView === "in-system" && isAdmin ? (
              <SendInSystemNotificationManager />
            ) : activeView === "email" && isAdmin ? (
              <SendEmailNotificationManager />
            ) : activeView === "reminders" && canViewCompliance ? (
              <ComplianceRemindersManager />
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
  const client = useQueryClient();
  const inbox = useQuery({
    queryKey: ["notifications", "inbox"],
    queryFn: () =>
      apiRequest<{ items: InboxItem[]; unreadCount: number }>(
        "/api/notifications/inbox",
        { target: "same-origin", query: { page: 1, limit: 50 } },
      ),
  });
  const read = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/notifications/inbox/${id}/read`, { method: "PATCH" }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["notifications", "inbox"] }),
  });
  const markAll = useMutation({
    mutationFn: () => fetch("/api/notifications/inbox", { method: "PATCH" }),
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["notifications", "inbox"] }),
  });
  const items = inbox.data?.items ?? [];
  return (
    <ProductPanel
      title="My Notifications"
      description={`${inbox.data?.unreadCount ?? 0} unread notifications`}
    >
      <div className="border-border flex items-center justify-between border-b px-5 py-3">
        <p className="text-muted text-sm">Your latest in-system updates</p>
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
      <div className="divide-border divide-y">
        {inbox.isPending ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((value) => (
              <div
                aria-hidden="true"
                className="bg-neutral-soft h-20 animate-pulse rounded-lg"
                key={value}
              />
            ))}
          </div>
        ) : items.length ? (
          items.map((item) => (
            <article
              key={item.id}
              className={`flex gap-3 px-5 py-4 ${item.readAt ? "bg-surface" : "bg-info-soft/45"}`}
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
                      <h3 className="font-semibold">{item.title}</h3>
                      <span className="border-border bg-surface text-muted rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase">
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-muted mt-1 text-xs">
                      {item.sender} ·{" "}
                      {new Date(item.createdAt).toLocaleString("en-GB")}
                    </p>
                  </div>
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
          ))
        ) : (
          <div className="p-10 text-center">No notifications yet.</div>
        )}
      </div>
    </ProductPanel>
  );
}

function NotificationHistory() {
  const history = useQuery({
    queryKey: ["notifications", "history"],
    queryFn: () =>
      apiRequest<{
        items: Array<{
          id: string;
          title: string;
          channel: string[];
          createdAt: string;
          recipientCount: number;
          sentCount: number;
          failedCount: number;
        }>;
      }>("/api/notifications/history", {
        target: "same-origin",
        query: { page: 1, limit: 50 },
      }),
  });
  const items = history.data?.items ?? [];
  return (
    <ProductPanel
      title="Notification delivery history"
      description="Review recent in-system and email notification deliveries."
    >
      <div className="divide-border divide-y">
        {history.isPending ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((value) => (
              <div
                className="bg-neutral-soft h-16 animate-pulse rounded-lg"
                key={value}
              />
            ))}
          </div>
        ) : items.length ? (
          items.map((item) => (
            <div
              className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
              key={item.id}
            >
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-muted mt-1 text-xs">
                  {item.channel.join(" · ")} ·{" "}
                  {new Date(item.createdAt).toLocaleString("en-GB")}
                </p>
              </div>
              <div className="text-right text-sm">
                <p>
                  {item.sentCount}/{item.recipientCount} delivered
                </p>
                <p
                  className={
                    item.failedCount
                      ? "text-danger text-xs"
                      : "text-muted text-xs"
                  }
                >
                  {item.failedCount} failed
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-10 text-center">No sent notifications yet.</div>
        )}
      </div>
    </ProductPanel>
  );
}

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
        "focus-visible:outline-brand flex min-h-11 min-w-fit flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 lg:flex-none",
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
