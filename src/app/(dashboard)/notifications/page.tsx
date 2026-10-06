"use client";
import { BellRing, CalendarClock, Mail, Settings2 } from "lucide-react";
import { useState } from "react";
import { ProductPageHeader } from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { useSessionUser } from "@/features/authentication-account";
import {
  ComplianceRemindersManager,
  PersonalNotificationChannelManager,
  SendEmailNotificationManager,
  SendInSystemNotificationManager,
} from "@/features/notification-system-logs";
import { cn } from "@/lib/utils";

type NotificationView = "preferences" | "in-system" | "email" | "reminders";

export default function NotificationsPage() {
  const [activeView, setActiveView] = useState<NotificationView>("preferences");
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
            ) : (
              <PersonalNotificationChannelManager email={accountEmail} />
            )}
          </div>
        </div>
      )}
    </div>
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
