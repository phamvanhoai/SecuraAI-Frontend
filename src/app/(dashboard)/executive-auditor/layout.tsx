import type { ReactNode } from "react";
import { PanelAccessGuard } from "@/components/layout/panel-access-guard";
export default function ExecutiveAuditorPanelLayout({ children }: { children: ReactNode }) {
  return <PanelAccessGuard panel="dashboard">{children}</PanelAccessGuard>;
}
