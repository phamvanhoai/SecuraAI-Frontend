"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { DashboardLoadingSkeleton } from "@/components/feedback/loading-skeletons";
import { useSessionUser } from "@/features/auth";

export function PasswordChangeGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSessionUser();
  const changingPassword = pathname === "/change-password";
  const mustChangePassword = session.data?.mustChangePassword === true;

  useEffect(() => {
    if (session.isPending) return;
    if (!session.data) {
      router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    if (mustChangePassword && !changingPassword) {
      router.replace("/change-password?required=1");
    }
  }, [
    changingPassword,
    mustChangePassword,
    pathname,
    router,
    session.data,
    session.isPending,
  ]);

  if (
    session.isPending ||
    !session.data ||
    (mustChangePassword && !changingPassword)
  ) {
    return <DashboardLoadingSkeleton variant="form" />;
  }
  return children;
}
