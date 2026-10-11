import type { InputHTMLAttributes, RefAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & RefAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "border-border bg-surface placeholder:text-muted focus:border-brand focus:ring-brand/15 disabled:bg-neutral-soft min-h-11 w-full rounded-lg border px-3.5 text-sm transition-colors outline-none focus:ring-3 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    />
  );
}
