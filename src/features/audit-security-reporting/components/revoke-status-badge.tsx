"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Ban, Calendar, Info, User } from "lucide-react";
import { StatusBadge } from "@/components/data-display/static-product";

interface RevokeStatusBadgeProps {
  revokedBy?: string | null | undefined;
  revokedAt?: string | null | undefined;
  reason?: string | null | undefined;
}

export function RevokeStatusBadge({
  revokedBy,
  revokedAt,
  reason,
}: RevokeStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 320;
    const gap = 8;

    // Check horizontal space
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    if (typeof window !== "undefined") {
      if (left + tooltipWidth > window.innerWidth - 12) {
        left = window.innerWidth - tooltipWidth - 12;
      }
      if (left < 12) {
        left = 12;
      }

      // Check vertical space (open above or below)
      const spaceBelow = window.innerHeight - rect.bottom;
      const openAbove = spaceBelow < 200 && rect.top > 200;

      if (openAbove) {
        setTooltipStyle({
          position: "fixed",
          left: `${left}px`,
          bottom: `${window.innerHeight - rect.top + gap}px`,
          width: `${tooltipWidth}px`,
          zIndex: 9999,
        });
      } else {
        setTooltipStyle({
          position: "fixed",
          left: `${left}px`,
          top: `${rect.bottom + gap}px`,
          width: `${tooltipWidth}px`,
          zIndex: 9999,
        });
      }
    }
  };

  const handleMouseEnter = () => {
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return "";
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  return (
    <div
      ref={triggerRef}
      className="inline-flex items-center gap-1.5 cursor-pointer select-none group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => {
        updatePosition();
        setIsOpen((prev) => !prev);
      }}
      tabIndex={0}
      role="button"
      aria-label="View revocation details"
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      <StatusBadge tone="danger">
        <span className="flex items-center gap-1 font-medium">
          <Ban className="size-3 text-danger" />
          Revoked
        </span>
      </StatusBadge>
      <span className="text-danger/80 group-hover:text-danger transition-colors p-0.5 rounded-full hover:bg-danger-soft">
        <Info className="size-3.5" />
      </span>

      {mounted &&
        isOpen &&
        createPortal(
          <div
            style={tooltipStyle}
            className="pointer-events-none rounded-xl border border-border bg-surface p-3.5 text-xs text-foreground shadow-[0_10px_35px_rgba(15,23,42,0.14)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.5)] transition-all duration-150"
          >
            <div className="flex items-center gap-2 border-b border-border pb-2.5 mb-2.5">
              <span className="grid size-6 place-items-center rounded-md bg-danger-soft text-danger">
                <Ban className="size-3.5" />
              </span>
              <span className="text-xs font-semibold text-foreground">Report Export Revoked</span>
              <span className="ml-auto text-[10px] font-medium text-danger bg-danger-soft px-1.5 py-0.5 rounded border border-danger/20">
                Voided
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              {revokedBy && (
                <div className="flex items-center gap-2">
                  <User className="size-3.5 text-muted shrink-0" />
                  <span className="text-muted">Revoked by:</span>
                  <span className="font-medium text-foreground">{revokedBy}</span>
                </div>
              )}

              {revokedAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-muted shrink-0" />
                  <span className="text-muted">Revoked on:</span>
                  <span className="font-medium text-foreground font-mono text-[11px]">
                    {formatDateTime(revokedAt)}
                  </span>
                </div>
              )}

              <div className="mt-2.5 pt-2.5 border-t border-border">
                <span className="text-[11px] font-medium text-muted block mb-1">
                  Revocation Reason:
                </span>
                <p className="rounded-lg bg-surface-subtle border border-border p-2.5 text-foreground leading-relaxed break-words text-xs font-normal">
                  {(reason || "No detailed reason provided.")
                    .replace(/^["“”']+|["“”']+$/g, "")
                    .trim()}
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
