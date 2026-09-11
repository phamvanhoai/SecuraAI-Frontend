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
  headers,
  label = "Loading data",
}: {
  rows?: number;
  columns?: number;
  headers?: readonly string[];
  label?: string;
}) {
  const columnHeaders = headers ?? Array.from({ length: columns }, () => "");
  return (
    <div
      aria-label={label}
      aria-busy="true"
      role="status"
      className="border-border overflow-x-auto rounded-xl border"
    >
      <span className="sr-only">{label}</span>
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-neutral-soft">
          <tr>
            {columnHeaders.map((header, index) => (
              <th
                className="px-4 py-3 font-semibold"
                key={`${header}-${index}`}
                scope="col"
              >
                {header || <Skeleton className="bg-surface/70 h-4" />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr className="border-border h-16 border-t" key={row}>
              {columnHeaders.map((header, column) => (
                <td
                  className="px-4 py-3 align-middle"
                  key={`${header}-${column}`}
                >
                  <Skeleton
                    className={column === 0 ? "h-8 min-w-40" : "h-4 min-w-16"}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
