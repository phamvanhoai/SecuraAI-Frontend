"use client";

import { Key, KeyRound, RefreshCw, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/api-error";
import {
  useCreateApiKey,
  useRotateApiKey,
  useUpdateApiKey,
} from "../hooks/use-integrations";
import type { IntegrationApiKey } from "../schemas/integration-schema";

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

  const [keyName, setKeyName] = useState(
    mode === "edit" && apiKey
      ? apiKey.keyName
      : mode === "rotate" && apiKey
        ? apiKey.keyName
        : "",
  );
  const [secret, setSecret] = useState("");
  const [expiresAt, setExpiresAt] = useState(
    mode === "edit" && apiKey?.expiresAt
      ? apiKey.expiresAt.slice(0, 16)
      : "",
  );
  const [minExpiryDateTime] = useState(() =>
    new Date(Date.now() + 60000).toISOString().slice(0, 16),
  );
  const [isActive, setIsActive] = useState(
    mode === "edit" && apiKey ? apiKey.isActive : false,
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

  function handleGenerateSecret() {
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    const generated = "sec_" + Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
    setSecret(generated);
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

        const result = await createMutation.mutateAsync({
          integrationId,
          input: {
            keyName: keyName.trim(),
            secret: secret.trim() || undefined,
            expiresAt: formattedExpiresAt,
            isActive,
          },
        });

        toast.success("API key created successfully");
        onOpenChange(false);
        onSecretGenerated(result.keyName, result.secret);
      } else if (mode === "edit" && apiKey) {
        if (!keyName.trim()) {
          setFormError("Key identifier name is required.");
          return;
        }

        await updateMutation.mutateAsync({
          integrationId,
          keyId: apiKey.id,
          input: {
            keyName: keyName.trim(),
            expiresAt: formattedExpiresAt,
            isActive,
          },
        });

        toast.success("API key updated successfully");
        onOpenChange(false);
      } else if (mode === "rotate" && apiKey) {
        const result = await rotateMutation.mutateAsync({
          integrationId,
          keyId: apiKey.id,
          input: {
            secret: secret.trim() || undefined,
          },
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
      className="border-border bg-surface text-foreground m-auto max-h-[calc(100dvh-2rem)] w-[min(34rem,calc(100%-2rem))] overflow-y-auto rounded-xl border p-0 backdrop:bg-[#07110f]/55"
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
                  : "Configure authentication credentials for this integration endpoint"}
              </p>
            </div>
          </div>
          <button
            aria-label="Close"
            className="text-muted hover:text-foreground rounded p-1"
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

        {mode === "rotate" ? (
          <Alert className="border-amber-500/30 bg-amber-500/10 text-amber-200">
            Rotating the secret token will invalidate the current key immediately. The new secret will be displayed once upon completion.
          </Alert>
        ) : null}

        {mode !== "rotate" ? (
          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="key-name-input">
              Key Identifier Name <span className="text-danger">*</span>
            </Label>
            <Input
              className="text-xs"
              id="key-name-input"
              maxLength={100}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="e.g., Wazuh Manager HEC Token"
              required
              value={keyName}
            />
          </div>
        ) : null}

        {mode !== "edit" ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs" htmlFor="secret-input">
                {mode === "rotate" ? "New Secret Token" : "Secret Token (Optional)"}
              </Label>
              <button
                className="text-brand hover:text-brand-hover inline-flex items-center gap-1 text-[11px] font-medium"
                onClick={handleGenerateSecret}
                type="button"
              >
                <Sparkles className="size-3" />
                Auto-generate
              </button>
            </div>
            <Input
              className="font-mono text-xs"
              id="secret-input"
              maxLength={1000}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Leave blank to auto-generate a secure token"
              type="text"
              value={secret}
            />
            <p className="text-muted text-[11px]">
              If left empty, a cryptographically secure 192-bit token will be generated automatically.
            </p>
          </div>
        ) : null}

        {mode !== "rotate" ? (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="expires-at-input">
                Expiration Date (Optional)
              </Label>
              <Input
                className="text-xs"
                id="expires-at-input"
                min={minExpiryDateTime}
                onChange={(e) => setExpiresAt(e.target.value)}
                type="datetime-local"
                value={expiresAt}
              />
              <p className="text-muted text-[11px]">
                Expiration must be in the future. Leave empty for a non-expiring key.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                checked={isActive}
                className="accent-brand size-3.5 rounded border-border"
                id="is-active-input"
                onChange={(e) => setIsActive(e.target.checked)}
                type="checkbox"
              />
              <Label className="text-xs cursor-pointer font-normal" htmlFor="is-active-input">
                Activate API Key immediately upon creation
              </Label>
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
            className="min-h-8 px-4 text-xs"
            disabled={isPending || (mode !== "rotate" && !keyName.trim())}
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
