import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "min-h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/15 disabled:cursor-not-allowed disabled:bg-neutral-soft disabled:text-muted disabled:opacity-60",
        className,
      )}
      {...props}
    />
  ),
);
Select.displayName = "Select";
