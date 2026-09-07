"use client";

import {
  type DetailsHTMLAttributes,
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import { cn } from "@/lib/utils";

export function DropdownMenu({
  label,
  children,
  className,
  ...props
}: DetailsHTMLAttributes<HTMLDetailsElement> & {
  label: ReactNode;
  children: ReactNode;
}) {
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function closeWhenClickingOutside(event: PointerEvent): void {
      const menu = menuRef.current;
      if (menu?.open && !menu.contains(event.target as Node)) menu.open = false;
    }

    function closeWithEscape(event: KeyboardEvent): void {
      const menu = menuRef.current;
      if (event.key !== "Escape" || !menu?.open) return;
      menu.open = false;
      menu.querySelector("summary")?.focus();
    }

    document.addEventListener("pointerdown", closeWhenClickingOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeWhenClickingOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  return (
    <details ref={menuRef} className={cn("relative", className)} {...props}>
      <summary className="focus-visible:outline-brand cursor-pointer list-none rounded-lg p-2 focus-visible:outline-2">
        {label}
      </summary>
      <div className="border-border bg-surface absolute right-0 z-50 mt-2 min-w-48 rounded-xl border p-2 shadow-[0_16px_40px_rgba(18,35,32,.12)]">
        {children}
      </div>
    </details>
  );
}
