import { ChevronDown, Download, Filter, Plus, Search } from "lucide-react";
import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { cn } from "@/lib/utils";

export function SampleNotice() {
  return (
    <div className="border-info/20 bg-info-soft text-info inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium">
      Dữ liệu mẫu phục vụ thiết kế giao diện
    </div>
  );
}

export function ProductPageHeader({
  title,
  description,
  primaryAction,
  secondaryAction,
}: {
  title: string;
  description: string;
  primaryAction?: string;
  secondaryAction?: string;
}) {
  return (
    <>
      <Breadcrumb title={title} />
      <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
            {title}
          </h1>
          <p className="text-muted mt-2 max-w-2xl text-sm leading-6">
            {description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {secondaryAction ? (
            <button className="border-border bg-surface hover:bg-neutral-soft inline-flex min-h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-medium whitespace-nowrap transition-colors active:translate-y-px">
              <Download className="size-4" strokeWidth={1.8} />
              {secondaryAction}
            </button>
          ) : null}
          {primaryAction ? (
            <button className="bg-brand text-brand-contrast hover:bg-brand-strong inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold whitespace-nowrap transition-colors active:translate-y-px">
              <Plus className="size-4" strokeWidth={1.8} />
              {primaryAction}
            </button>
          ) : null}
        </div>
      </div>
      <div className="mb-6">
        <SampleNotice />
      </div>
    </>
  );
}

export type Metric = {
  label: string;
  value: string;
  detail: string;
  tone?: "brand" | "warning" | "danger" | "neutral";
};

export function MetricStrip({ metrics }: { metrics: readonly Metric[] }) {
  const tones = {
    brand: "text-brand",
    warning: "text-warning",
    danger: "text-danger",
    neutral: "text-foreground",
  } as const;
  return (
    <section
      aria-label="Chỉ số mẫu"
      className="mb-5 grid gap-3 sm:grid-cols-2 xl:[grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]"
    >
      {metrics.map((metric) => (
        <div
          className={cn(
            "border-border bg-surface rounded-[10px] border p-4 shadow-[0_4px_18px_rgba(28,55,100,0.035)]",
          )}
          key={metric.label}
        >
          <p className="text-muted text-sm">{metric.label}</p>
          <p
            className={cn(
              "mt-2 text-2xl font-semibold tracking-[-0.03em]",
              tones[metric.tone ?? "neutral"],
            )}
          >
            {metric.value}
          </p>
          <p className="text-muted mt-1 text-xs">{metric.detail}</p>
        </div>
      ))}
    </section>
  );
}

export function ProductToolbar({
  searchPlaceholder = "Tìm kiếm...",
  filters = [],
}: {
  searchPlaceholder?: string;
  filters?: readonly string[];
}) {
  return (
    <div className="border-border flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
      <label className="relative block w-full md:max-w-sm">
        <span className="sr-only">Tìm kiếm</span>
        <Search
          className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
          strokeWidth={1.8}
        />
        <input
          className="border-border bg-background placeholder:text-muted focus:border-brand focus:ring-brand/15 min-h-10 w-full rounded-lg border pr-3 pl-9 text-sm outline-none focus:ring-3"
          placeholder={searchPlaceholder}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            className="border-border bg-surface text-muted hover:bg-neutral-soft hover:text-foreground inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-colors"
            key={filter}
          >
            {filter}
            <ChevronDown className="size-3.5" strokeWidth={1.8} />
          </button>
        ))}
        <button
          aria-label="Bộ lọc nâng cao"
          className="border-border bg-surface text-muted hover:bg-neutral-soft hover:text-foreground grid size-10 place-items-center rounded-lg border"
        >
          <Filter className="size-4" strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const tones = {
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    info: "bg-info-soft text-info",
    neutral: "bg-neutral-soft text-muted",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function StaticTable({
  headers,
  rows,
  caption,
}: {
  headers: readonly string[];
  rows: readonly (readonly ReactNode[])[];
  caption: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="text-muted dark:bg-neutral-soft bg-[#f7f9fd] text-xs">
          <tr>
            {headers.map((header) => (
              <th className="px-4 py-3 font-semibold" key={header} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              className="border-border hover:bg-neutral-soft/60 border-t transition-colors"
              key={rowIndex}
            >
              {row.map((cell, cellIndex) => (
                <td className="px-4 py-3 align-middle" key={cellIndex}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProductPanel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "border-border bg-surface overflow-hidden rounded-[10px] border shadow-[0_4px_18px_rgba(28,55,100,0.035)]",
        className,
      )}
    >
      <div className="border-border border-b px-5 py-4">
        <h2 className="font-semibold tracking-[-0.01em]">{title}</h2>
        {description ? (
          <p className="text-muted mt-1 text-sm leading-5">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function PaginationBar({
  label = "Hiển thị 1-5 trong 24 mục",
}: {
  label?: string;
}) {
  return (
    <div className="border-border flex flex-col gap-3 border-t px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted">{label}</span>
      <nav aria-label="Phân trang mẫu" className="flex items-center gap-1">
        {["Trước", "1", "2", "3", "Sau"].map((item) => (
          <button
            className={cn(
              "hover:bg-neutral-soft min-h-8 min-w-8 rounded-md px-2 text-sm",
              item === "1" && "bg-brand-soft text-brand font-semibold",
            )}
            key={item}
          >
            {item}
          </button>
        ))}
      </nav>
    </div>
  );
}
