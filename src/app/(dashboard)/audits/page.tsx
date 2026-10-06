"use client";

import { ProductPageHeader } from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { useSessionUser } from "@/features/authentication-account";
import { UserActivityAuditLogManager } from "@/features/audit-security-reporting";

export default function AuditsPage() {
  const session = useSessionUser();
  const isAdmin =
    session.data?.roles.some((role) => role.code === "ADMIN") ?? false;
  return (
    <div className="space-y-5">
      <ProductPageHeader
        title="User Activity Audit Log"
        description="Monitor accountable user actions across SecuraAI, including affected resources and outcomes."
        showSampleNotice={false}
      />
      {session.isPending ? (
        <div
          aria-label="Loading audit access"
          className="bg-neutral-soft h-72 animate-pulse rounded-xl"
        />
      ) : session.isError ? (
        <Alert>Unable to verify your audit-log access.</Alert>
      ) : !isAdmin ? (
        <Alert>This audit log is available to administrators only.</Alert>
      ) : (
        <UserActivityAuditLogManager />
      )}
    </div>
  );
}
