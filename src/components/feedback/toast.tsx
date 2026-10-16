"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Info,
  X,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type ToastTone = "success" | "error" | "warning" | "info";
export type ToastInput = {
  title: string;
  description?: string | undefined;
  tone?: ToastTone;
  duration?: number;
};
type ToastItem = ToastInput & { id: string; tone: ToastTone; duration: number };
type ToastApi = {
  show: (input: ToastInput) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
};

const ToastContext = createContext<ToastApi | null>(null);
let toastSequence = 0;

const toneStyles = {
  success: "border-success/25 bg-surface text-success",
  error: "border-danger/25 bg-surface text-danger",
  warning: "border-warning/25 bg-surface text-warning",
  info: "border-info/25 bg-surface text-info",
} as const;
const icons = {
  success: CheckCircle2,
  error: CircleAlert,
  warning: AlertTriangle,
  info: Info,
} as const;

function ToastMessage({
  item,
  dismiss,
}: {
  item: ToastItem;
  dismiss: (id: string) => void;
}) {
  const Icon = icons[item.tone];
  useEffect(() => {
    if (item.duration === 0) return;
    const timer = window.setTimeout(() => dismiss(item.id), item.duration);
    return () => window.clearTimeout(timer);
  }, [dismiss, item.duration, item.id]);
  return (
    <div
      role={item.tone === "error" ? "alert" : "status"}
      className={cn(
        "text-foreground pointer-events-auto flex w-full items-start gap-3 rounded-[10px] border p-4 shadow-[0_16px_44px_rgba(10,30,65,0.16)]",
        toneStyles[item.tone],
      )}
    >
      <Icon
        className="mt-0.5 size-5 shrink-0"
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-foreground text-sm font-semibold">{item.title}</p>
        {item.description ? (
          <p className="text-muted mt-1 text-sm leading-5">
            {item.description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Đóng thông báo"
        className="text-muted hover:bg-neutral-soft hover:text-foreground focus-visible:outline-brand -mt-1 -mr-1 rounded-md p-1.5 transition-colors focus-visible:outline-2"
        onClick={() => dismiss(item.id)}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback(
    (id: string) =>
      setItems((current) => current.filter((item) => item.id !== id)),
    [],
  );
  const dismissAll = useCallback(() => setItems([]), []);
  const show = useCallback((input: ToastInput) => {
    toastSequence += 1;
    const id = `toast-${toastSequence}`;
    const item: ToastItem = {
      ...input,
      id,
      tone: input.tone ?? "info",
      duration: input.duration ?? 4500,
    };
    setItems((current) => [...current.slice(-3), item]);
    return id;
  }, []);
  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (title, description) =>
        show({ title, description, tone: "success" }),
      error: (title, description) =>
        show({ title, description, tone: "error", duration: 6500 }),
      warning: (title, description) =>
        show({ title, description, tone: "warning" }),
      info: (title, description) => show({ title, description, tone: "info" }),
      dismiss,
      dismissAll,
    }),
    [dismiss, dismissAll, show],
  );
  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport>
        {items.map((item) => (
          <ToastMessage dismiss={dismiss} item={item} key={item.id} />
        ))}
      </ToastViewport>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context)
    throw new Error("useToast phải được sử dụng bên trong ToastProvider.");
  return context;
}

function activeToastDialog(): HTMLDialogElement | null {
  const focusedDialog = document.activeElement?.closest("dialog[open]");
  if (focusedDialog instanceof HTMLDialogElement) return focusedDialog;
  const dialogs = document.querySelectorAll<HTMLDialogElement>("dialog[open]");
  return dialogs.item(dialogs.length - 1);
}
function subscribeToDialogs(onChange: () => void): () => void {
  let current = activeToastDialog();
  const update = () => {
    if (typeof document === "undefined") return;
    const next = activeToastDialog();
    if (next !== current) {
      current = next;
      onChange();
    }
  };
  const observer = new MutationObserver(update);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["open"],
  });
  document.addEventListener("focusin", update);
  document.addEventListener("close", update, true);
  return () => {
    observer.disconnect();
    document.removeEventListener("focusin", update);
    document.removeEventListener("close", update, true);
  };
}
function ToastViewport({ children }: { children: ReactNode }) {
  const dialog = useSyncExternalStore(
    subscribeToDialogs,
    activeToastDialog,
    () => null,
  );
  const viewport = (
    <div
      aria-label="Thông báo hệ thống"
      className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-3 sm:left-auto sm:w-[380px]"
    >
      {children}
    </div>
  );
  // Modal dialogs live above every document z-index. Keep feedback inside the
  // active dialog so it remains visible and operable above its backdrop.
  return dialog ? createPortal(viewport, dialog) : viewport;
}
