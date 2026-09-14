import type { ReactNode } from "react";
import { PanelAccessGuard } from "@/components/layout/panel-access-guard";
export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return <PanelAccessGuard panel="admin">{children}</PanelAccessGuard>;
}
