"use client";
import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRiskTreatmentPlanOptions } from "../hooks/use-create-risk-treatment-plan";
type Owner = { id: string; fullName: string; email: string };
export function TreatmentActionOwnerPicker({
  riskId,
  value,
  onChange,
  users,
  actionNumber,
}: {
  riskId: string | null;
  value: string;
  onChange: (id: string) => void;
  users: Owner[];
  actionNumber: number;
}) {
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Owner | null>(null);
  const results = useRiskTreatmentPlanOptions(riskId, query, open);
  const owner =
    users.find((item) => item.id === value) ??
    (selected?.id === value ? selected : null);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target))
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  const choose = (item: Owner | null) => {
    setSelected(item);
    onChange(item?.id ?? "");
    setOpen(false);
    root.current?.querySelector<HTMLButtonElement>("button")?.focus();
  };
  const find = () => {
    const next = search.trim();
    setQuery(next);
    if (next === query) void results.refetch();
  };
  const choices = query
    ? (results.data?.users ?? [])
    : (results.data?.users ?? users);
  return (
    <div
      ref={root}
      className="relative min-w-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          root.current?.querySelector<HTMLButtonElement>("button")?.focus();
        }
      }}
    >
      <Button
        type="button"
        variant="secondary"
        aria-label={`Action ${actionNumber} owner${owner ? `: ${owner.fullName} — ${owner.email}` : ""}`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        className="w-full justify-between text-left font-normal"
        onClick={() => {
          setSearch("");
          setQuery("");
          setOpen(!open);
        }}
      >
        <span
          className="min-w-0 truncate"
          title={owner ? `${owner.fullName} — ${owner.email}` : undefined}
        >
          {owner ? `${owner.fullName} — ${owner.email}` : "Assign owner"}
        </span>
        <ChevronDown
          className="text-muted size-4 shrink-0"
          aria-hidden="true"
        />
      </Button>
      {open ? (
        <div
          id={`${id}-panel`}
          className="border-border bg-surface absolute top-full left-0 z-50 mt-1 w-full min-w-0 rounded-lg border p-2 shadow-lg"
          role="region"
          aria-label={`Choose action ${actionNumber} owner`}
        >
          <div className="flex gap-1">
            <Input
              ref={input}
              aria-label="Find owner by name or email"
              placeholder="Search name or email"
              value={search}
              maxLength={100}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  find();
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              aria-label="Search owners"
              onClick={find}
            >
              <Search className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
            <Button
              type="button"
              variant="secondary"
              className="w-full justify-start border-transparent font-normal"
              onClick={() => choose(null)}
            >
              Unassigned
            </Button>
            {results.isFetching ? (
              <p role="status" className="text-muted p-2 text-sm">
                Searching owners…
              </p>
            ) : results.isError ? (
              <p role="alert" className="text-danger p-2 text-sm">
                Unable to load owners. Search again to retry.
              </p>
            ) : choices.length ? (
              choices.map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant="secondary"
                  aria-label={`${item.fullName} ${item.email}`}
                  className="h-auto w-full justify-between border-transparent text-left font-normal whitespace-normal"
                  onClick={() => choose(item)}
                >
                  <span className="min-w-0 [overflow-wrap:anywhere]">
                    {item.fullName}
                    <span className="text-muted block text-xs">
                      {item.email}
                    </span>
                  </span>
                  {value === item.id ? (
                    <Check
                      className="text-brand size-4 shrink-0"
                      aria-hidden="true"
                    />
                  ) : null}
                </Button>
              ))
            ) : (
              <p role="status" className="text-muted p-2 text-sm">
                No matching owners found.
              </p>
            )}
          </div>
          <p className="text-muted px-2 pt-2 text-xs">
            Up to 10 results. Search to find another owner.
          </p>
        </div>
      ) : null}
    </div>
  );
}
