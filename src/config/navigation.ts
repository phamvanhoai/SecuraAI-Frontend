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

export type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
};

export const navigation: readonly NavigationItem[] = [
  { title: "Tổng quan", href: "/dashboard", icon: Gauge },
  { title: "Cảnh báo", href: "/alerts", icon: Bell },
  { title: "Người dùng", href: "/users", icon: Users },
  { title: "Vai trò & quyền", href: "/roles", icon: KeyRound },
  { title: "Tài sản", href: "/assets", icon: Boxes },
  { title: "Rủi ro", href: "/risks", icon: ShieldAlert },
  { title: "Sự cố", href: "/incidents", icon: Bell },
  { title: "Kiểm soát", href: "/controls", icon: ClipboardCheck },
  { title: "Tuân thủ", href: "/compliance", icon: Library },
  { title: "Kiểm toán", href: "/audits", icon: History },
  { title: "Chính sách", href: "/policies", icon: ScrollText },
  { title: "Đào tạo", href: "/training", icon: GraduationCap },
  { title: "Giám sát bất thường", href: "/anomaly-monitoring", icon: Activity },
  { title: "Mô hình AI", href: "/ai-models", icon: BrainCircuit },
  { title: "Log & Sự kiện", href: "/event-logs", icon: FileStack },
  { title: "Báo cáo", href: "/reports", icon: FileStack },
  {
    title: "Dashboard tùy chỉnh",
    href: "/custom-dashboard",
    icon: LayoutDashboard,
  },
  { title: "Thông báo", href: "/notifications", icon: Bell },
  { title: "Tệp tin", href: "/files", icon: FolderOpen },
  { title: "Cài đặt", href: "/settings", icon: Settings },
] as const;
