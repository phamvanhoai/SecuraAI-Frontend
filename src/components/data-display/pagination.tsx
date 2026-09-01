import { Button } from "@/components/ui/button";

export function Pagination({ page, pageCount, onPageChange }: { page: number; pageCount: number; onPageChange?: (page: number) => void }) {
  return <nav aria-label="Phân trang" className="flex items-center justify-between gap-4"><Button className="bg-surface text-foreground ring-1 ring-border hover:bg-neutral-soft" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>Trước</Button><span className="text-sm text-muted">Trang {page} / {Math.max(pageCount, 1)}</span><Button className="bg-surface text-foreground ring-1 ring-border hover:bg-neutral-soft" disabled={page >= pageCount} onClick={() => onPageChange?.(page + 1)}>Sau</Button></nav>;
}
