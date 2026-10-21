import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Verify Reset Code" };

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
