import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "AI Models" };

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
