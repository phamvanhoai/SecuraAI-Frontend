"use client";

import {
  ArrowRight,
  Bell,
  Boxes,
  ClipboardCheck,
  FileText,
  ShieldAlert,
  Siren,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  MetricStrip,
  ProductPageHeader,
  ProductPanel,
  type Metric,
} from "@/components/data-display/static-product";
import { Alert } from "@/components/ui/alert";
import { DashboardLoadingSkeleton } from "@/components/feedback/loading-skeletons";
import { useSessionUser } from "@/features/authentication-account";
import { SecurityDashboardView } from "@/features/audit-security-reporting";
import { useEmployeePolicies } from "@/features/policy-compliance-control/hooks/use-policy-acknowledgements";
import { useNotificationInbox } from "@/features/notification-system-logs";
import { cn } from "@/lib/utils";

type EmployeeDestination = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  requiredAnyPermission?: readonly string[];
  /** Which live-count key to badge this card with */
  badgeKey?: "pendingPolicies" | "unreadNotifications";
};

const employeeDestinations: readonly EmployeeDestination[] = [
  {
    title: "Policies",
    description: "Read and acknowledge policies assigned to you.",
    href: "/policies",
    icon: FileText,
    requiredAnyPermission: ["policies.acknowledge"],
    badgeKey: "pendingPolicies",
  },
  {
    title: "Incidents",
    description: "Report an incident or review work available to you.",
    href: "/incidents",
    icon: Siren,
  },
  {
    title: "Notifications",
    description:
      "Review personal notifications and update channel preferences.",
    href: "/notifications",
    icon: Bell,
    badgeKey: "unreadNotifications",
  },
  {
    title: "Owned risks",
    description: "Open risks for which you are the assigned Risk Owner.",
    href: "/risks",
    icon: ShieldAlert,
    requiredAnyPermission: ["risks.read"],
  },
  {
    title: "Owned controls",
    description: "Review controls assigned to you as Control Owner.",
    href: "/controls",
    icon: ClipboardCheck,
    requiredAnyPermission: ["compliance.assess-controls"],
  },
  {
    title: "Assets",
    description: "View assets available within your assigned scope.",
    href: "/assets",
    icon: Boxes,
    requiredAnyPermission: ["assets.read"],
  },
];

function EmployeeDashboard({
  userId,
  fullName,
  permissions,
}: {
  userId: string;
  fullName: string;
  permissions: readonly string[];
}) {
  const hasPolicyPermission = permissions.includes("policies.acknowledge");

  const pendingPoliciesQuery = useEmployeePolicies(
    { page: 1, limit: 1, status: "pending" },
    hasPolicyPermission,
  );

  const notificationsQuery = useNotificationInbox(userId, 1);

  const destinations = employeeDestinations.filter(
    (item) =>
      !item.requiredAnyPermission?.length ||
      item.requiredAnyPermission.some((permission) =>
        permissions.includes(permission),
      ),
  );

  const pendingPolicies = pendingPoliciesQuery.data?.pagination.total;
  const unreadNotifications = notificationsQuery.data?.unreadCount;

  const liveCounts = {
    pendingPolicies,
    unreadNotifications,
  } as const;

  const metrics: Metric[] = [];

  if (hasPolicyPermission) {
    metrics.push({
      label: "Policies pending acknowledgement",
      value: pendingPolicies !== undefined ? String(pendingPolicies) : "—",
      detail: "Assigned policies awaiting your sign-off",
      tone: (pendingPolicies ?? 0) > 0 ? "warning" : "neutral",
      loading: pendingPoliciesQuery.isPending,
    });
  }

  metrics.push({
    label: "Unread notifications",
    value:
      unreadNotifications !== undefined ? String(unreadNotifications) : "—",
    detail: "Messages waiting in your inbox",
    tone: (unreadNotifications ?? 0) > 0 ? "brand" : "neutral",
    loading: notificationsQuery.isPending,
  });

  return (
    <>
      <ProductPageHeader
        title={`Welcome back, ${fullName}`}
        description="Your personal security workspace. Below you'll find your assigned modules and a live summary of items requiring attention."
      />

      {metrics.length > 0 && (
        <MetricStrip ariaLabel="Employee workspace summary" metrics={metrics} />
      )}

      <ProductPanel
        title="Your workspace"
        description="Only modules currently available to your account are shown."
      >
        <nav
          aria-label="Employee workspace"
          className="bg-border grid gap-px sm:grid-cols-2 xl:grid-cols-3"
        >
          {destinations.map((item) => {
            const Icon = item.icon;
            const badgeCount =
              item.badgeKey !== undefined
                ? liveCounts[item.badgeKey]
                : undefined;
            const hasBadge = badgeCount !== undefined && badgeCount > 0;
            const isPending =
              item.badgeKey === "pendingPolicies"
                ? pendingPoliciesQuery.isPending
                : item.badgeKey === "unreadNotifications"
                  ? notificationsQuery.isPending
                  : false;

            return (
              <Link
                className="bg-surface hover:bg-neutral-soft focus-visible:outline-brand group relative flex items-start gap-4 p-5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
                href={item.href}
                key={item.href}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-lg transition-colors",
                    hasBadge
                      ? "bg-warning-soft text-warning"
                      : "bg-brand-soft text-brand",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={1.8}
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <strong className="block text-sm font-semibold">
                      {item.title}
                    </strong>
                    {isPending ? (
                      <span className="bg-neutral-soft inline-block h-4 w-6 animate-pulse rounded" />
                    ) : hasBadge ? (
                      <span className="bg-warning-soft text-warning inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums">
                        {badgeCount}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-muted mt-1 block text-sm leading-5">
                    {item.description}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="text-muted mt-0.5 size-4 shrink-0 translate-x-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                  strokeWidth={1.8}
                />
              </Link>
            );
          })}
        </nav>
      </ProductPanel>
    </>
  );
}

export function DashboardRoleRouter() {
  const session = useSessionUser();

  if (session.isPending) {
    return <DashboardLoadingSkeleton variant="dashboard" />;
  }

  if (!session.data) {
    return (
      <Alert>
        Unable to load your account workspace. Refresh the page or sign in
        again.
      </Alert>
    );
  }

  const roleCodes = session.data.roles.map((role) => role.code);
  const canViewSecurityPosture =
    roleCodes.includes("SECURITY_OFFICER") || roleCodes.includes("EXECUTIVE");

  if (canViewSecurityPosture) return <SecurityDashboardView />;

  return (
    <EmployeeDashboard
      userId={session.data.id}
      fullName={session.data.fullName}
      permissions={session.data.permissions}
    />
  );
}
