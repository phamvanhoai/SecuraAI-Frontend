"use client";

import {
  Clock,
  Key,
  KeyRound,
  RefreshCw,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const effectiveSourceId = hasFixedSource
    ? integrationId
    : selectedSourceId || (apiKey?.eventSourceId || apiKey?.integrationId || undefined);

  const hasSource = Boolean(effectiveSourceId);

  const eventSourcesQuery = useEventSources(
    { limit: 100 },
    { enabled: open && !hasFixedSource && mode === "create" },
  );
  const eventSources = eventSourcesQuery.data?.items ?? [];

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
      ? apiKey.expiresAt.slice(0, 16)
      : "",
  );
  const [minExpiryDateTime] = useState(() =>
    new Date(Date.now() + 60000).toISOString().slice(0, 16),
  );
  const [formError, setFormError] = useState<string | null>(null);

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

  useEffect(() => {
    if (open) {
      const fixedSource = Boolean(integrationId && integrationId !== "all");
      if (mode === "edit" && apiKey) {
        setKeyName(apiKey.keyName || apiKey.name || "");
        setScopes(
          apiKey.scopes && apiKey.scopes.length > 0
            ? apiKey.scopes
            : ["events:read"],
        );
        setExpiresAt(apiKey.expiresAt ? apiKey.expiresAt.slice(0, 16) : "");
        setSelectedSourceId(apiKey.eventSourceId || apiKey.integrationId || "");
      } else if (mode === "rotate" && apiKey) {
        setKeyName(apiKey.keyName || apiKey.name || "");
      } else if (mode === "create") {
        setKeyName("");
        setSelectedSourceId("");
        setScopes(fixedSource ? ["events:ingest"] : ["events:read"]);
        setExpiresAt("");
      }
      setFormError(null);
    }
  }, [open, apiKey, mode, integrationId]);

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

  function handleSetExpiryPreset(days: number | null) {
    if (days === null) {
      setExpiresAt("");
      return;
    }
    const target = new Date(Date.now() + days * 86400000);
    setExpiresAt(target.toISOString().slice(0, 16));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const formattedExpiresAt = expiresAt ? new Date(expiresAt).toISOString() : null;

    if (formattedExpiresAt && new Date(formattedExpiresAt).getTime() <= Date.now()) {
      setFormError("Expiration date must be in the future.");
      return;
    }

    try {
      if (mode === "create") {
        if (!keyName.trim()) {
          setFormError("Key identifier name is required.");
          return;
        }

        if (scopes.length === 0) {
          setFormError("At least one authorized scope must be selected.");
          return;
        }

        if (scopes.includes("events:ingest") && !effectiveSourceId) {
          setFormError("The scope 'events:ingest' requires an associated event source.");
          return;
        }

        const result = await createMutation.mutateAsync({
          integrationId: effectiveSourceId ?? integrationId,
          input: {
            keyName: keyName.trim(),
            name: keyName.trim(),
            scopes,
            expiresAt: formattedExpiresAt,
            isActive: true,
            eventSourceId: effectiveSourceId,
            integrationId: effectiveSourceId,
          },
        });

        toast.success(
          "API key created successfully",
          "Your new integration key has been generated and activated.",
        );
        onOpenChange(false);
        onSecretGenerated(result.keyName, result.secret);
      } else if (mode === "edit" && apiKey) {
        if (!keyName.trim()) {
          setFormError("Key identifier name is required.");
          return;
        }

        if (scopes.length === 0) {
          setFormError("At least one authorized scope must be selected.");
          return;
        }

        if (scopes.includes("events:ingest") && !hasSource) {
          setFormError("The scope 'events:ingest' requires an associated event source.");
          return;
        }

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

      <form className="space-y-4 p-5 text-xs" onSubmit={handleSubmit}>
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
              className="text-xs"
              id="key-name-input"
              maxLength={100}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g., Wazuh Manager HEC Ingest Key"
              required
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
            <select
              id="event-source-select"
              aria-label="Associated Event Source"
              className="border-border bg-surface text-foreground h-9 w-full rounded-md border px-3 py-1.5 text-xs shadow-xs focus:outline-hidden focus:ring-1 focus:ring-brand"
              value={selectedSourceId}
              onChange={(e) => {
                const newSource = e.target.value;
                setSelectedSourceId(newSource);
                if (!newSource) {
                  setScopes((prev) => {
                    const filtered = prev.filter((s) => s !== "events:ingest");
                    return filtered.length > 0 ? filtered : ["events:read"];
                  });
                } else {
                  setScopes((prev) => Array.from(new Set([...prev, "events:ingest"])));
                }
              }}
            >
              <option value="">-- None (General Read-Only Key) --</option>
              {eventSources.map((source: { id: string; name: string; status: string }) => (
                <option key={source.id} value={source.id}>
                  {source.name} ({source.status})
                </option>
              ))}
            </select>
            <p className="text-muted text-[11px]">
              An event source must be bound to this key if you wish to assign the <code>events:ingest</code> scope.
            </p>
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
                        <code className="px-1.5 py-0.2 rounded bg-neutral-soft border border-border/60 text-[10px] text-muted font-mono">
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

        {mode !== "rotate" ? (
          <>
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium flex items-center gap-1.5" htmlFor="expires-at-input">
                  <Clock className="size-3.5 text-muted" />
                  Expiration Settings
                </Label>
                <div className="flex items-center gap-1">
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
                  <button
                    type="button"
                    onClick={() => handleSetExpiryPreset(null)}
                    className="px-2 py-0.5 text-[10px] rounded bg-neutral-soft hover:bg-neutral-soft/80 border border-border/60 text-muted hover:text-foreground transition-colors"
                  >
                    Never
                  </button>
                </div>
              </div>
              <div className="relative">
                <Input
                  className="text-xs"
                  id="expires-at-input"
                  min={minExpiryDateTime}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  type="datetime-local"
                  value={expiresAt}
                />
              </div>
              <p className="text-muted text-[11px]">
                {expiresAt
                  ? `Key will automatically expire on ${new Date(expiresAt).toLocaleString()}.`
                  : "Non-expiring key. Click a preset button or choose a custom future date to set expiration."}
              </p>
            </div>
          </>
        ) : null}

        <div className="border-border flex justify-end gap-2 border-t pt-4">
          <Button
            className="min-h-8 px-3 text-xs bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Cancel
          </Button>
          <Button
            className="min-h-8 px-4 text-xs font-medium"
            disabled={
              isPending ||
              (mode !== "rotate" && (!keyName.trim() || scopes.length === 0))
            }
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
