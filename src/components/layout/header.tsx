"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronDown, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { sessionUserSchema, type AuthSessionUser } from "@/features/auth";
import { ThemeToggle } from "./theme-toggle";

async function getSessionUser(): Promise<AuthSessionUser | null> {
  const response = await fetch("/api/auth/session", { cache: "no-store" });
  if (!response.ok) return null;
  const payload: unknown = await response.json();
  if (typeof payload !== "object" || payload === null || !("data" in payload))
    return null;
  const data = (payload as { data?: unknown }).data;
  if (typeof data !== "object" || data === null || !("user" in data))
    return null;
  const parsed = sessionUserSchema.safeParse((data as { user?: unknown }).user);
  return parsed.success ? parsed.data : null;
}

export function Header() {
  const router = useRouter();
  const session = useQuery({
    queryKey: ["auth", "session"],
    queryFn: getSessionUser,
    retry: false,
  });
  const user = session.data;

  async function logout(): Promise<void> {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="border-border bg-surface/95 sticky top-0 z-30 flex h-14 items-center justify-end gap-1 border-b px-4 shadow-[0_1px_10px_rgba(20,43,83,0.035)] backdrop-blur md:px-5">
      <button
        aria-label="Thông báo"
        className="text-muted hover:bg-neutral-soft hover:text-foreground focus-visible:outline-brand rounded-lg p-2.5 transition-colors focus-visible:outline-2"
      >
        <Bell className="size-5" strokeWidth={1.8} />
      </button>
      <ThemeToggle />
      <span
        className="bg-border mx-2 hidden h-7 w-px sm:block"
        aria-hidden="true"
      />
      <DropdownMenu
        label={
          <span className="flex items-center gap-2">
            <span className="bg-brand-soft text-brand grid size-9 place-items-center rounded-lg">
              <UserRound className="size-4.5" strokeWidth={1.8} />
            </span>
            <span className="hidden max-w-44 text-left text-sm sm:block">
              <span className="block truncate font-medium">
                {user?.fullName ?? "Tài khoản"}
              </span>
              <span className="text-muted block truncate text-xs">
                {session.isPending
                  ? "Đang kiểm tra phiên"
                  : (user?.email ?? "Chưa đăng nhập")}
              </span>
            </span>
            <ChevronDown className="text-muted size-4" strokeWidth={1.8} />
          </span>
        }
      >
        <div className="p-1">
          {user ? (
            <>
              <div className="border-border border-b px-2 py-2">
                <p className="text-sm font-medium">{user.fullName}</p>
                <p className="text-muted mt-0.5 text-xs">
                  {user.roles.map((role) => role.name).join(", ") ||
                    "Chưa có vai trò"}
                </p>
              </div>
              <button
                className="hover:bg-neutral-soft mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors"
                onClick={logout}
              >
                <LogOut className="size-4" strokeWidth={1.8} />
                Đăng xuất
              </button>
            </>
          ) : (
            <p className="text-muted px-2 py-2 text-sm">
              Phiên đăng nhập không còn hiệu lực.
            </p>
          )}
        </div>
      </DropdownMenu>
    </header>
  );
}
