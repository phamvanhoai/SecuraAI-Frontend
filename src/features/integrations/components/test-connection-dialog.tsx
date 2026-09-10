"use client";

import { Activity, CheckCircle2, ShieldAlert, Wifi, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/feedback/toast";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/api-error";
import { useTestConnection } from "../hooks/use-integrations";
import type {
  Integration,
  TestConnectionResult,
} from "../schemas/integration-schema";

export function TestConnectionDialog({
  integration,
  open,
  onOpenChange,
}: {
  integration: Integration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toast = useToast();
  const testMutation = useTestConnection();
  const [timeoutMs, setTimeoutMs] = useState<number>(5000);
  const [lastResult, setLastResult] = useState<TestConnectionResult | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  if (!integration) return null;

  async function handleRunTest() {
    if (!integration) return;
    setErrorMsg(null);
    setLastResult(null);

    try {
      const result = await testMutation.mutateAsync({
        id: integration.id,
        timeoutMs,
      });
      setLastResult(result);
      if (result.connected) {
        toast.success(
          "Connection Successful",
          `Latency: ${result.latencyMs}ms. ${result.message}`,
        );
      } else {
        setErrorMsg(result.message);
        toast.error("Connection Test Failed", result.message);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Unable to reach the remote endpoint. Please check the URL and network configuration.";
      setErrorMsg(msg);
      toast.error("Connection Test Failed", msg);
    }
  }

  function handleClose() {
    setLastResult(null);
    setErrorMsg(null);
    onOpenChange(false);
  }

  return (
    <dialog
      aria-labelledby="test-connection-title"
      className="border-border bg-surface text-foreground m-auto w-[min(32rem,calc(100%-2rem))] rounded-xl border p-6 backdrop:bg-[#07110f]/55"
      onCancel={(e) => {
        e.preventDefault();
        handleClose();
      }}
      ref={dialogRef}
    >
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Wifi className="text-brand size-5" />
          <h2 id="test-connection-title" className="text-base font-semibold">
            Test API Connection
          </h2>
        </div>
        <button
          aria-label="Close"
          className="text-muted hover:text-foreground p-1"
          onClick={handleClose}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>

      <p className="text-muted text-xs mt-3">
        Executes a safe request to verify endpoint reachability and latency for{" "}
        <strong className="text-foreground">{integration.name}</strong>.
      </p>

      <div className="space-y-4 py-3">
        <div className="border-border bg-neutral-soft/50 rounded-lg border p-3 text-xs">
          <div className="flex justify-between py-1 border-b border-border/40">
            <span className="text-muted">Integration Type:</span>
            <span className="font-medium uppercase">
              {integration.integrationType}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-border/40">
            <span className="text-muted">Base URL:</span>
            <span className="font-mono text-[11px] font-semibold">
              {integration.baseUrl || "(No URL configured)"}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-muted">Last Connected:</span>
            <span>
              {integration.lastConnectedAt
                ? new Date(integration.lastConnectedAt).toLocaleString("en-US")
                : "Never connected"}
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs" htmlFor="timeout-select">
            Timeout:
          </Label>
          <Select
            id="timeout-select"
            onChange={(e) => setTimeoutMs(Number(e.target.value))}
            value={String(timeoutMs)}
          >
            <option value="3000">3 seconds (Fast)</option>
            <option value="5000">5 seconds (Default)</option>
            <option value="10000">10 seconds (Slow network / VPN)</option>
          </Select>
        </div>

        {lastResult && lastResult.connected ? (
          <div className="border-success/30 bg-success-soft/30 rounded-lg border p-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="text-success mt-0.5 size-4 shrink-0" />
              <div className="space-y-1 text-xs">
                <p className="text-success font-semibold">
                  Secure connection established!
                </p>
                <p className="text-muted text-[11px]">{lastResult.message}</p>
                <div className="mt-1 flex items-center gap-3 text-[11px]">
                  <span className="bg-surface border-border inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono">
                    <Activity className="text-brand size-3" />
                    {lastResult.latencyMs} ms
                  </span>
                  <span className="text-muted">
                    Tested at:{" "}
                    {new Date(lastResult.checkedAt).toLocaleTimeString("en-US")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {errorMsg ? (
          <Alert className="border-danger/25 bg-danger-soft text-danger">
            <div className="flex items-start gap-2">
              <ShieldAlert className="size-4 shrink-0" />
              <div>
                <p className="font-semibold text-xs">Connection test failed</p>
                <p className="mt-0.5 text-[11px]">{errorMsg}</p>
              </div>
            </div>
          </Alert>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-border">
        <Button
          className="min-h-9 px-3 text-xs bg-surface text-foreground ring-border hover:bg-neutral-soft ring-1"
          onClick={handleClose}
          type="button"
        >
          Close
        </Button>
        <Button
          className="min-h-9 px-3 text-xs"
          disabled={testMutation.isPending || !integration.baseUrl}
          onClick={handleRunTest}
          type="button"
        >
          {testMutation.isPending ? "Testing..." : "Test Connection"}
        </Button>
      </div>
    </dialog>
  );
}
