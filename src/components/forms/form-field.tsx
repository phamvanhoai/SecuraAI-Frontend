import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export function FormField({ id, label, error, children }: { id: string; label: string; error?: string | undefined; children: ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}{error ? <p id={`${id}-error`} className="text-sm text-danger">{error}</p> : null}</div>;
}
