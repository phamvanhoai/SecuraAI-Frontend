import { Bell, Boxes, ClipboardCheck, FileStack, FolderOpen, Gauge, History, KeyRound, Library, Settings, ShieldAlert, Users, type LucideIcon } from "lucide-react";

export type NavigationItem = { title: string; href: string; icon: LucideIcon; permission?: string };

export const navigation: readonly NavigationItem[] = [
  { title: "Tổng quan", href: "/dashboard", icon: Gauge },
  { title: "Người dùng", href: "/users", icon: Users },
  { title: "Vai trò & quyền", href: "/roles", icon: KeyRound },
  { title: "Tài sản", href: "/assets", icon: Boxes },
  { title: "Rủi ro", href: "/risks", icon: ShieldAlert },
  { title: "Sự cố", href: "/incidents", icon: Bell },
  { title: "Kiểm soát", href: "/controls", icon: ClipboardCheck },
  { title: "Tuân thủ", href: "/compliance", icon: Library },
  { title: "Kiểm toán", href: "/audits", icon: History },
  { title: "Báo cáo", href: "/reports", icon: FileStack },
  { title: "Thông báo", href: "/notifications", icon: Bell },
  { title: "Tệp tin", href: "/files", icon: FolderOpen },
  { title: "Cài đặt", href: "/settings", icon: Settings },
] as const;
