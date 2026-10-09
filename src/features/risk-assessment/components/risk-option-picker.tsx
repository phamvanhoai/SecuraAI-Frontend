"use client";

import { useEffect, useState, type Ref } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRiskCreateOptions } from "../hooks/use-create-risk-assessment";

type Option = { id: string; label: string };
type Props = {
  id: string;
  kind: "asset" | "business_service" | "owner";
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  inputRef: Ref<HTMLInputElement>;
  enabled: boolean;
  invalid: boolean;
};

/** Picks a server-returned ID, never interprets typed text as a selection. */
export function RiskOptionPicker({
  id,
  kind,
  value,
  onChange,
  onBlur,
  inputRef,
  enabled,
  invalid,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<Option>();
  const [active, setActive] = useState(-1);
  useEffect(() => {
    if (active >= 0)
      document
        .getElementById(`${id}-option-${active}`)
        ?.scrollIntoView?.({ block: "nearest" });
  }, [active, id]);
  const q = search.trim();
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(q), 300);
    return () => clearTimeout(timer);
  }, [q]);
  const query = useRiskCreateOptions(
    enabled && open && q === debounced,
    debounced,
  );
  const loading = q !== debounced || query.isFetching || query.isPending;
  const options: Option[] =
    kind === "owner"
      ? (query.data?.owners ?? []).map((item) => ({
          id: item.id,
          label: `${item.fullName} — ${item.email}`,
        }))
      : kind === "asset"
        ? (query.data?.assets ?? []).map((item) => ({
            id: item.id,
            label: `${item.code} — ${item.name}`,
          }))
        : (query.data?.businessServices ?? []).map((item) => ({
            id: item.id,
            label: `${item.name} (${item.assetCount} active assets)`,
          }));
  const visible = !loading && !query.isError ? options.slice(0, 10) : [];
  const selectedLabel = selected?.id === value ? selected.label : "";
  const hint =
    kind === "owner"
      ? "Search by name; email identifies each owner."
      : kind === "asset"
        ? "Search by asset code or name."
        : "Search by business service name.";
  const choose = (item: Option) => {
    setSelected(item);
    onChange(item.id);
    setOpen(false);
    setActive(-1);
    onBlur();
  };

  return (
    <div
      className="relative min-w-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setActive(-1);
          onBlur();
        }
      }}
    >
      <Input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={enabled && open}
        aria-controls={`${id}-list`}
        aria-invalid={invalid}
        aria-describedby={`${id}-help${invalid ? ` ${id}-error` : ""}`}
        aria-activedescendant={
          open && visible[active] ? `${id}-option-${active}` : undefined
        }
        autoComplete="off"
        maxLength={100}
        disabled={!enabled}
        placeholder={
          kind === "owner"
            ? "Search and select owner"
            : "Search and select scope"
        }
        value={open ? search : selectedLabel}
        onFocus={() => {
          setSearch("");
          setOpen(true);
          setActive(-1);
        }}
        onChange={(event) => {
          setSearch(event.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            setActive((index) =>
              visible.length
                ? event.key === "ArrowDown"
                  ? Math.min(index + 1, visible.length - 1)
                  : Math.max(index - 1, 0)
                : -1,
            );
          } else if (event.key === "Enter" && open) {
            event.preventDefault();
            const item = visible[active];
            if (item) choose(item);
          } else if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            setActive(-1);
          }
        }}
      />
      <p id={`${id}-help`} className="text-muted mt-2 text-sm">
        {hint}
        {open && selectedLabel ? ` Selected: ${selectedLabel}` : ""}
      </p>
      {enabled && open ? (
        <div className="border-border bg-surface absolute top-11 z-20 w-full rounded-lg border shadow-lg">
          <div role="status" className="text-muted px-3 py-2 text-sm">
            {loading
              ? "Searching…"
              : query.isError
                ? "Unable to load options. Retry or change your search."
                : visible.length
                  ? `${visible.length} results. Up to 10 shown; refine your search if needed.`
                  : "No matching options. Try another name or code."}
          </div>
          {query.isError ? (
            <Button
              type="button"
              variant="secondary"
              className="m-2"
              onClick={() => void query.refetch()}
            >
              Retry
            </Button>
          ) : null}
          <ul
            id={`${id}-list`}
            role="listbox"
            aria-label={`${kind} results`}
            className="max-h-56 overflow-y-auto"
          >
            {visible.map((item, index) => (
              <li
                id={`${id}-option-${index}`}
                key={item.id}
                role="option"
                aria-selected={item.id === value}
                className={`hover:bg-neutral-soft cursor-pointer px-3 py-3 text-sm break-words ${index === active ? "bg-neutral-soft" : ""}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(item)}
              >
                {item.label}
              </li>
            ))}
          </ul>
          {value ? (
            <Button
              type="button"
              variant="secondary"
              className="m-2"
              onClick={() => {
                onChange("");
                setSelected(undefined);
                setSearch("");
                setOpen(false);
                onBlur();
              }}
            >
              Clear selection
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
