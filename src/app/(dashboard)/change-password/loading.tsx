import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading change password" role="status">
      <div className="mb-5 space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <section className="border-border bg-surface overflow-hidden rounded-[10px] border">
        <div className="border-border space-y-2 border-b p-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-2">
          <Skeleton className="h-20 md:col-span-2" />
          <Skeleton className="h-20 md:col-span-2" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <div className="border-border flex justify-end gap-3 border-t p-4">
          <Skeleton className="h-11 w-24" />
          <Skeleton className="h-11 w-40" />
        </div>
      </section>
    </div>
  );
}
