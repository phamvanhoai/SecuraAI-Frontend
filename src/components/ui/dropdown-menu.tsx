"use client";

import {
  type CSSProperties,
  type DetailsHTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const MENU_WIDTH = 192;
const MENU_ESTIMATED_HEIGHT = 176;
const VIEWPORT_GAP = 8;

export function DropdownMenu({
  label,
  children,
  className,
  onToggle,
  ...props
}: DetailsHTMLAttributes<HTMLDetailsElement> & {
  label: ReactNode;
  children: ReactNode;
}) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<CSSProperties | null>(null);

  const positionMenu = useCallback((): void => {
    const trigger = menuRef.current?.querySelector("summary");
    if (!trigger) return;
    const bounds = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - bounds.bottom;
    const openAbove =
      spaceBelow < MENU_ESTIMATED_HEIGHT && bounds.top > spaceBelow;
    const right = Math.min(
      Math.max(VIEWPORT_GAP, window.innerWidth - bounds.right),
      window.innerWidth - MENU_WIDTH - VIEWPORT_GAP,
    );
    setPosition(
      openAbove
        ? {
            right,
            bottom: window.innerHeight - bounds.top + VIEWPORT_GAP,
          }
        : { right, top: bounds.bottom + VIEWPORT_GAP },
    );
  }, []);

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

    function closeWhenViewportMoves(): void {
      const menu = menuRef.current;
      if (!menu?.open) return;
      menu.open = false;
      setPosition(null);
    }

    document.addEventListener("pointerdown", closeWhenClickingOutside);
    document.addEventListener("keydown", closeWithEscape);
    window.addEventListener("resize", closeWhenViewportMoves);
    window.addEventListener("scroll", closeWhenViewportMoves, true);
    return () => {
      document.removeEventListener("pointerdown", closeWhenClickingOutside);
      document.removeEventListener("keydown", closeWithEscape);
      window.removeEventListener("resize", closeWhenViewportMoves);
      window.removeEventListener("scroll", closeWhenViewportMoves, true);
    };
  }, []);

  useEffect(() => {
    if (menuRef.current?.open) positionMenu();
  }, [positionMenu]);

  return (
    <>
      <details
        ref={menuRef}
        className={cn("relative", className)}
        onToggle={(event) => {
          if (event.currentTarget.open) positionMenu();
          else setPosition(null);
          onToggle?.(event);
        }}
        {...props}
      >
        <summary
          aria-expanded={Boolean(position)}
          aria-haspopup="menu"
          className="focus-visible:outline-brand cursor-pointer list-none rounded-lg p-2 focus-visible:outline-2"
          role="button"
        >
          {label}
        </summary>
      </details>
      {position && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={contentRef}
              className="border-border bg-surface fixed z-50 min-w-48 rounded-xl border p-2 shadow-[0_16px_40px_rgba(18,35,32,.12)]"
              onClick={(event) => {
                if (!(event.target instanceof Element)) return;
                if (!event.target.closest("button")) return;
                if (menuRef.current) menuRef.current.open = false;
                setPosition(null);
              }}
              style={position}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
