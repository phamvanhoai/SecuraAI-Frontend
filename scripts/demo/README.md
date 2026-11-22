# SecuraAI recorded demo runner

This runner presents the full report workflow in a headed browser, switches through fixed roles and contextual Employee actors, opens a visible PowerShell window for real Wazuh Windows-agent scenarios, waits for generated alerts, performs analyst triage, and keeps every chapter on screen long enough for recording.

It does not store credentials. Run the command and enter the Security Officer password at the hidden prompt:

```powershell
cd C:\Users\Admin\Documents\GITHUB\SecuraAI-Frontend
corepack pnpm demo:record
```

For unattended local runs, `SECURAAI_DEMO_PASSWORD` may instead be set only in the current PowerShell process. Never place it in a committed file or command transcript.

The default accounts are `admin@gmail.com`, `securityofficer@gmail.com`, `riskowner@gmail.com`, `controlowner@gmail.com`, `assetowner@gmail.com`, `authorizedapprover@gmail.com`, `employee@gmail.com` and `executive@gmail.com`. The common password is requested once. Override an account or password when needed with `SECURAAI_DEMO_<ACTOR>_EMAIL` and `SECURAAI_DEMO_<ACTOR>_PASSWORD`.

The runner opens Chrome in full-screen mode and displays a configurable 10-second SecuraAI countdown. The first time each role or contextual actor appears, the runner visibly signs in with that actor's account so the audience can identify who performs the workflow. Each actor receives a separate live browser context and retains its own cookies; switching back to an actor restores that context without logging out or signing in again. No browser state or password is written to the repository.

For rehearsal, use chapter checkpoints instead of restarting the complete workflow. Keep one explicit run ID when later chapters must reuse records created earlier:

```powershell
$env:SECURAAI_DEMO_RUN_ID = "DEMO-REHEARSAL-01"
$env:SECURAAI_DEMO_START_CHAPTER = "8"
$env:SECURAAI_DEMO_END_CHAPTER = "8"
corepack pnpm demo:record
```

Every final action inside a long dialog is scrolled into view, focused and held for 2.5 seconds before it is clicked. Alert-detail recording also expands and pauses on Stored explanation, Why this alert was created, Score history, Events in this alert, one event's technical identifiers, Technical details and Recorded detection metadata when available. Representative Asset, Risk, Control and Incident records open their complete detail view after creation. Override that recording pause with `SECURAAI_DEMO_ACTION_REVEAL_MS` only during rehearsal.

By default, Wazuh runs four positive scenarios: `AuthSuccessAfterFail`, `AppSuccessAfterDenial`, `VpnFailureBurst` and `SsoFailureBurst`.

```powershell
$env:SECURAAI_DEMO_BASE_URL = "http://localhost:3001"
$env:SECURAAI_DEMO_WAZUH_SCENARIOS = "AuthSuccessAfterFail,AppSuccessAfterDenial,VpnFailureBurst,SsoFailureBurst"
$env:SECURAAI_DEMO_SECTION_PAUSE_MS = "9000"
$env:SECURAAI_DEMO_TERMINAL_HOLD_SECONDS = "20"
$env:SECURAAI_DEMO_ALERT_TIMEOUT_MS = "300000"
corepack pnpm demo:record
```

Supported alert-oriented scenarios include `AuthBurst`, `AuthSuccessAfterFail`, `AuthAccountLockout`, `AppDenialBurst`, `AppSuccessAfterDenial`, `VpnFailureBurst`, `SsoFailureBurst`, and `SsoBaselineAndNewIp`. Set `SECURAAI_DEMO_CONFIRM_ALERT=false` for a read-only rehearsal that does not confirm an alert or create its incident draft.

## Before recording

1. Start Docker Desktop and the Wazuh single-node stack.
2. Start the SecuraAI database, backend, ML service and security-AI/LLM dependencies used by the current environment.
3. Start the frontend on port 3001.
4. Confirm the Windows Wazuh agent is active and the backend script `scripts/wazuh/agent-scenario-manager.ps1` can run.
5. Start full-desktop recording in OBS or another recorder. Playwright also saves a browser-only video under `test-results/demo-video`.

If the ML API at `http://127.0.0.1:8002/health` is offline, the runner starts the local `Train-Model` virtual environment and temporal artifact automatically, then stops only that runner-owned process when the demo ends. Override its location with `SECURAAI_DEMO_TRAIN_MODEL_ROOT` when the repository is stored elsewhere.

The PowerShell window remains visible for 15 seconds by default. At the end, the browser remains open until Enter is pressed in the runner terminal. This prevents the last screen from disappearing before the recording is complete.

The runner performs representative write operations instead of only opening pages. It creates and assigns an asset, risk and control; records Control evidence and an effectiveness assessment; identifies a Risk vulnerability and threat, links the Control, records inherent and residual assessments, and creates a treatment plan; opens their detail records; creates and submits a policy draft; completes the Administrator review, approval and publication flow; registers an inactive demonstration event source; reviews the active source and its connection-test form; inspects a normalized event and its entity-mapping correction workflow; reviews detection and explanation model details, the model threshold, asset overrides and one bounded manual detection batch; attempts Employee acknowledgement when the published policy applies to that Employee's department; creates and classifies a Security Officer incident; links the affected Asset, Control and Risk, records a Control weakness and requests reassessment; completes the Risk Owner review and incident-driven residual reassessment; assigns the incident handler; records containment, eradication and recovery actions; saves root cause and lessons learned; and closes the incident. It also generates Wazuh scenarios and confirms one new alert to demonstrate the alert-to-incident transition. Optional or state-dependent steps are reported as `SKIP` and the recording continues safely.

To execute the Wazuh Manager connection probe rather than only present its complete form, provide credentials in the current PowerShell process before recording. They are never stored in the repository:

```powershell
$env:SECURAAI_DEMO_WAZUH_API_URL = "https://host.docker.internal:55000"
$env:SECURAAI_DEMO_WAZUH_API_USERNAME = "<Wazuh API username>"
$env:SECURAAI_DEMO_WAZUH_API_PASSWORD = "<Wazuh API password>"
```

## Report chapters

1. Administrator: users, responsibilities, integrations and audit governance.
2. Security Officer: assets, risks, controls, policies and event sources.
3. Event and AI configuration: register/detail/test an event source, inspect/correct mapping, review models and configure model/asset thresholds.
4. Detection operations: run a bounded manual batch, then generate Authentication, App Access, VPN and SSO events through Wazuh for realtime detection.
5. Analyst workflow: explanation, triage, true-positive confirmation and incident draft.
6. Incident and risk workflow: Asset, Control and Risk links, Control Weakness and reassessment workspace.
7. Contextual Employee actors: Risk Owner, Control Owner, Asset Owner and Authorized Approver.
8. Employee: policy acknowledgement and incident reporting.
9. Executive: security posture dashboard and reports.
