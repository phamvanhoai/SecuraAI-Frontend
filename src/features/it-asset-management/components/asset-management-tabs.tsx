import Link from "next/link";
import { Building2, Server } from "lucide-react";
import { cn } from "@/lib/utils";

export function AssetManagementTabs({
  active,
  canReadServices,
}: {
  active: "assets" | "services";
  canReadServices: boolean;
}) {
  if (!canReadServices) return null;
  return (
    <nav
      aria-label="Asset management views"
      className="border-border bg-surface inline-flex max-w-full flex-wrap gap-1 rounded-xl border p-1"
    >
      {[
        { key: "assets", href: "/assets", label: "Assets", icon: Server },
        {
          key: "services",
          href: "/assets/business-services",
          label: "Business Services",
          icon: Building2,
        },
      ].map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={active === item.key ? "page" : undefined}
          className={cn(
            "focus-visible:outline-brand inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2",
            active === item.key
              ? "bg-brand text-brand-contrast"
              : "text-muted hover:bg-neutral-soft",
          )}
        >
          <item.icon aria-hidden="true" className="size-4" strokeWidth={1.8} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
