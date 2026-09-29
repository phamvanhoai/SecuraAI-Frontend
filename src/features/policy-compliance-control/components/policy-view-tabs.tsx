import { cn } from "@/lib/utils";

export type PolicyViewTab = {
  id: string;
  label: string;
  count?: number | undefined;
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
    <div
      aria-label="Policy views"
      className="border-border flex overflow-x-auto border-b px-4"
      role="tablist"
    >
      {tabs.map((tab) => (
        <button
          aria-selected={activeId === tab.id}
          className={cn(
            "focus-visible:outline-brand flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
            activeId === tab.id
              ? "border-brand text-foreground"
              : "text-muted hover:text-foreground border-transparent",
          )}
          key={tab.id}
          onClick={tab.onSelect}
          role="tab"
          type="button"
        >
          {tab.label}
          {tab.count !== undefined ? (
            <span className="bg-neutral-soft rounded-full px-2 py-0.5 text-xs tabular-nums">
              {tab.count}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
