import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Header />
        <main className="mx-auto max-w-[1600px] px-4 py-5 md:px-5 md:py-5">
          {children}
        </main>
      </div>
    </div>
  );
}
