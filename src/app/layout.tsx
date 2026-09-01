import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import { siteConfig } from "@/config/site";
import { AppProviders } from "@/providers/app-providers";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
export const metadata: Metadata = { title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` }, description: siteConfig.description };
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) { return <html lang="vi" suppressHydrationWarning><body className={geist.variable}><script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.classList.toggle('dark',localStorage.getItem('securaai-theme')==='dark'||(!localStorage.getItem('securaai-theme')&&matchMedia('(prefers-color-scheme: dark)').matches))}catch{}` }} /><AppProviders>{children}</AppProviders></body></html>; }
