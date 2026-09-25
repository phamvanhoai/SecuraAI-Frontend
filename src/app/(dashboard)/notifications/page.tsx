"use client";
import { ProductPageHeader } from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { useSessionUser } from "@/features/authentication-account";
import { ComplianceRemindersManager } from "@/features/notification-system-logs";

export default function NotificationsPage() {
  const session = useSessionUser();
  const permissions = session.data?.permissions ?? [];
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
        description="Review deadline reminders assigned to your account."
        showSampleNotice={false}
      />
      {session.isPending ? (
        <div
          aria-label="Loading notifications"
          className="bg-neutral-soft h-56 animate-pulse rounded-xl"
        />
      ) : session.isError ? (
        <Alert>Unable to check your notification access.</Alert>
      ) : !canViewCompliance ? (
        <Alert>No reminder types are available for this account.</Alert>
      ) : (
        <ComplianceRemindersManager />
      )}
    </div>
  );
}
