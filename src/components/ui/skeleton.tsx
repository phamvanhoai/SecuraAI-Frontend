import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("bg-neutral-soft animate-pulse rounded-lg", className)}
      {...props}
    />
  );
}

export function TableSkeleton({
  rows = 4,
  columns = 5,
  label = "Loading data",
}: {
  rows?: number;
  columns?: number;
  label?: string;
}) {
  return (
    <div
      aria-label={label}
      aria-busy="true"
      role="status"
      className="border-border overflow-hidden rounded-xl border"
    >
      <span className="sr-only">{label}</span>
      <div
        className="bg-neutral-soft grid h-11 gap-4 px-4"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(6rem, 1fr))` }}
      >
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton className="bg-surface/70 my-3 h-4" key={index} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div
          className="border-border grid h-16 gap-4 border-t px-4"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(6rem, 1fr))`,
          }}
          key={row}
        >
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton className="my-auto h-4" key={column} />
          ))}
        </div>
      ))}
    </div>
  );
}
