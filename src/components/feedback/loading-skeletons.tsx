import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function LoadingRegion({ children }: { children: ReactNode }) {
  return (
    <div aria-busy="true" aria-label="Đang tải nội dung" role="status">
      <span className="sr-only">Đang tải nội dung</span>
      {children}
    </div>
  );
}

export function RootLoadingSkeleton() {
  return (
    <LoadingRegion>
      <main className="mx-auto min-h-[100dvh] max-w-[1600px] space-y-6 px-4 py-8 md:px-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-full max-w-xs" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </main>
    </LoadingRegion>
  );
}

export function AuthLoadingSkeleton() {
  return (
    <LoadingRegion>
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-3 text-center">
          <Skeleton className="mx-auto size-12 rounded-xl" />
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto h-4 w-full max-w-xs" />
        </div>
        <div className="border-border bg-surface space-y-5 rounded-xl border p-6 sm:p-8">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full" />
          </div>
          <Skeleton className="h-11 w-full" />
          <Skeleton className="mx-auto h-4 w-36" />
        </div>
      </div>
    </LoadingRegion>
  );
}

const metricSkeletons = ["metric-1", "metric-2", "metric-3", "metric-4"];
const rowSkeletons = ["row-1", "row-2", "row-3", "row-4", "row-5"];

export type DashboardSkeletonVariant =
  "overview" | "table" | "split" | "form" | "feed";

function SkeletonRows() {
  return (
    <div className="divide-border divide-y px-4">
      {rowSkeletons.map((row) => (
        <div className="flex items-center gap-4 py-4" key={row}>
          <Skeleton className="size-9 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-3 w-full max-w-xs" />
          </div>
          <Skeleton className="hidden h-7 w-24 sm:block" />
        </div>
      ))}
    </div>
  );
}

function DashboardSkeletonContent({
  variant,
}: {
  variant: DashboardSkeletonVariant;
}) {
  if (variant === "overview") {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        <Skeleton className="h-72 w-full rounded-[10px]" />
        <Skeleton className="h-72 w-full rounded-[10px]" />
        <Skeleton className="h-64 w-full rounded-[10px] xl:col-span-2" />
      </div>
    );
  }

  if (variant === "form") {
    return (
      <div className="grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <Skeleton className="h-64 w-full rounded-[10px]" />
        <div className="border-border bg-surface grid gap-5 rounded-[10px] border p-5 md:grid-cols-2">
          {metricSkeletons.map((field) => (
            <div className="space-y-2" key={field}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "split") {
    return (
      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <section className="border-border bg-surface overflow-hidden rounded-[10px] border">
          <SkeletonRows />
        </section>
        <Skeleton className="h-80 w-full rounded-[10px]" />
      </div>
    );
  }

  if (variant === "feed") {
    return (
      <section className="border-border bg-surface overflow-hidden rounded-[10px] border">
        <div className="border-border border-b p-4">
          <Skeleton className="h-10 w-full max-w-sm" />
        </div>
        <SkeletonRows />
      </section>
    );
  }

  return (
    <section className="border-border bg-surface overflow-hidden rounded-[10px] border">
      <div className="border-border flex flex-col gap-4 border-b p-4 md:flex-row md:items-center md:justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-10 w-full md:max-w-sm" />
      </div>
      <SkeletonRows />
    </section>
  );
}

export function DashboardLoadingSkeleton({
  variant = "table",
}: {
  variant?: DashboardSkeletonVariant;
}) {
  return (
    <LoadingRegion>
      <div className="space-y-5">
        <div className="space-y-3">
          <Skeleton className="h-4 w-36" />
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="w-full max-w-2xl space-y-3">
              <Skeleton className="h-9 w-full max-w-sm" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>
          <Skeleton className="h-7 w-60" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metricSkeletons.map((item) => (
            <div
              className="border-border bg-surface space-y-3 rounded-[10px] border p-4"
              key={item}
            >
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        <DashboardSkeletonContent variant={variant} />
      </div>
    </LoadingRegion>
  );
}
