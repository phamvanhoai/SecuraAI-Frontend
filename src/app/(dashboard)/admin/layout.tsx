import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PanelAccessGuard } from "@/components/layout/panel-access-guard";

export const metadata: Metadata = { title: "Admin Dashboard" };
export default function AdminPanelLayout({ children }: { children: ReactNode }) {
  return <PanelAccessGuard panel="admin">{children}</PanelAccessGuard>;
}
