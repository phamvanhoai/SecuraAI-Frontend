"use client";

import { PanelLeftClose, PanelLeftOpen, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  getPanelKind,
  getPanelNavigation,
  panelLabels,
  type NavigationItem,
} from "@/config/navigation";
import { cn } from "@/lib/utils";
import { useSessionUser } from "@/features/auth";

const sectionOrder: readonly NavigationItem["section"][] = [
  "Tổng quan",
  "Quản lý",
  "AI & Giám sát",
  "Báo cáo",
  "Cài đặt",
];

export function Sidebar() {
  const pathname = usePathname();
  const panel = getPanelKind(pathname);
  const session = useSessionUser();
  const canReadAssets =
    session.data?.permissions.includes("assets.read") ?? false;
  const navigation = getPanelNavigation(panel).filter(
    (item) => !item.href.endsWith("/assets") || canReadAssets,
  );
  const sections = sectionOrder
    .map((label) => ({
      label,
      items: navigation.filter((item) => item.section === label),
    }))
    .filter((section) => section.items.length > 0);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Mở menu"
        className="border-border bg-surface text-foreground fixed top-3 left-4 z-40 rounded-lg border p-2 shadow-sm lg:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <PanelLeftOpen className="size-5" />
      </button>
      {mobileOpen ? (
        <button
          aria-label="Đóng menu"
          className="fixed inset-0 z-40 bg-[#031022]/65 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-50 flex flex-col shadow-[8px_0_28px_rgba(3,15,34,0.08)] transition-[width,transform] lg:sticky lg:top-0 lg:z-20 lg:h-dvh",
          collapsed ? "lg:w-16" : "lg:w-[196px]",
          mobileOpen
            ? "w-72 translate-x-0"
            : "w-72 -translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-white/10 px-4">
          <span className="bg-brand grid size-9 shrink-0 place-items-center rounded-lg text-white">
            <ShieldCheck className="size-5" strokeWidth={1.8} />
          </span>
          <span className={cn("min-w-0", collapsed && "lg:sr-only")}>
            <span className="block text-base font-semibold tracking-tight text-white">
              SecuraAI
            </span>
            <span className="block truncate text-[10px] text-slate-400">
              {panelLabels[panel]}
            </span>
          </span>
          <button
            aria-label="Đóng menu"
            className="ml-auto rounded-lg p-2 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-5" />
          </button>
        </div>
        <nav
          aria-label={`Điều hướng panel ${panelLabels[panel]}`}
          className="flex-1 overflow-y-auto px-2 py-3"
        >
          {sections.map((section, sectionIndex) => (
            <div
              className={cn(
                sectionIndex > 0 && "mt-3 border-t border-white/8 pt-3",
              )}
              key={section.label}
            >
              <p
                className={cn(
                  "mb-1.5 px-2.5 text-[9px] font-semibold tracking-[0.08em] text-slate-500 uppercase",
                  collapsed && "lg:sr-only",
                )}
              >
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "hover:bg-sidebar-hover focus-visible:outline-brand flex min-h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-slate-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2",
                        active &&
                          "bg-brand text-white shadow-[0_6px_18px_rgba(23,105,246,0.28)]",
                      )}
                      href={item.href}
                      key={item.href}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon
                        className="size-[18px] shrink-0"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      <span className={cn(collapsed && "lg:sr-only")}>
                        {item.title}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <button
          className="hover:bg-sidebar-hover m-3 hidden min-h-10 items-center gap-3 rounded-lg px-3 text-sm text-slate-400 transition-colors hover:text-white lg:flex"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-[18px]" />
          ) : (
            <PanelLeftClose className="size-[18px]" />
          )}
          <span className={cn(collapsed && "sr-only")}>Thu gọn</span>
        </button>
      </aside>
    </>
  );
}
