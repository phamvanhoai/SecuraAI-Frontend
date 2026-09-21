"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { RootLoadingSkeleton } from "@/components/feedback/loading-skeletons";
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
    // The guard wraps the entire dashboard shell. Render the same shell while
    // the session is pending so F5 cannot replace the sidebar with a body-only
    // skeleton and then shift the layout when the session arrives.
    return <RootLoadingSkeleton />;
  }
  return children;
}
