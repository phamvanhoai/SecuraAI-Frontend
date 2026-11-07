import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

export function FormField({ id, label, error, children }: { id: string; label: string; error?: string | undefined; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-danger flex items-start gap-1.5 text-xs font-medium">
          <AlertCircle aria-hidden="true" className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
