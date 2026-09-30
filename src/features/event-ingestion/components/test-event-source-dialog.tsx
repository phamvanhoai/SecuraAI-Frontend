"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Activity,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  RotateCw,
  ShieldAlert,
  User,
  XCircle,
} from "lucide-react";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useTestEventSourceConnection } from "../hooks/use-event-sources";
import {
  testEventSourceConnectionSchema,
  type TestEventSourceConnectionValues,
  type TestEventSourceDiagnosticResponse,
} from "../schemas/event-source-schema";

function resolveDefaultEndpoint(raw?: string | undefined): string {
  if (!raw || raw.startsWith("/") || raw.trim() === "") {
    return "https://127.0.0.1:55000";
  }
  return raw;
}

export function TestEventSourceDialog({
  isOpen,
  onClose,
  initialEndpoint = "",
  initialUsername = "wazuh-wui",
  onTestComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialEndpoint?: string | undefined;
  initialUsername?: string | undefined;
  onTestComplete?: ((result: TestEventSourceDiagnosticResponse) => void) | undefined;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const testMutation = useTestEventSourceConnection();

  const [endpoint, setEndpoint] = useState(() => resolveDefaultEndpoint(initialEndpoint));
  const [username, setUsername] = useState(initialUsername || "wazuh-wui");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verifySsl, setVerifySsl] = useState(false);
  const [timeoutMs, setTimeoutMs] = useState(10000);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [diagnosticResult, setDiagnosticResult] =
    useState<TestEventSourceDiagnosticResponse | null>(null);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setEndpoint(resolveDefaultEndpoint(initialEndpoint));
      setUsername(initialUsername || "wazuh-wui");
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  function handleClose(): void {
    if (testMutation.isPending) return;
    onClose();
  }

  async function handleRunTest(e: FormEvent): Promise<void> {
    e.preventDefault();
    setDiagnosticResult(null);

    const parseResult = testEventSourceConnectionSchema.safeParse({
      endpoint,
      username,
      password,
      verifySsl,
      timeoutMs,
    });

    if (!parseResult.success) {
      const errors: Record<string, string> = {};
      for (const issue of parseResult.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    try {
      const result = await testMutation.mutateAsync(parseResult.data as TestEventSourceConnectionValues);
      setDiagnosticResult(result);
      onTestComplete?.(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to execute connection test";
      const failResult: TestEventSourceDiagnosticResponse = {
        connected: false,
        statusCode: null,
        latencyMs: 0,
        message,
        provider: "wazuh",
        details: null,
        verifySslWarning: !verifySsl,
      };
      setDiagnosticResult(failResult);
      onTestComplete?.(failResult);
    }
  }

  function handleReset(): void {
    setEndpoint(resolveDefaultEndpoint(initialEndpoint));
    setUsername(initialUsername || "wazuh-wui");
    setPassword("");
    setVerifySsl(false);
    setTimeoutMs(10000);
    setFieldErrors({});
    setDiagnosticResult(null);
  }

  return (
    <Dialog
      aria-label="Test Wazuh Event Source"
      className="w-[min(42rem,calc(100%-2rem))]"
      dialogRef={dialogRef}
      onClose={handleClose}
      title="Test Event Source Connection"
    >
      <div className="border-border border-b p-6">
        <div className="flex items-center gap-2.5">
          <div className="bg-brand/10 text-brand flex size-9 items-center justify-center rounded-lg">
            <Activity aria-hidden="true" className="size-5" />
          </div>
          <div>
            <p className="text-foreground text-sm font-semibold">
              Wazuh Diagnostic Probe
            </p>
            <p className="text-muted text-xs">
              Verify connection and authentication diagnostics against a Wazuh Manager before applying changes.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleRunTest} className="p-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField
              error={fieldErrors["endpoint"]}
              id="test-endpoint"
              label="Wazuh Manager Endpoint"
            >
              <div className="relative">
                <Globe
                  aria-hidden="true"
                  className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <Input
                  className="pl-9"
                  disabled={testMutation.isPending}
                  id="test-endpoint"
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://192.168.56.101:55000 or wazuh.internal:55000"
                  value={endpoint}
                />
              </div>
            </FormField>
          </div>

          <FormField
            error={fieldErrors["username"]}
            id="test-username"
            label="API Username"
          >
            <div className="relative">
              <User
                aria-hidden="true"
                className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
              <Input
                className="pl-9"
                disabled={testMutation.isPending}
                id="test-username"
                onChange={(e) => setUsername(e.target.value)}
                placeholder="wazuh-wui"
                value={username}
              />
            </div>
          </FormField>

          <FormField
            error={fieldErrors["password"]}
            id="test-password"
            label="API Password"
          >
            <div className="relative">
              <Lock
                aria-hidden="true"
                className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
              <Input
                className="pr-10 pl-9"
                disabled={testMutation.isPending}
                id="test-password"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="text-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" className="size-4" />
                ) : (
                  <Eye aria-hidden="true" className="size-4" />
                )}
              </button>
            </div>
          </FormField>

          <div>
            <label
              htmlFor="test-timeout"
              className="text-foreground block text-xs font-medium"
            >
              Connection Timeout (ms)
            </label>
            <div className="relative mt-1.5">
              <Clock
                aria-hidden="true"
                className="text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
              <Input
                className="pl-9"
                disabled={testMutation.isPending}
                id="test-timeout"
                max={30000}
                min={1000}
                onChange={(e) => setTimeoutMs(Number(e.target.value) || 5000)}
                step={500}
                type="number"
                value={timeoutMs}
              />
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <label className="border-border bg-neutral-soft/50 hover:bg-neutral-soft inline-flex min-h-10 cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-xs transition-colors">
              <input
                checked={verifySsl}
                className="accent-brand size-4 rounded"
                disabled={testMutation.isPending}
                onChange={(e) => setVerifySsl(e.target.checked)}
                type="checkbox"
              />
              <span className="font-medium">Verify SSL/TLS Certificate</span>
            </label>
          </div>
        </div>

        {/* Diagnostic Results Display */}
        {diagnosticResult ? (
          <div
            className={`border rounded-xl p-4 transition-all ${
              diagnosticResult.connected
                ? "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20"
                : "border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/20"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {diagnosticResult.connected ? (
                  <CheckCircle2
                    aria-hidden="true"
                    className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  />
                ) : (
                  <XCircle
                    aria-hidden="true"
                    className="size-5 shrink-0 text-rose-600 dark:text-rose-400"
                  />
                )}
                <div>
                  <h4
                    className={`text-sm font-semibold ${
                      diagnosticResult.connected
                        ? "text-emerald-800 dark:text-emerald-200"
                        : "text-rose-800 dark:text-rose-200"
                    }`}
                  >
                    {diagnosticResult.connected
                      ? "Connection Successful"
                      : "Connection Failed"}
                  </h4>
                  <p className="text-muted mt-0.5 text-xs">
                    {diagnosticResult.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="border-border bg-surface text-foreground inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-mono font-medium">
                  <Clock aria-hidden="true" className="size-3 text-muted" />
                  {diagnosticResult.latencyMs} ms
                </span>
                {diagnosticResult.statusCode ? (
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-mono font-medium border ${
                      diagnosticResult.connected
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                    }`}
                  >
                    HTTP {diagnosticResult.statusCode}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Wazuh Diagnostics Metadata */}
            {diagnosticResult.connected && diagnosticResult.details ? (
              <div className="mt-3.5 grid gap-2 border-t border-emerald-500/20 pt-3 sm:grid-cols-3">
                <div className="bg-surface/80 rounded-lg border border-emerald-500/10 p-2.5">
                  <span className="text-muted block text-[11px] font-medium">
                    API Version
                  </span>
                  <strong className="text-foreground text-xs font-semibold">
                    {diagnosticResult.details.apiVersion || "v4.x"}
                  </strong>
                </div>
                <div className="bg-surface/80 rounded-lg border border-emerald-500/10 p-2.5">
                  <span className="text-muted block text-[11px] font-medium">
                    Manager Hostname
                  </span>
                  <strong className="text-foreground truncate block text-xs font-semibold">
                    {diagnosticResult.details.hostname || "wazuh-manager"}
                  </strong>
                </div>
                <div className="bg-surface/80 rounded-lg border border-emerald-500/10 p-2.5">
                  <span className="text-muted block text-[11px] font-medium">
                    Service Title
                  </span>
                  <strong className="text-foreground truncate block text-xs font-semibold">
                    {diagnosticResult.details.title || "Wazuh REST API"}
                  </strong>
                </div>
              </div>
            ) : null}

            {diagnosticResult.verifySslWarning ? (
              <div className="mt-3 flex items-center gap-1.5 text-amber-700 dark:text-amber-300 text-xs">
                <ShieldAlert aria-hidden="true" className="size-3.5 shrink-0" />
                <span>SSL certificate verification was bypassed for this test probe.</span>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button
            disabled={testMutation.isPending}
            onClick={handleReset}
            type="button"
            variant="secondary"
          >
            <RotateCw aria-hidden="true" className="size-3.5" />
            <span>Reset</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              disabled={testMutation.isPending}
              onClick={handleClose}
              type="button"
              variant="secondary"
            >
              Close
            </Button>

            <Button
              disabled={testMutation.isPending || !endpoint.trim()}
              type="submit"
            >
              {testMutation.isPending ? (
                <>
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  <span>Testing Connection...</span>
                </>
              ) : (
                <>
                  <Activity aria-hidden="true" className="size-4" />
                  <span>Run Connection Test</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
