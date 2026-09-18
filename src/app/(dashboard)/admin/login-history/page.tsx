import type { Metadata } from "next";
import { LoginHistoryShell } from "@/features/login-history";
export const metadata: Metadata = { title: "Login History" };
export default function LoginHistoryPage() {
  return <LoginHistoryShell />;
}
