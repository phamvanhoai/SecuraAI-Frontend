"use client";

import {
  Check,
  ChevronDown,
  Clock,
  Key,
  KeyRound,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/api-error";
import { useEventSources } from "@/features/event-ingestion/hooks/use-event-sources";
import {
  useCreateApiKey,
  useRotateApiKey,
  useUpdateApiKey,
} from "../hooks/use-integrations";
import {
  apiKeyScopeDetails,
  standardApiKeyScopes,
  type IntegrationApiKey,
  type StandardApiKeyScope,
} from "../schemas/integration-schema";

export type ApiKeyModalMode = "create" | "edit" | "rotate";

function formatDateTimeLocalInput(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function ApiKeyModal({
  integrationId,
  mode,
  apiKey,
  open,
  onOpenChange,
  onSecretGenerated,
}: {
  integrationId: string;
  mode: ApiKeyModalMode;
  apiKey?: IntegrationApiKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSecretGenerated: (keyName: string, secret: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();

  const createMutation = useCreateApiKey();
  const updateMutation = useUpdateApiKey();
  const rotateMutation = useRotateApiKey();

  const hasFixedSource = Boolean(integrationId && integrationId !== "all");
  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [sourceSearch, setSourceSearch] = useState("");
  const sourceDropdownRef = useRef<HTMLDivElement>(null);
  const sourceSearchInputRef = useRef<HTMLInputElement>(null);
  const effectiveSourceId = hasFixedSource
    ? integrationId
    : selectedSourceId || (apiKey?.eventSourceId || apiKey?.integrationId || undefined);

  const hasSource = Boolean(effectiveSourceId);

  const eventSourcesQuery = useEventSources(
    { limit: 100 },
    { enabled: open && !hasFixedSource && mode === "create" },
  );
  const eventSources = useMemo(
    () => eventSourcesQuery.data?.items ?? [],
    [eventSourcesQuery.data?.items],
  );
  const selectedSource = useMemo(
    () =>
      eventSources.find(
        (source: { id: string }) => source.id === selectedSourceId,
      ) ?? null,
    [eventSources, selectedSourceId],
  );
  const filteredEventSources = useMemo(() => {
    const term = sourceSearch.trim().toLowerCase();
    if (!term) return eventSources;
    return eventSources.filter(
      (source: { name: string; status: string; sourceType?: string }) =>
        source.name.toLowerCase().includes(term) ||
        source.status.toLowerCase().includes(term) ||
        (source.sourceType?.toLowerCase().includes(term) ?? false),
    );
  }, [eventSources, sourceSearch]);

  const [keyName, setKeyName] = useState(
    mode === "edit" && apiKey
      ? apiKey.keyName
      : mode === "rotate" && apiKey
        ? apiKey.keyName
        : "",
  );
  const [scopes, setScopes] = useState<string[]>(
    mode === "edit" && apiKey?.scopes && apiKey.scopes.length > 0
      ? apiKey.scopes
      : hasFixedSource
        ? ["events:ingest"]
        : ["events:read"],
  );
  const [expiresAt, setExpiresAt] = useState(
    mode === "edit" && apiKey?.expiresAt
      ? formatDateTimeLocalInput(apiKey.expiresAt)
      : "",
  );
  const [minExpiryDateTime] = useState(() =>
    formatDateTimeLocalInput(new Date(Date.now() + 60000)),
  );
  const [formError, setFormError] = useState<string | null>(null);

  const syncKey = `${open}-${mode}-${apiKey?.id ?? "new"}-${integrationId}`;
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);
  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    if (open) {
      const fixedSource = Boolean(integrationId && integrationId !== "all");
      if (mode === "edit" && apiKey) {
        setKeyName(apiKey.keyName || apiKey.name || "");
        setScopes(
          apiKey.scopes && apiKey.scopes.length > 0
            ? apiKey.scopes
            : ["events:read"],
        );
        setExpiresAt(
          apiKey.expiresAt ? formatDateTimeLocalInput(apiKey.expiresAt) : "",
        );
        setSelectedSourceId(apiKey.eventSourceId || apiKey.integrationId || "");
      } else if (mode === "rotate" && apiKey) {
        setKeyName(apiKey.keyName || apiKey.name || "");
        setExpiresAt("");
      } else if (mode === "create") {
        setKeyName("");
        setSelectedSourceId("");
        setScopes(fixedSource ? ["events:ingest"] : ["events:read"]);
        setExpiresAt("");
      }
      setSourceDropdownOpen(false);
      setSourceSearch("");
      setFormError(null);
    }
  }

  useEffect(() => {
    if (!sourceDropdownOpen) return;
    sourceSearchInputRef.current?.focus();

    function handleOutsideMouseDown(event: MouseEvent) {
      if (
        sourceDropdownRef.current &&
        !sourceDropdownRef.current.contains(event.target as Node)
      ) {
        setSourceDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideMouseDown);
    return () => document.removeEventListener("mousedown", handleOutsideMouseDown);
  }, [sourceDropdownOpen]);

  function handleSelectEventSource(newSource: string) {
    setSelectedSourceId(newSource);
    setSourceDropdownOpen(false);
    setSourceSearch("");
    if (formError && formError.toLowerCase().includes("event source")) {
      setFormError(null);
    }
    if (!newSource) {
      setScopes((prev) => {
        const filtered = prev.filter((s) => s !== "events:ingest");
        return filtered.length > 0 ? filtered : ["events:read"];
      });
    } else {
      setScopes((prev) => Array.from(new Set([...prev, "events:ingest"])));
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleToggleScope(scopeCode: string) {
    if (scopeCode === "events:ingest" && !hasSource) {
      return;
    }
    setScopes((prev) => {
      if (prev.includes(scopeCode)) {
        if (prev.length === 1) {
          return prev; // keep at least one scope
        }
        return prev.filter((s) => s !== scopeCode);
      }
      return [...prev, scopeCode];
    });
  }

  function handleSetExpiryPreset(days: number) {
    if (formError && formError.toLowerCase().includes("expiration")) {
      setFormError(null);
    }
    const target = new Date(Date.now() + days * 86400000);
    setExpiresAt(formatDateTimeLocalInput(target));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const formattedExpiresAt = expiresAt ? new Date(expiresAt).toISOString() : null;

    if (mode !== "rotate") {
      if (!keyName.trim()) {
        setFormError("Key name cannot be empty");
        return;
      }

      if (keyName.trim().length > 255) {
        setFormError("Key identifier name must not exceed 255 characters.");
        return;
      }

      if (scopes.length === 0) {
        setFormError("At least one authorized scope must be selected");
        return;
      }

      if (scopes.includes("events:ingest") && !hasSource) {
        setFormError(
          "Event source selection is required when the events:ingest scope is selected",
        );
        return;
      }

      if (!formattedExpiresAt) {
        setFormError(
          "Expiration date is required. Non-expiring API keys are not permitted.",
        );
        return;
      }

      if (new Date(formattedExpiresAt).getTime() <= Date.now()) {
        setFormError("Expiration date must be in the future");
        return;
      }
    } else if (apiKey) {
      if (apiKey.status === "EXPIRED" && !formattedExpiresAt) {
        setFormError(
          "A new future expiration date is required when rotating an expired API key.",
        );
        return;
      }
      if (formattedExpiresAt && new Date(formattedExpiresAt).getTime() <= Date.now()) {
        setFormError("Expiration date must be in the future");
        return;
      }
    }

    try {
      if (mode === "create") {
        const result = await createMutation.mutateAsync({
          integrationId: effectiveSourceId ?? (integrationId || "all"),
          input: {
            keyName: keyName.trim(),
            name: keyName.trim(),
            scopes,
            expiresAt: formattedExpiresAt,
            isActive: true,
            ...(effectiveSourceId
              ? {
                  eventSourceId: effectiveSourceId,
                  integrationId: effectiveSourceId,
                }
              : {}),
          },
        });

        toast.success(
          "API key created successfully",
          "Your new integration key has been generated and activated.",
        );
        onOpenChange(false);
        onSecretGenerated(result.keyName, result.secret);
      } else if (mode === "edit" && apiKey) {
        await updateMutation.mutateAsync({
          integrationId,
          keyId: apiKey.id,
          input: {
            name: keyName.trim(),
            keyName: keyName.trim(),
            scopes,
            expiresAt: formattedExpiresAt,
          },
        });

        toast.success(
          "API key updated successfully",
          "Authorized scopes and expiration settings have been updated.",
        );
        onOpenChange(false);
      } else if (mode === "rotate" && apiKey) {
        const result = await rotateMutation.mutateAsync({
          integrationId,
          keyId: apiKey.id,
          ...(formattedExpiresAt ? { input: { expiresAt: formattedExpiresAt } } : {}),
        });

        toast.success("Secret token rotated successfully");
        onOpenChange(false);
        onSecretGenerated(result.keyName, result.secret);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError("An error occurred while saving the API key. Please try again.");
      }
    }
  }

  const isPending =
    createMutation.isPending || updateMutation.isPending || rotateMutation.isPending;

  return (
    <dialog
      aria-labelledby="api-key-modal-title"
      className="border-border bg-surface text-foreground m-auto max-h-[calc(100dvh-2rem)] w-[min(38rem,calc(100%-2rem))] overflow-y-auto rounded-xl border p-0 backdrop:bg-[#07110f]/55 shadow-2xl"
      onCancel={(e) => {
        e.preventDefault();
        onOpenChange(false);
      }}
      ref={dialogRef}
    >
      <div className="border-border bg-surface border-b p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="text-brand flex size-8 items-center justify-center rounded-lg bg-brand/10 border border-brand/20">
              {mode === "rotate" ? (
                <RefreshCw className="size-4" />
              ) : mode === "edit" ? (
                <KeyRound className="size-4" />
              ) : (
                <Key className="size-4" />
              )}
            </div>
            <div>
              <h3 id="api-key-modal-title" className="text-sm font-semibold tracking-tight">
                {mode === "create"
                  ? "Create New API Key"
                  : mode === "rotate"
                    ? "Rotate API Key Secret"
                    : "Edit API Key"}
              </h3>
              <p className="text-muted text-xs">
                {mode === "rotate"
                  ? `Generate a new secret token for "${apiKey?.keyName}"`
                  : mode === "create"
                    ? "Configure name, authorized scopes, and expiration settings for integration access"
                    : "Update key name, authorized scopes, and expiration settings"}
              </p>
            </div>
          </div>
          <button
            aria-label="Close"
            className="text-muted hover:text-foreground rounded p-1 transition-colors"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <form className="space-y-4 p-5 text-xs" onSubmit={handleSubmit} noValidate>
        {formError ? (
          <Alert className="border-danger/30 bg-danger/10 text-danger">
            {formError}
          </Alert>
        ) : null}

        {mode === "create" ? (
          <div className="flex items-center gap-2 rounded-lg bg-brand/5 border border-brand/20 p-2.5 text-xs text-muted">
            <Sparkles className="size-4 text-brand shrink-0" />
            <p className="text-[11px] leading-relaxed">
              SecuraAI will automatically generate a cryptographically secure 192-bit secret token (<code className="font-mono text-brand text-[10px]">sec_live_...</code>) for this key upon creation.
            </p>
          </div>
        ) : null}

        {mode === "rotate" ? (
          <Alert className="border-warning/30 bg-warning-soft text-warning font-medium">
            Rotating the secret token will invalidate the current key immediately. The system will automatically generate a new cryptographically secure 192-bit secret token and display it once upon completion.
          </Alert>
        ) : null}

        {mode !== "rotate" ? (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" htmlFor="key-name-input">
              Key Identifier Name <span className="text-danger">*</span>
            </Label>
            <Input
              className={`text-xs ${
                formError && formError.toLowerCase().includes("key name")
                  ? "border-danger focus:border-danger focus:ring-danger/20"
                  : ""
              }`}
              id="key-name-input"
              maxLength={255}
              onChange={(e) => {
                setKeyName(e.target.value);
                if (formError && formError.toLowerCase().includes("key name")) {
                  setFormError(null);
                }
              }}
              placeholder="e.g., Wazuh Manager HEC Ingest Key"
              value={keyName}
            />
            <p className="text-muted text-[11px]">
              A descriptive name identifying the integration client, system, or agent.
            </p>
          </div>
        ) : null}

        {mode === "create" && !hasFixedSource ? (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium" htmlFor="event-source-select">
              Associated Event Source{" "}
              <span className="text-muted font-normal">(Required for Log Ingestion scope)</span>
            </Label>
            <div className="relative" ref={sourceDropdownRef}>
              <button
                aria-controls="event-source-listbox"
                aria-expanded={sourceDropdownOpen}
                aria-haspopup="listbox"
                aria-label="Associated Event Source"
                className={`bg-surface text-foreground flex h-9 w-full items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-left text-xs shadow-xs transition-colors focus:outline-hidden focus:ring-1 focus:ring-brand disabled:opacity-60 ${formError && formError.toLowerCase().includes("event source") ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border"}`}
                disabled={eventSourcesQuery.isLoading}
                id="event-source-select"
                onClick={() => setSourceDropdownOpen((prev) => !prev)}
                role="combobox"
                type="button"
              >
                <span className="truncate">
                  {eventSourcesQuery.isLoading
                    ? "Loading event sources..."
                    : selectedSource
                      ? `${selectedSource.name} (${selectedSource.status})`
                      : "-- None (General Read-Only Key) --"}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={`text-muted size-4 shrink-0 transition-transform ${
                    sourceDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {sourceDropdownOpen ? (
                <div className="border-border bg-surface absolute z-30 mt-1 w-full overflow-hidden rounded-lg border shadow-lg">
                  <div className="border-border bg-neutral-soft/30 border-b p-2">
                    <div className="relative">
                      <Search
                        aria-hidden="true"
                        className="text-muted pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
                      />
                      <input
                        aria-label="Filter event sources"
                        className="border-border bg-surface text-foreground placeholder:text-muted focus:border-brand focus:ring-brand/15 h-8 w-full rounded-md border pl-8 pr-7 text-xs outline-none focus:ring-2"
                        onChange={(e) => setSourceSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            e.preventDefault();
                            e.stopPropagation();
                            setSourceDropdownOpen(false);
                          }
                        }}
                        placeholder="Search event sources..."
                        ref={sourceSearchInputRef}
                        type="text"
                        value={sourceSearch}
                      />
                      {sourceSearch ? (
                        <button
                          aria-label="Clear source search"
                          className="text-muted hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
                          onClick={() => {
                            setSourceSearch("");
                            sourceSearchInputRef.current?.focus();
                          }}
                          type="button"
                        >
                          <X className="size-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div
                    aria-label="Event source options"
                    className="max-h-[180px] overflow-y-auto p-1"
                    id="event-source-listbox"
                    role="listbox"
                  >
                    {!sourceSearch.trim() ||
                    "none general read-only key".includes(
                      sourceSearch.trim().toLowerCase(),
                    ) ? (
                      <button
                        aria-selected={!selectedSourceId}
                        className={`flex min-h-8 w-full items-center justify-between gap-2 rounded px-2.5 py-1.5 text-left text-xs transition-colors ${
                          !selectedSourceId
                            ? "bg-brand/10 text-brand font-medium"
                            : "text-foreground hover:bg-neutral-soft"
                        }`}
                        onClick={() => handleSelectEventSource("")}
                        role="option"
                        type="button"
                      >
                        <span className="truncate">-- None (General Read-Only Key) --</span>
                        {!selectedSourceId ? (
                          <Check aria-hidden="true" className="size-3.5 shrink-0" />
                        ) : null}
                      </button>
                    ) : null}

                    {filteredEventSources.map(
                      (source: { id: string; name: string; status: string }) => {
                        const isSelected = selectedSourceId === source.id;
                        return (
                          <button
                            aria-selected={isSelected}
                            className={`flex min-h-8 w-full items-center justify-between gap-2 rounded px-2.5 py-1.5 text-left text-xs transition-colors ${
                              isSelected
                                ? "bg-brand/10 text-brand font-medium"
                                : "text-foreground hover:bg-neutral-soft"
                            }`}
                            key={source.id}
                            onClick={() => handleSelectEventSource(source.id)}
                            role="option"
                            type="button"
                          >
                            <span className="truncate">
                              {source.name}{" "}
                              <span className="text-muted text-[11px]">
                                ({source.status})
                              </span>
                            </span>
                            {isSelected ? (
                              <Check aria-hidden="true" className="size-3.5 shrink-0" />
                            ) : null}
                          </button>
                        );
                      },
                    )}

                    {filteredEventSources.length === 0 && sourceSearch.trim() ? (
                      <div className="text-muted px-2.5 py-3 text-center text-[11px]">
                        No event sources match &quot;{sourceSearch.trim()}&quot;.
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
            {eventSourcesQuery.isError ? (
              <div className="text-danger flex items-center justify-between gap-2 text-[11px]">
                <span>Failed to load event sources. General Read-Only keys remain available.</span>
                <button
                  type="button"
                  onClick={() => eventSourcesQuery.refetch()}
                  className="underline hover:opacity-80"
                >
                  Retry
                </button>
              </div>
            ) : eventSourcesQuery.isSuccess && eventSources.length === 0 ? (
              <p className="text-muted text-[11px]">
                No configured event sources found. You can still create a General Read-Only API key without an event source.
              </p>
            ) : (
              <p className="text-muted text-[11px]">
                An event source must be bound to this key if you wish to assign the <code>events:ingest</code> scope.
              </p>
            )}
          </div>
        ) : null}

        {/* Authorized Scopes selector in Create and Edit modes */}
        {mode !== "rotate" ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Shield className="size-3.5 text-brand" />
                Authorized Scopes <span className="text-danger">*</span>
              </Label>
              <span className="text-[11px] text-muted">
                {scopes.length} selected
              </span>
            </div>
            <div className="border border-border/80 bg-neutral-soft/30 rounded-lg divide-y divide-border/60 overflow-hidden">
              {standardApiKeyScopes.map((scopeCode: StandardApiKeyScope) => {
                const info = apiKeyScopeDetails[scopeCode];
                const isChecked = scopes.includes(scopeCode);
                const isIngestScope = scopeCode === "events:ingest";
                const isScopeDisabled = isIngestScope && !hasSource;

                return (
                  <label
                    key={scopeCode}
                    className={`flex items-start gap-3 p-3 transition-colors select-none ${
                      isScopeDisabled
                        ? "cursor-not-allowed opacity-60 bg-neutral-soft/10"
                        : isChecked
                          ? "cursor-pointer bg-brand/5 hover:bg-brand/10"
                          : "cursor-pointer hover:bg-neutral-soft/60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isScopeDisabled}
                      onChange={() => handleToggleScope(scopeCode)}
                      className="accent-brand size-3.5 mt-0.5 rounded border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground text-xs">
                          {info.label}
                        </span>
                        <code className="px-1.5 py-0.5 rounded bg-neutral-soft border border-border/60 text-[10px] text-muted font-mono">
                          {scopeCode}
                        </code>
                        {isScopeDisabled ? (
                          <span className="text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-medium">
                            Requires Event Source
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-muted mt-0.5 leading-relaxed">
                        {info.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label className="text-xs font-medium flex items-center gap-1.5" htmlFor="expires-at-input">
              <Clock className="size-3.5 text-muted" />
              <span>
                Expiration Date{" "}
                {mode !== "rotate" || apiKey?.status === "EXPIRED" ? (
                  <strong className="text-danger">*</strong>
                ) : (
                  <span className="text-muted font-normal">(Optional)</span>
                )}
              </span>
            </Label>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => handleSetExpiryPreset(30)}
                className="px-2 py-0.5 text-[10px] rounded bg-neutral-soft hover:bg-neutral-soft/80 border border-border/60 text-muted hover:text-foreground transition-colors"
              >
                30 days
              </button>
              <button
                type="button"
                onClick={() => handleSetExpiryPreset(90)}
                className="px-2 py-0.5 text-[10px] rounded bg-neutral-soft hover:bg-neutral-soft/80 border border-border/60 text-muted hover:text-foreground transition-colors"
              >
                90 days
              </button>
              <button
                type="button"
                onClick={() => handleSetExpiryPreset(365)}
                className="px-2 py-0.5 text-[10px] rounded bg-neutral-soft hover:bg-neutral-soft/80 border border-border/60 text-muted hover:text-foreground transition-colors"
              >
                1 year
              </button>
            </div>
          </div>
          <div className="relative">
            <Input
              className={`text-xs ${
                formError && formError.toLowerCase().includes("expiration")
                  ? "border-danger focus:border-danger focus:ring-danger/20"
                  : ""
              }`}
              id="expires-at-input"
              min={minExpiryDateTime}
              onChange={(e) => {
                setExpiresAt(e.target.value);
                if (formError && formError.toLowerCase().includes("expiration")) {
                  setFormError(null);
                }
              }}
              type="datetime-local"
              value={expiresAt}
            />
          </div>
          <p className="text-muted text-[11px]">
            {expiresAt
              ? `Key will automatically expire on ${new Date(expiresAt).toLocaleString()}.`
              : mode === "rotate"
                ? apiKey?.status === "EXPIRED"
                  ? "This key has expired. Choose a preset or enter a new future expiration date to reactivate it via rotation."
                  : "Leave blank to keep the existing expiration schedule, or pick a new future date."
                : "Expiration date is required. Click a preset button or choose a custom future date."}
          </p>
        </div>

        <div className="border-border flex flex-wrap justify-end gap-2 border-t pt-4">
          <Button
            className="min-h-8 px-3 text-xs bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            className="min-h-8 px-4 text-xs font-medium"
            disabled={isPending}
            type="submit"
          >
            {isPending
              ? "Saving..."
              : mode === "create"
                ? "Create API Key"
                : mode === "rotate"
                  ? "Confirm Rotation"
                  : "Save Changes"}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
