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
  GraduationCap,
  History,
  KeyRound,
  LifeBuoy,
  LayoutDashboard,
  Library,
  ListRestart,
  ScrollText,
  Settings,
  ShieldAlert,
  Users,
  type LucideIcon,
} from "lucide-react";

export type PanelKind = "admin" | "dashboard";
export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  section: "Tổng quan" | "Quản lý" | "AI & Giám sát" | "Báo cáo" | "Cài đặt";
  requiredAnyPermission?: readonly string[];
  requiredAnyRole?: readonly string[];
};
type ModuleDefinition = Omit<NavigationItem, "href"> & { slug: string };

const modules = {
  loginHistory: {
    title: "Login History",
    slug: "login-history",
    icon: ListRestart,
    section: "Quản lý",
    requiredAnyPermission: ["login-history.read"],
    requiredAnyRole: ["ADMIN", "SECURITY_OFFICER"],
  },
  alerts: {
    title: "Cảnh báo",
    slug: "alerts",
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
  mfaRecovery: {
    title: "Khôi phục MFA",
    slug: "mfa-recovery",
    icon: LifeBuoy,
    section: "Quản lý",
    requiredAnyPermission: ["mfa-recovery.manage"],
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
    icon: ShieldAlert,
    section: "Quản lý",
  },
  incidents: {
    title: "Sự cố",
    slug: "incidents",
    icon: Bell,
    section: "Quản lý",
  },
  controls: {
    title: "Kiểm soát",
    slug: "controls",
    icon: ClipboardCheck,
    section: "Quản lý",
  },
  compliance: {
    title: "Tuân thủ",
    slug: "compliance",
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
    ],
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
  admin: [
    modules.alerts,
    modules.users,
    modules.roles,
    modules.mfaRecovery,
    modules.loginHistory,
    modules.assets,
    modules.risks,
    modules.incidents,
    modules.controls,
    modules.compliance,
    modules.audits,
    modules.policies,
    modules.training,
    modules.anomalyMonitoring,
    modules.aiModels,
    modules.eventLogs,
    modules.reports,
    modules.customDashboard,
    modules.notifications,
    modules.files,
    modules.settings,
  ],
  dashboard: [
    modules.alerts,
    modules.loginHistory,
    modules.assets,
    modules.risks,
    modules.incidents,
    modules.controls,
    modules.compliance,
    modules.audits,
    modules.policies,
    modules.training,
    modules.anomalyMonitoring,
    modules.aiModels,
    modules.eventLogs,
    modules.integrationSchedules,
    modules.reports,
    modules.customDashboard,
    modules.notifications,
    modules.files,
  ],
} as const satisfies Record<PanelKind, readonly ModuleDefinition[]>;

export const panelLabels: Record<PanelKind, string> = {
  admin: "Quản trị hệ thống",
  dashboard: "Không gian làm việc",
};

const nonAdminRoleCodes = new Set([
  "SECURITY_OFFICER",
  "EMPLOYEE",
  "EXECUTIVE",
  "EXECUTIVE_AUDITOR",
]);

export function allowedPanels(
  roleCodes: readonly string[],
): readonly PanelKind[] {
  const panels: PanelKind[] = [];
  if (roleCodes.includes("ADMIN")) panels.push("admin");
  if (roleCodes.some((roleCode) => nonAdminRoleCodes.has(roleCode)))
    panels.push("dashboard");
  return panels;
}

export function defaultPanelPath(roleCodes: readonly string[]): string {
  const panel = allowedPanels(roleCodes)[0];
  return panel ? `/${panel}` : "/profile";
}

export function panelFromPath(pathname: string): PanelKind | null {
  const segment = pathname.split("/")[1];
  if (segment === "admin") return "admin";
  if (segment === "dashboard") return "dashboard";
  return null;
}

export function canAccessPanel(
  roleCodes: readonly string[],
  panel: PanelKind,
): boolean {
  return allowedPanels(roleCodes).includes(panel);
}

export function canAccessNavigationItem(
  permissions: readonly string[],
  item: NavigationItem,
  roles: readonly string[] = [],
): boolean {
  return (
    (!item.requiredAnyRole?.length ||
      item.requiredAnyRole.some((role) => roles.includes(role))) &&
    (!item.requiredAnyPermission?.length ||
      item.requiredAnyPermission.some((permission) =>
        permissions.includes(permission),
      ))
  );
}

export function getPanelKind(pathname: string | null): PanelKind {
  const segment = pathname?.split("/")[1];
  return segment === "admin" ? "admin" : "dashboard";
}

export function getPanelNavigation(
  panel: PanelKind,
): readonly NavigationItem[] {
  const base: NavigationItem[] = [
    {
      title: "Tổng quan",
      href: panel === "admin" ? "/admin" : "/dashboard",
      icon: Gauge,
      section: "Tổng quan",
    },
    ...panelModules[panel].map((item) => ({
      ...item,
      href: panel === "admin" ? `/admin/${item.slug}` : `/${item.slug}`,
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
