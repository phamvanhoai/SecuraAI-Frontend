import type { DialogHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Dialog({ title, children, className, ...props }: DialogHTMLAttributes<HTMLDialogElement> & { title: string; children: ReactNode }) {
  return <dialog aria-labelledby="dialog-title" className={cn("m-auto w-[min(32rem,calc(100%-2rem))] rounded-xl border border-border bg-surface p-6 text-foreground backdrop:bg-[#07110f]/55", className)} {...props}><h2 id="dialog-title" className="text-lg font-semibold">{title}</h2><div className="mt-4">{children}</div></dialog>;
}
