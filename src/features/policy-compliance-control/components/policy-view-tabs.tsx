import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PolicyViewTab = {
  id: string;
  label: string;
  count?: number | undefined;
  icon?: ReactNode;
  onSelect: () => void;
};

export function PolicyViewTabs({
  activeId,
  tabs,
}: {
  activeId: string;
  tabs: readonly PolicyViewTab[];
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div
        aria-label="Policy views"
        className="border-border bg-surface inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-xl border p-1 shadow-xs"
        role="tablist"
      >
        {tabs.map((tab) => (
        <button
          aria-selected={activeId === tab.id}
          className={cn(
            "focus-visible:outline-brand inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2",
            activeId === tab.id
              ? "bg-brand text-brand-contrast font-semibold shadow-xs"
              : "text-muted hover:bg-neutral-soft hover:text-foreground",
          )}
          key={tab.id}
          onClick={tab.onSelect}
          role="tab"
          type="button"
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.count !== undefined ? (
            <span className="bg-neutral-soft rounded-full px-2 py-0.5 text-xs tabular-nums">
              {tab.count}
            </span>
          ) : null}
        </button>
        ))}
      </div>
    </div>
  );
}
