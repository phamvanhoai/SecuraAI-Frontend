"use client";

import {
  type CSSProperties,
  type DetailsHTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const MENU_WIDTH = 192;
const MENU_ESTIMATED_HEIGHT = 176;
const VIEWPORT_GAP = 8;
const DROPDOWN_OPEN_EVENT = "securaai:dropdown-open";

export function DropdownMenu({
  label,
  children,
  className,
  onToggle,
  triggerLabel,
  contentClassName,
  menuWidth = MENU_WIDTH,
  ...props
}: DetailsHTMLAttributes<HTMLDetailsElement> & {
  label: ReactNode;
  children: ReactNode;
  triggerLabel?: string;
  contentClassName?: string;
  menuWidth?: number;
}) {
  const menuId = useId();
  const menuRef = useRef<HTMLDetailsElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const measuredHeightRef = useRef(MENU_ESTIMATED_HEIGHT);
  const [position, setPosition] = useState<CSSProperties | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  const positionMenu = useCallback((): void => {
    const trigger = menuRef.current?.querySelector("summary");
    if (!trigger) return;
    setPortalTarget(trigger.closest("dialog") ?? document.body);
    const bounds = trigger.getBoundingClientRect();
    const spaceBelow = Math.max(
      0,
      window.innerHeight - bounds.bottom - VIEWPORT_GAP * 2,
    );
    const spaceAbove = Math.max(0, bounds.top - VIEWPORT_GAP * 2);
    const menuHeight = measuredHeightRef.current;
    const openAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    const maxHeight = Math.min(360, openAbove ? spaceAbove : spaceBelow);
    const width = Math.min(menuWidth, window.innerWidth - VIEWPORT_GAP * 2);
    const right = Math.min(
      Math.max(VIEWPORT_GAP, window.innerWidth - bounds.right),
      window.innerWidth - width - VIEWPORT_GAP,
    );
    setPosition(
      openAbove
        ? {
            right,
            width,
            maxHeight,
            bottom: window.innerHeight - bounds.top + VIEWPORT_GAP,
          }
        : { right, top: bounds.bottom + VIEWPORT_GAP, maxHeight, width },
    );
  }, [menuWidth]);

  const captureContent = useCallback(
    (node: HTMLDivElement | null): void => {
      contentRef.current = node;
      if (!node) return;
      const measuredHeight = node.scrollHeight;
      if (measuredHeight <= 0) return;
      if (measuredHeight === measuredHeightRef.current) return;
      measuredHeightRef.current = measuredHeight;
      positionMenu();
    },
    [positionMenu],
  );

  useEffect(() => {
    function closeWhenClickingOutside(event: PointerEvent): void {
      const menu = menuRef.current;
      const target = event.target as Node;
      if (
        menu?.open &&
        !menu.contains(target) &&
        !contentRef.current?.contains(target)
      ) {
        menu.open = false;
        setPosition(null);
      }
    }

    function closeWithEscape(event: KeyboardEvent): void {
      const menu = menuRef.current;
      if (event.key !== "Escape" || !menu?.open) return;
      menu.open = false;
      setPosition(null);
      menu.querySelector("summary")?.focus();
    }

    function closeWhenViewportMoves(event: Event): void {
      if (
        event.target instanceof Node &&
        contentRef.current?.contains(event.target)
      )
        return;
      const menu = menuRef.current;
      if (!menu?.open) return;
      menu.open = false;
      setPosition(null);
    }

    function closeWhenAnotherMenuOpens(event: Event): void {
      if (!(event instanceof CustomEvent) || event.detail === menuId) return;
      const menu = menuRef.current;
      if (!menu?.open) return;
      menu.open = false;
      setPosition(null);
      setPortalTarget(null);
    }

    document.addEventListener("pointerdown", closeWhenClickingOutside);
    document.addEventListener("keydown", closeWithEscape);
    document.addEventListener(DROPDOWN_OPEN_EVENT, closeWhenAnotherMenuOpens);
    window.addEventListener("resize", closeWhenViewportMoves);
    window.addEventListener("scroll", closeWhenViewportMoves, true);
    return () => {
      document.removeEventListener("pointerdown", closeWhenClickingOutside);
      document.removeEventListener("keydown", closeWithEscape);
      document.removeEventListener(
        DROPDOWN_OPEN_EVENT,
        closeWhenAnotherMenuOpens,
      );
      window.removeEventListener("resize", closeWhenViewportMoves);
      window.removeEventListener("scroll", closeWhenViewportMoves, true);
    };
  }, [menuId]);

  useEffect(() => {
    if (menuRef.current?.open) positionMenu();
  }, [positionMenu]);

  return (
    <>
      <details
        ref={menuRef}
        className={cn("relative", className)}
        onToggle={(event) => {
          if (event.currentTarget.open) {
            document.dispatchEvent(
              new CustomEvent(DROPDOWN_OPEN_EVENT, { detail: menuId }),
            );
            positionMenu();
          } else {
            setPosition(null);
            setPortalTarget(null);
          }
          onToggle?.(event);
        }}
        {...props}
      >
        <summary
          aria-label={triggerLabel}
          aria-expanded={Boolean(position)}
          aria-haspopup="menu"
          className="focus-visible:outline-brand cursor-pointer list-none rounded-lg p-2 focus-visible:outline-2"
          role="button"
        >
          {label}
        </summary>
      </details>
      {position && portalTarget
        ? createPortal(
            <div
              ref={captureContent}
              className={cn(
                "border-border bg-surface fixed z-50 min-w-48 overflow-y-auto overscroll-contain rounded-xl border p-2 shadow-[0_16px_40px_rgba(18,35,32,.12)]",
                contentClassName,
              )}
              onClick={(event) => {
                if (!(event.target instanceof Element)) return;
                if (!event.target.closest("button, a")) return;
                if (menuRef.current) menuRef.current.open = false;
                setPosition(null);
              }}
              style={position}
            >
              {children}
            </div>,
            portalTarget,
          )
        : null}
    </>
  );
}
