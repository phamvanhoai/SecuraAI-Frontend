import {
  Activity,
  Bell,
  Boxes,
  BrainCircuit,
  CalendarClock,
  ClipboardCheck,
  FileStack,
  FolderOpen,
  Gauge,
  GitBranch,
  GraduationCap,
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
  section: "Tổng quan" | "Quản lý" | "AI & Giám sát" | "Báo cáo" | "Cài đặt";
  requiredAnyPermission?: readonly string[];
};
type ModuleDefinition = Omit<NavigationItem, "href"> & { slug: string };

const modules = {
  alerts: {
    title: "Cảnh báo",
    slug: "alerts",
    requiredAnyPermission: ["ai-alerts.read"],
    icon: Bell,
    section: "Tổng quan",
  },
  users: {
    title: "Người dùng",
    slug: "users",
    icon: Users,
    section: "Quản lý",
    requiredAnyPermission: ["users.read"],
  },
  roles: {
    title: "Vai trò & quyền",
    slug: "roles",
    icon: KeyRound,
    section: "Quản lý",
    requiredAnyPermission: ["roles.read"],
  },
  assets: {
    title: "Tài sản",
    slug: "assets",
    icon: Boxes,
    section: "Quản lý",
    requiredAnyPermission: ["assets.read"],
  },
  risks: {
    title: "Rủi ro",
    slug: "risks",
    requiredAnyPermission: ["risks.read", "risks.create", "risks.update"],
    icon: ShieldAlert,
    section: "Quản lý",
  },
  incidents: {
    title: "Sự cố",
    slug: "incidents",
    requiredAnyPermission: [
      "incidents.report",
      "incidents.assign",
      "incidents.update-progress",
    ],
    icon: Bell,
    section: "Quản lý",
  },
  controls: {
    title: "Kiểm soát",
    slug: "controls",
    requiredAnyPermission: [
      "compliance.assess-controls",
      "compliance.map-controls",
    ],
    icon: ClipboardCheck,
    section: "Quản lý",
  },
  compliance: {
    title: "Tuân thủ",
    slug: "compliance",
    requiredAnyPermission: [
      "compliance.assess-controls",
      "compliance.map-controls",
      "compliance.evidence.upload",
    ],
    icon: Library,
    section: "Quản lý",
  },
  audits: {
    title: "Kiểm toán",
    slug: "audits",
    icon: History,
    section: "Quản lý",
  },
  policies: {
    title: "Chính sách",
    slug: "policies",
    icon: ScrollText,
    section: "Quản lý",
    requiredAnyPermission: [
      "policies.create",
      "policies.update",
      "policies.publish",
      "policies.acknowledge",
    ],
  },
  training: {
    title: "Đào tạo",
    slug: "training",
    icon: GraduationCap,
    section: "Quản lý",
    requiredAnyPermission: [
      "training-courses.read",
      "training-assessments.take",
      "training-completion.read",
      "training-certificates.read-own",
    ],
  },
  workflowDefinitions: {
    title: "Quy trình phê duyệt",
    slug: "workflow-definitions",
    icon: GitBranch,
    section: "Quản lý",
    requiredAnyPermission: ["workflows.read"],
  },
  anomalyMonitoring: {
    title: "Giám sát bất thường",
    slug: "anomaly-monitoring",
    icon: Activity,
    section: "AI & Giám sát",
    requiredAnyPermission: ["ai-alerts.read"],
  },
  aiModels: {
    title: "Mô hình AI",
    slug: "ai-models",
    icon: BrainCircuit,
    section: "AI & Giám sát",
    requiredAnyPermission: ["ai-models.read"],
  },
  eventLogs: {
    title: "Log & Sự kiện",
    slug: "event-logs",
    icon: FileStack,
    section: "AI & Giám sát",
    requiredAnyPermission: ["log-sources.read"],
  },
  integrationSchedules: {
    title: "Sync Schedules",
    slug: "integrations/schedules",
    icon: CalendarClock,
    section: "AI & Giám sát",
    requiredAnyPermission: ["integrations.read"],
  },
  reports: {
    title: "Báo cáo",
    slug: "reports",
    icon: FileStack,
    section: "Báo cáo",
  },
  customDashboard: {
    title: "Dashboard tùy chỉnh",
    slug: "custom-dashboard",
    icon: LayoutDashboard,
    section: "Báo cáo",
  },
  notifications: {
    title: "Thông báo",
    slug: "notifications",
    icon: Bell,
    section: "Báo cáo",
  },
  files: {
    title: "Tệp tin",
    slug: "files",
    icon: FolderOpen,
    section: "Báo cáo",
  },
  settings: {
    title: "Cài đặt",
    slug: "settings",
    icon: Settings,
    section: "Cài đặt",
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
    modules.training,
    modules.workflowDefinitions,
    modules.anomalyMonitoring,
    modules.aiModels,
    modules.eventLogs,
    modules.reports,
    modules.customDashboard,
    modules.notifications,
    modules.files,
    modules.settings,
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
    modules.training,
    modules.workflowDefinitions,
    modules.anomalyMonitoring,
    modules.aiModels,
    modules.eventLogs,
    modules.reports,
    modules.customDashboard,
    modules.notifications,
    modules.files,
    modules.settings,
  ],
  "security-officer": [
    modules.alerts,
    modules.assets,
    modules.risks,
    modules.incidents,
    modules.controls,
    modules.policies,
    modules.training,
    modules.workflowDefinitions,
    modules.anomalyMonitoring,
    modules.aiModels,
    modules.eventLogs,
    modules.reports,
    modules.notifications,
    modules.files,
  ],
  employee: [
    modules.assets,
    modules.training,
    modules.policies,
    modules.incidents,
    modules.notifications,
    modules.files,
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
    modules.files,
  ],
} as const satisfies Record<PanelKind, readonly ModuleDefinition[]>;

export const panelLabels: Record<PanelKind, string> = {
  dashboard: "Dashboard",
  admin: "Quản trị hệ thống",
  "security-officer": "Chuyên viên ATTT",
  employee: "Nhân viên",
  "executive-auditor": "Lãnh đạo / Kiểm toán",
};

export const panelRoleCodes: Record<PanelKind, string> = {
  dashboard: "ADMIN",
  admin: "ADMIN",
  "security-officer": "SECURITY_OFFICER",
  employee: "EMPLOYEE",
  "executive-auditor": "EXECUTIVE_AUDITOR",
};

const panelPriority: readonly PanelKind[] = [
  "admin",
  "security-officer",
  "executive-auditor",
  "employee",
];

export function allowedPanels(
  roleCodes: readonly string[],
): readonly PanelKind[] {
  if (roleCodes.includes("ADMIN")) return ["admin"];
  return roleCodes.length ? ["dashboard"] : [];
}

export function defaultPanelPath(roleCodes: readonly string[]): string {
  return roleCodes.includes("ADMIN")
    ? "/admin"
    : roleCodes.length
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
    return roleCodes.length > 0 && !roleCodes.includes("ADMIN");
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
      : roleCodes.includes("ADMIN") ? "admin" : "dashboard";
}

export function getPanelNavigation(
  panel: PanelKind,
  _roleCodes: readonly string[] = [],
  _permissions: readonly string[] = [],
): readonly NavigationItem[] {
  const base: NavigationItem[] = [
    {
      title: "Tổng quan",
      href: `/${panel}`,
      icon: Gauge,
      section: "Tổng quan",
    },
    ...panelModules[panel].map((item) => ({
      ...item,
      href: `/${item.slug}`,
    })),
  ];

  // Add direct-href items that are not panel-scoped
  if (panel === "admin") {
    base.splice(base.findIndex((i) => i.title === "Mô hình AI") + 1, 0, {
      title: "Sync Schedules",
      href: "/integrations/schedules",
      icon: CalendarClock,
      section: "AI & Giám sát",
      requiredAnyPermission: ["integrations.read"],
    });
  }

  return base;
}

export function panelHasModule(panel: PanelKind, slug: string): boolean {
  return panelModules[panel].some((module) => module.slug === slug);
}

export const navigation = getPanelNavigation("admin");
