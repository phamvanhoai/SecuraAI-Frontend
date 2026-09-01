import type { DetailsHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DropdownMenu({ label, children, className, ...props }: DetailsHTMLAttributes<HTMLDetailsElement> & { label: ReactNode; children: ReactNode }) {
  return <details className={cn("relative", className)} {...props}><summary className="cursor-pointer list-none rounded-lg p-2 focus-visible:outline-2 focus-visible:outline-brand">{label}</summary><div className="absolute right-0 z-50 mt-2 min-w-48 rounded-xl border border-border bg-surface p-2 shadow-[0_16px_40px_rgba(18,35,32,.12)]">{children}</div></details>;
}
