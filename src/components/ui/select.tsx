import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/15", className)} {...props} />;
}
