"use client";

import { SunMoon } from "lucide-react";

export function ThemeToggle() {
  function toggle() { const next = !document.documentElement.classList.contains("dark"); document.documentElement.classList.toggle("dark", next); localStorage.setItem("securaai-theme", next ? "dark" : "light"); }
  return <button className="rounded-lg p-2.5 text-muted transition-colors hover:bg-neutral-soft hover:text-foreground focus-visible:outline-2 focus-visible:outline-brand" aria-label="Chuyển giao diện sáng hoặc tối" onClick={toggle}><SunMoon className="size-5" strokeWidth={1.8} /></button>;
}
