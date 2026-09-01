import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Alert({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div role="alert" className={cn("rounded-lg border border-info/25 bg-info-soft p-4 text-sm leading-6 text-info", className)} {...props} />;
}
