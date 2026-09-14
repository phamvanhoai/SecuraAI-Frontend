import type { ReactNode } from "react";
import { PanelAccessGuard } from "@/components/layout/panel-access-guard";
export default function SecurityOfficerPanelLayout({ children }: { children: ReactNode }) {
  return <PanelAccessGuard panel="security-officer">{children}</PanelAccessGuard>;
}
