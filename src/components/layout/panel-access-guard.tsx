"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { canAccessPanel, defaultPanelPath, type PanelKind } from "@/config/navigation";
import { useSessionUser } from "@/features/auth";

export function PanelAccessGuard({ panel, children }: { panel: PanelKind; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSessionUser();
  const roleCodes = useMemo(
    () => session.data?.roles.map((role) => role.code) ?? [],
    [session.data],
  );
  const allowed = session.data ? canAccessPanel(roleCodes, panel) : false;

  useEffect(() => {
    if (session.isPending) return;
    if (!session.data) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!allowed) router.replace(defaultPanelPath(roleCodes));
  }, [allowed, pathname, roleCodes, router, session.data, session.isPending]);

  if (session.isPending || !allowed) {
    return (
      <div aria-label="Checking panel access" className="space-y-4" role="status">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  return children;
}
