import type { DialogHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils";

export function Dialog({
  title,
  children,
  className,
  dialogRef,
  ...props
}: DialogHTMLAttributes<HTMLDialogElement> & {
  title: string;
  children: ReactNode;
  dialogRef?: Ref<HTMLDialogElement>;
}) {
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="dialog-title"
      className={cn(
        "border-border bg-surface text-foreground m-auto w-[min(32rem,calc(100%-2rem))] rounded-xl border p-6 backdrop:bg-[#07110f]/55",
        className,
      )}
      {...props}
    >
      <h2 id="dialog-title" className="text-lg font-semibold">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </dialog>
  );
}
