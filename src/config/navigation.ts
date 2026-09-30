import {
  Activity,
  Bell,
  Boxes,
  BrainCircuit,
  CalendarClock,
  ClipboardCheck,
  FileStack,
  Gauge,
  GitBranch,
  History,
  KeyRound,
  LayoutDashboard,
  Library,
  ScrollText,
  Settings,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

export type PanelKind =
  "admin" | "dashboard" | "security-officer" | "employee" | "executive-auditor";
export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  section:
    "Overview" | "Management" | "AI & Monitoring" | "Reporting" | "Settings";
  requiredAnyPermission?: readonly string[];
};
type ModuleDefinition = Omit<NavigationItem, "href"> & { slug: string };

const modules = {
  alerts: {
    title: "Alerts",
    slug: "alerts",
    requiredAnyPermission: ["ai-alerts.read", "ai-alerts.thresholds.manage"],
    icon: Bell,
    section: "Overview",
  },
  users: {
    title: "Users",
    slug: "users",
    icon: Users,
    section: "Management",
    requiredAnyPermission: ["users.read"],
  },
  roles: {
    title: "Roles & Permissions",
    slug: "roles",
    icon: KeyRound,
    section: "Management",
    requiredAnyPermission: ["roles.read"],
  },
  assets: {
    title: "Assets",
    slug: "assets",
    icon: Boxes,
    section: "Management",
    requiredAnyPermission: ["assets.read"],
  },
  risks: {
    title: "Risks",
    slug: "risks",
    requiredAnyPermission: ["risks.read", "risks.create", "risks.update"],
    icon: ShieldAlert,
    section: "Management",
  },
  incidents: {
    title: "Incidents",
    slug: "incidents",
    requiredAnyPermission: [
      "incidents.read",
      "incidents.report",
      "incidents.assign",
      "incidents.update-progress",
    ],
    icon: Bell,
    section: "Management",
  },
  controls: {
    title: "Controls",
    slug: "controls",
    requiredAnyPermission: [
      "compliance.assess-controls",
      "compliance.map-controls",
    ],
    icon: ClipboardCheck,
    section: "Management",
  },
  compliance: {
    title: "Compliance",
    slug: "compliance",
    requiredAnyPermission: [
      "compliance.assess-controls",
      "compliance.map-controls",
      "compliance.evidence.upload",
    ],
    icon: Library,
    section: "Management",
  },
  audits: {
    title: "Audit",
    slug: "audits",
    icon: History,
    requiredAnyPermission: ["audit.read"],
    section: "Management",
  },
  policies: {
    title: "Policies",
    slug: "policies",
    icon: ScrollText,
    section: "Management",
    requiredAnyPermission: [
      "policies.create",
      "policies.update",
      "policies.publish",
      "policies.acknowledge",
    ],
  },
  workflowDefinitions: {
    title: "Approval Workflows",
    slug: "workflow-definitions",
    icon: GitBranch,
    section: "Management",
    requiredAnyPermission: ["workflows.read"],
  },
  anomalyMonitoring: {
    title: "Anomaly Monitoring",
    slug: "anomaly-monitoring",
    icon: Activity,
    section: "AI & Monitoring",
    requiredAnyPermission: ["ai-alerts.read"],
  },
  aiModels: {
    title: "AI Models",
    slug: "ai-models",
    icon: BrainCircuit,
    section: "AI & Monitoring",
    requiredAnyPermission: ["ai-models.read"],
  },
  eventLogs: {
    title: "Event & Log Sources",
    slug: "event-logs",
    icon: FileStack,
    section: "AI & Monitoring",
    requiredAnyPermission: ["log-sources.read"],
  },
  integrationSchedules: {
    title: "Sync Schedules",
    slug: "integrations/schedules",
    icon: CalendarClock,
    section: "AI & Monitoring",
    requiredAnyPermission: ["integrations.read"],
  },
  reports: {
    title: "Reports",
    slug: "reports",
    icon: FileStack,
    requiredAnyPermission: ["reports.read"],
    section: "Reporting",
  },
  customDashboard: {
    title: "Custom Dashboard",
    slug: "custom-dashboard",
    icon: LayoutDashboard,
    requiredAnyPermission: ["reports.read"],
    section: "Reporting",
  },
  notifications: {
    title: "Notifications",
    slug: "notifications",
    icon: Bell,
    section: "Reporting",
  },
  settings: {
    title: "Settings",
    slug: "settings",
    icon: Settings,
    requiredAnyPermission: ["system-settings.read"],
    section: "Settings",
  },
  loginHistory: {
    title: "Login history",
    slug: "login-history",
    icon: History,
    section: "Reporting",
    requiredAnyPermission: ["login-history.read"],
  },
} as const satisfies Record<string, ModuleDefinition>;

export const panelModules = {
  dashboard: [
    modules.alerts,
    modules.users,
    modules.roles,
    modules.assets,
    modules.risks,
    modules.incidents,
    modules.controls,
    modules.compliance,
    modules.audits,
    modules.policies,
    modules.workflowDefinitions,
    modules.anomalyMonitoring,
    modules.aiModels,
    modules.eventLogs,
    modules.reports,
    modules.customDashboard,
    modules.notifications,
    modules.settings,
    modules.loginHistory,
  ],
  admin: [
    modules.alerts,
    modules.users,
    modules.roles,
    modules.assets,
    modules.risks,
    modules.incidents,
    modules.controls,
    modules.compliance,
    modules.audits,
    modules.policies,
    modules.workflowDefinitions,
    modules.anomalyMonitoring,
    modules.aiModels,
    modules.eventLogs,
    modules.reports,
    modules.customDashboard,
    modules.notifications,
    modules.settings,
    modules.loginHistory,
  ],
  "security-officer": [
    modules.alerts,
    modules.assets,
    modules.risks,
    modules.incidents,
    modules.controls,
    modules.policies,
    modules.workflowDefinitions,
    modules.anomalyMonitoring,
    modules.aiModels,
    modules.eventLogs,
    modules.reports,
    modules.notifications,
  ],
  employee: [
    modules.assets,
    modules.policies,
    modules.incidents,
    modules.notifications,
  ],
  "executive-auditor": [
    modules.assets,
    modules.anomalyMonitoring,
    modules.risks,
    modules.compliance,
    modules.audits,
    modules.policies,
    modules.workflowDefinitions,
    modules.reports,
    modules.customDashboard,
    modules.notifications,
  ],
} as const satisfies Record<PanelKind, readonly ModuleDefinition[]>;

export const panelLabels: Record<PanelKind, string> = {
  dashboard: "Dashboard",
  admin: "System Administration",
  "security-officer": "Security Officer",
  employee: "Employee",
  "executive-auditor": "Executive / Auditor",
};

export const panelRoleCodes: Record<PanelKind, string> = {
  dashboard: "ADMIN",
  admin: "ADMIN",
  "security-officer": "SECURITY_OFFICER",
  employee: "EMPLOYEE",
  "executive-auditor": "EXECUTIVE",
};

const panelPriority: readonly PanelKind[] = [
  "admin",
  "security-officer",
  "executive-auditor",
  "employee",
];

const nonAdminRoles = ["SECURITY_OFFICER", "EXECUTIVE", "EMPLOYEE"] as const;

function hasKnownNonAdminRole(roleCodes: readonly string[]): boolean {
  return nonAdminRoles.some((role) => roleCodes.includes(role));
}

export function allowedPanels(
  roleCodes: readonly string[],
): readonly PanelKind[] {
  if (roleCodes.includes("ADMIN")) return ["admin"];
  return hasKnownNonAdminRole(roleCodes) ? ["dashboard"] : [];
}

export function defaultPanelPath(roleCodes: readonly string[]): string {
  return roleCodes.includes("ADMIN")
    ? "/admin"
    : hasKnownNonAdminRole(roleCodes)
      ? "/dashboard"
      : "/profile";
}

export function panelFromPath(pathname: string): PanelKind | null {
  const segment = pathname.split("/")[1];
  return panelPriority.find((panel) => panel === segment) ?? null;
}

export function canAccessPanel(
  roleCodes: readonly string[],
  panel: PanelKind,
): boolean {
  if (panel === "dashboard")
    return hasKnownNonAdminRole(roleCodes) && !roleCodes.includes("ADMIN");
  return roleCodes.includes(panelRoleCodes[panel]);
}

export function canAccessNavigationItem(
  permissions: readonly string[],
  item: NavigationItem,
  _roleCodes: readonly string[] = [],
): boolean {
  return (
    !item.requiredAnyPermission?.length ||
    item.requiredAnyPermission.some((permission) =>
      permissions.includes(permission),
    )
  );
}

export function getPanelKind(
  pathname: string | null,
  roleCodes: readonly string[] = [],
): PanelKind {
  const segment = pathname?.split("/")[1];
  return segment === "dashboard"
    ? "dashboard"
    : segment === "security-officer" ||
        segment === "employee" ||
        segment === "executive-auditor"
      ? segment
      : roleCodes.includes("ADMIN")
        ? "admin"
        : "dashboard";
}

export function getPanelNavigation(
  panel: PanelKind,
  _roleCodes: readonly string[] = [],
  _permissions: readonly string[] = [],
): readonly NavigationItem[] {
  const base: NavigationItem[] = [
    {
      title: "Overview",
      href: `/${panel}`,
      icon: Gauge,
      section: "Overview",
    },
    ...panelModules[panel].map((item) => ({
      ...item,
      href: `/${item.slug}`,
    })),
  ];

  // Add direct-href items that are not panel-scoped
  if (panel === "admin") {
    base.splice(base.findIndex((i) => i.title === "AI Models") + 1, 0, {
      title: "Sync Schedules",
      href: "/integrations/schedules",
      icon: CalendarClock,
      section: "AI & Monitoring",
      requiredAnyPermission: ["integrations.read"],
    });
  }

  return base;
}

export function panelHasModule(panel: PanelKind, slug: string): boolean {
  return panelModules[panel].some((module) => module.slug === slug);
}

export const navigation = getPanelNavigation("admin");
