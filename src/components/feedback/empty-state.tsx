import { CircleDashed } from "lucide-react";

export function EmptyState({ title = "Chưa triển khai", description = "Chức năng này đang chờ API contract và nghiệp vụ được hoàn thiện." }: { title?: string; description?: string }) {
  return <section className="flex min-h-56 items-center rounded-xl border border-border bg-surface p-6 sm:p-8"><div className="flex max-w-2xl items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-lg bg-neutral-soft text-muted"><CircleDashed className="size-5" strokeWidth={1.8} aria-hidden="true" /></span><div><h2 className="font-semibold tracking-[-0.01em]">{title}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted">{description}</p></div></div></section>;
}
