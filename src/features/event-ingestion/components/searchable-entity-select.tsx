"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EntitySelectOption {
  id: string;
  primaryLabel: string;
  secondaryLabel?: string | undefined;
  searchText: string;
  selectedText: string;
}

interface SearchableEntitySelectProps {
  id: string;
  label: ReactNode;
  emptyOptionLabel: string;
  searchPlaceholder: string;
  clearAriaLabel?: string;
  options: readonly EntitySelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function SearchableEntitySelect({
  id,
  label,
  emptyOptionLabel,
  searchPlaceholder,
  clearAriaLabel = "Clear selection",
  options,
  value,
  onChange,
  disabled = false,
  loading = false,
}: SearchableEntitySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((opt) => opt.searchText.includes(normalizedQuery))
    : options;

  const showEmptyOption = !normalizedQuery;
  const selectableItems: Array<{ id: string; option?: EntitySelectOption }> = [
    ...(showEmptyOption ? [{ id: "NONE" }] : []),
    ...filteredOptions.map((option) => ({ id: option.id, option })),
  ];

  const selectedOption =
    value !== "NONE" ? options.find((opt) => opt.id === value) : undefined;

  useEffect(() => {
    if (!open) return;

    const timer = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    const handlePointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      cancelAnimationFrame(timer);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (open && activeIndex >= 0) {
      document
        .getElementById(`${listboxId}-option-${activeIndex}`)
        ?.scrollIntoView?.({ block: "nearest" });
    }
  }, [activeIndex, listboxId, open]);

  const closeDropdown = (restoreFocus = false) => {
    setOpen(false);
    setActiveIndex(-1);
    if (restoreFocus) {
      document.getElementById(id)?.focus();
    }
  };

  const selectValue = (nextId: string, restoreFocus = false) => {
    onChange(nextId);
    setQuery("");
    closeDropdown(restoreFocus);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      if (!selectableItems.length) {
        setActiveIndex(-1);
        return;
      }
      setActiveIndex((prev) =>
        event.key === "ArrowDown"
          ? Math.min(prev + 1, selectableItems.length - 1)
          : Math.max(prev - 1, 0),
      );
    } else if (event.key === "Enter" && open) {
      if (activeIndex >= 0 && selectableItems[activeIndex]) {
        event.preventDefault();
        selectValue(selectableItems[activeIndex].id, true);
      }
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      closeDropdown(true);
    }
  };

  return (
    <div ref={containerRef} className="space-y-1">
      <label
        htmlFor={id}
        className="text-foreground flex items-center gap-1.5 text-xs font-semibold"
      >
        {label}
      </label>

      <div className="relative">
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? listboxId : undefined}
          disabled={disabled || loading}
          onClick={() => {
            if (open) {
              closeDropdown();
            } else {
              setQuery("");
              setActiveIndex(-1);
              setOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className={cn(
            "border-border bg-surface text-foreground flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-left text-xs transition-colors outline-none",
            "hover:border-brand/50 focus:border-brand focus:ring-brand/15 focus:ring-3",
            "disabled:cursor-not-allowed disabled:opacity-60",
            value !== "NONE" && !disabled && !loading ? "pr-14" : "pr-8",
            open ? "border-brand ring-brand/15 ring-3" : "",
          )}
        >
          <span
            className={cn(
              "truncate",
              selectedOption ? "text-foreground font-medium" : "text-muted",
            )}
          >
            {loading
              ? "Loading options…"
              : selectedOption
                ? selectedOption.selectedText
                : emptyOptionLabel}
          </span>
        </button>

        {value !== "NONE" && !disabled && !loading ? (
          <button
            type="button"
            onClick={() => {
              onChange("NONE");
              setQuery("");
            }}
            aria-label={clearAriaLabel}
            title={clearAriaLabel}
            className="text-muted hover:text-foreground hover:bg-neutral-soft absolute top-1/2 right-7 -translate-y-1/2 rounded p-1 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        ) : null}

        <ChevronDown
          aria-hidden="true"
          className={cn(
            "text-muted pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 transition-transform duration-150",
            open ? "rotate-180" : "",
          )}
        />

        {open && !disabled && !loading ? (
          <div className="border-border bg-surface absolute top-[calc(100%+0.375rem)] left-0 z-30 w-full overflow-hidden rounded-xl border shadow-xl">
            <div className="border-border bg-neutral-soft/40 border-b p-2">
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="text-muted pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  className="border-border bg-surface text-foreground placeholder:text-muted focus:border-brand focus:ring-brand/15 h-8 w-full rounded-md border pr-7 pl-8 text-xs outline-none focus:ring-2"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setActiveIndex(0);
                      searchInputRef.current?.focus();
                    }}
                    aria-label="Clear search query"
                    className="text-muted hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                ) : null}
              </div>
              <div className="text-muted mt-1.5 flex items-center justify-between gap-2 px-0.5 text-[11px]">
                <span>
                  {filteredOptions.length === options.length
                    ? `${options.length} total`
                    : `${filteredOptions.length} of ${options.length} matching`}
                </span>
                {selectedOption ? (
                  <span className="text-brand max-w-[14rem] truncate font-medium">
                    Current: {selectedOption.primaryLabel}
                  </span>
                ) : null}
              </div>
            </div>

            <ul
              id={listboxId}
              role="listbox"
              className="max-h-52 space-y-0.5 overflow-y-auto p-1.5"
            >
              {selectableItems.length === 0 ? (
                <li className="text-muted px-3 py-5 text-center text-xs">
                  No matching options for &ldquo;{query.trim()}&rdquo;.
                </li>
              ) : (
                selectableItems.map((entry, index) => {
                  const isSelected = entry.id === value;
                  const isActive = index === activeIndex;

                  if (!entry.option) {
                    return (
                      <li key="NONE" role="presentation">
                        <button
                          id={`${listboxId}-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectValue("NONE")}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
                            isSelected
                              ? "bg-brand/10 text-brand font-medium"
                              : "text-muted hover:bg-neutral-soft hover:text-foreground",
                            isActive && !isSelected ? "bg-neutral-soft" : "",
                          )}
                        >
                          <span className="truncate">{emptyOptionLabel}</span>
                          {isSelected ? (
                            <Check className="text-brand size-3.5 shrink-0" />
                          ) : null}
                        </button>
                      </li>
                    );
                  }

                  const opt = entry.option;
                  return (
                    <li key={opt.id} role="presentation">
                      <button
                        id={`${listboxId}-option-${index}`}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectValue(opt.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left transition-colors",
                          isSelected
                            ? "bg-brand/10 text-foreground"
                            : "hover:bg-neutral-soft",
                          isActive && !isSelected ? "bg-neutral-soft" : "",
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <div
                            className={cn(
                              "truncate text-xs",
                              isSelected
                                ? "text-brand font-semibold"
                                : "text-foreground font-medium",
                            )}
                          >
                            {opt.primaryLabel}
                          </div>
                          {opt.secondaryLabel ? (
                            <div className="text-muted truncate text-[11px]">
                              {opt.secondaryLabel}
                            </div>
                          ) : null}
                        </div>
                        {isSelected ? (
                          <Check className="text-brand size-3.5 shrink-0" />
                        ) : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
