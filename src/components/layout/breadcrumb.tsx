"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getPanelKind, panelLabels } from "@/config/navigation";

export function Breadcrumb({
  title,
  panelLabel,
}: {
  title: string;
  panelLabel?: string | undefined;
}) {
  const panel = getPanelKind(usePathname());
  return (
    <nav aria-label="Breadcrumb" className="text-muted mb-5 text-sm">
      <ol className="flex items-center gap-2">
        <li>
          <Link
            className="hover:text-foreground transition-colors"
            href={`/${panel}`}
          >
            {panelLabel ?? panelLabels[panel]}
          </Link>
        </li>
        <li aria-hidden="true" className="text-border">
          /
        </li>
        <li aria-current="page" className="text-foreground font-medium">
          {title}
        </li>
      </ol>
    </nav>
  );
}
