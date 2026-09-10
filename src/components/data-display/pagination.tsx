import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange?: (page: number) => void;
}) {
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4"
    >
      <Button
        className="bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
        disabled={page <= 1}
        onClick={() => onPageChange?.(page - 1)}
      >
        Previous
      </Button>
      <span className="text-muted text-sm">
        Page {page} of {Math.max(pageCount, 1)}
      </span>
      <Button
        className="bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
        disabled={page >= pageCount}
        onClick={() => onPageChange?.(page + 1)}
      >
        Next
      </Button>
    </nav>
  );
}
