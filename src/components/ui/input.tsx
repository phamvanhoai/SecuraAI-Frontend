import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("min-h-11 w-full rounded-lg border border-border bg-surface px-3.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-3 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-neutral-soft", className)} {...props} />;
}
