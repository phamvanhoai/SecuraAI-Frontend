import Link from "next/link";

export function Breadcrumb({ title }: { title: string }) {
  return <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted"><ol className="flex items-center gap-2"><li><Link className="transition-colors hover:text-foreground" href="/dashboard">SecuraAI</Link></li><li aria-hidden="true" className="text-border">/</li><li aria-current="page" className="font-medium text-foreground">{title}</li></ol></nav>;
}
