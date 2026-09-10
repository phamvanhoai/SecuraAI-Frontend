import {
  Activity,
  Bell,
  Boxes,
  BrainCircuit,
  ClipboardCheck,
  FileStack,
  FolderOpen,
  Gauge,
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
  "admin" | "security-officer" | "employee" | "executive-auditor";
export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  section: "Tổng quan" | "Quản lý" | "AI & Giám sát" | "Báo cáo" | "Cài đặt";
};
type ModuleDefinition = Omit<NavigationItem, "href"> & { slug: string };

const modules = {
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
  },
  roles: {
    title: "Vai trò & quyền",
    slug: "roles",
    icon: KeyRound,
    section: "Quản lý",
  },
  assets: { title: "Tài sản", slug: "assets", icon: Boxes, section: "Quản lý" },
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
  },
  anomalyMonitoring: {
    title: "Giám sát bất thường",
    slug: "anomaly-monitoring",
    icon: Activity,
    section: "AI & Giám sát",
  },
  aiModels: {
    title: "Mô hình AI",
    slug: "ai-models",
    icon: BrainCircuit,
    section: "AI & Giám sát",
  },
  eventLogs: {
    title: "Log & Sự kiện",
    slug: "event-logs",
    icon: FileStack,
    section: "AI & Giám sát",
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
  admin: Object.values(modules),
  "security-officer": [
    modules.alerts,
    modules.assets,
    modules.risks,
    modules.incidents,
    modules.controls,
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
    modules.risks,
    modules.compliance,
    modules.audits,
    modules.policies,
    modules.reports,
    modules.customDashboard,
    modules.notifications,
    modules.files,
  ],
} as const satisfies Record<PanelKind, readonly ModuleDefinition[]>;

export const panelLabels: Record<PanelKind, string> = {
  admin: "Quản trị hệ thống",
  "security-officer": "Chuyên viên ATTT",
  employee: "Nhân viên",
  "executive-auditor": "Lãnh đạo / Kiểm toán",
};

export function getPanelKind(pathname: string | null): PanelKind {
  const segment = pathname?.split("/")[1];
  return segment === "security-officer" ||
    segment === "employee" ||
    segment === "executive-auditor"
    ? segment
    : "admin";
}

export function getPanelNavigation(
  panel: PanelKind,
): readonly NavigationItem[] {
  return [
    {
      title: "Tổng quan",
      href: `/${panel}`,
      icon: Gauge,
      section: "Tổng quan",
    },
    ...panelModules[panel].map((item) => ({
      ...item,
      href: `/${panel}/${item.slug}`,
    })),
  ];
}

export function panelHasModule(panel: PanelKind, slug: string): boolean {
  return panelModules[panel].some((module) => module.slug === slug);
}

export const navigation = getPanelNavigation("admin");
