"use client";

import { PanelLeftClose, PanelLeftOpen, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navigation } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return <>
    <button aria-label="Mở menu" className="fixed left-4 top-4 z-40 rounded-lg border border-border bg-surface p-2 lg:hidden" onClick={() => setMobileOpen(true)}><PanelLeftOpen className="size-5" /></button>
    {mobileOpen ? <button aria-label="Đóng menu" className="fixed inset-0 z-40 bg-black/45 lg:hidden" onClick={() => setMobileOpen(false)} /> : null}
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-[width,transform] lg:sticky lg:top-0 lg:z-20 lg:h-dvh", collapsed ? "lg:w-18" : "lg:w-64", mobileOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full lg:translate-x-0")}>
      <div className="flex h-18 items-center gap-3 border-b border-border px-5"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand text-brand-contrast"><ShieldCheck className="size-5" strokeWidth={1.8} /></span><span className={cn("text-lg font-semibold tracking-tight", collapsed && "lg:sr-only")}>SecuraAI</span><button aria-label="Đóng menu" className="ml-auto rounded-lg p-2 lg:hidden" onClick={() => setMobileOpen(false)}><X className="size-5" strokeWidth={1.8} /></button></div>
      <nav aria-label="Điều hướng chính" className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">{navigation.map((item) => { const active = pathname === item.href; const Icon = item.icon; return <Link aria-current={active ? "page" : undefined} className={cn("relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-sidebar-hover focus-visible:outline-2 focus-visible:outline-brand", active && "bg-brand-soft text-brand before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-brand")} href={item.href} key={item.href} onClick={() => setMobileOpen(false)}><Icon className="size-[18px] shrink-0" strokeWidth={1.8} aria-hidden="true" /><span className={cn(collapsed && "lg:sr-only")}>{item.title}</span></Link>; })}</nav>
      <button className="m-3 hidden min-h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted transition-colors hover:bg-sidebar-hover hover:text-foreground lg:flex" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}>{collapsed ? <PanelLeftOpen className="size-[18px]" strokeWidth={1.8} /> : <PanelLeftClose className="size-[18px]" strokeWidth={1.8} />}<span className={cn(collapsed && "sr-only")}>Thu gọn</span></button>
    </aside>
  </>;
}
