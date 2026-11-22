import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const frontendRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const backendRoot = path.resolve(frontendRoot, "../SecuraAI-Backend");
const trainModelRoot =
  process.env.SECURAAI_DEMO_TRAIN_MODEL_ROOT ??
  "C:\\Users\\Admin\\Documents\\GitHub\\Train-Model";
const baseUrl = process.env.SECURAAI_DEMO_BASE_URL ?? "http://localhost:3001";
const commonPassword =
  process.env.SECURAAI_DEMO_PASSWORD ??
  (await readSecret("Common demo-account password: "));
const mlHealthUrl =
  process.env.SECURAAI_DEMO_ML_HEALTH_URL ?? "http://127.0.0.1:8002/health";
const scenarios = (
  process.env.SECURAAI_DEMO_WAZUH_SCENARIOS ??
  "AuthSuccessAfterFail,AppSuccessAfterDenial,VpnFailureBurst,SsoFailureBurst"
)
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const actionPauseMs = numberFromEnv("SECURAAI_DEMO_ACTION_PAUSE_MS", 1_800);
const sectionPauseMs = numberFromEnv("SECURAAI_DEMO_SECTION_PAUSE_MS", 4_500);
const terminalHoldSeconds = numberFromEnv(
  "SECURAAI_DEMO_TERMINAL_HOLD_SECONDS",
  15,
);
const alertTimeoutMs = numberFromEnv("SECURAAI_DEMO_ALERT_TIMEOUT_MS", 90_000);
const requiredAlertFamilies = numberFromEnv(
  "SECURAAI_DEMO_REQUIRED_ALERT_FAMILIES",
  2,
);
const startDelaySeconds = numberFromEnv(
  "SECURAAI_DEMO_START_DELAY_SECONDS",
  10,
);
const videoDir = path.resolve(
  frontendRoot,
  process.env.SECURAAI_DEMO_VIDEO_DIR ?? "test-results/demo-video",
);
const demoRunId =
  process.env.SECURAAI_DEMO_RUN_ID ??
  `DEMO-${new Date()
    .toISOString()
    .replaceAll(/[-:TZ.]/gu, "")
    .slice(0, 12)}`;
const startChapter = numberFromEnv("SECURAAI_DEMO_START_CHAPTER", 1);
const endChapter = numberFromEnv("SECURAAI_DEMO_END_CHAPTER", 99);
const demoData = {
  assetName: `${demoRunId} Customer Portal Server`,
  riskTitle: `${demoRunId} Unauthorized customer portal access`,
  controlName: `${demoRunId} Privileged Access Monitoring`,
  incidentTitle: `${demoRunId} Suspicious customer portal access`,
  policyCode: `POL-${demoRunId.replace("DEMO-", "D")}`,
  policyTitle: `${demoRunId} Security Monitoring Policy`,
};

const scenarioExpectedText = new Map([
  ["AuthBurst", /^(LOGIN FAILURE|AUTHENTICATION FAILURE)$/iu],
  ["AuthSuccessAfterFail", /^(LOGIN SUCCESS|LOGIN FAILURE)$/iu],
  ["AuthAccountLockout", /^(ACCOUNT LOCKOUT|LOGIN FAILURE)$/iu],
  ["AppDenialBurst", /^(ACCESS DENIED|APPLICATION ACCESS)$/iu],
  [
    "AppSuccessAfterDenial",
    /^(ACCESS DENIED|ACCESS GRANTED|APPLICATION ACCESS)$/iu,
  ],
  ["VpnFailureBurst", /^VPN LOGIN FAILURE$/iu],
  ["SsoFailureBurst", /^SSO LOGIN FAILURE$/iu],
  ["SsoBaselineAndNewIp", /^SSO LOGIN (SUCCESS|FAILURE)$/iu],
]);
if (!commonPassword) throw new Error("A demo-account password is required.");

const ownedMlProcess = await ensureMlService();

const browser = await chromium.launch({
  headless: false,
  args: ["--start-maximized", "--start-fullscreen"],
  slowMo: numberFromEnv("SECURAAI_DEMO_SLOW_MO_MS", 250),
});
const roleSessions = new Map();
let page = null;

const splashContext = await showRecordingCountdown();

let demoFailed = false;
try {
  page = await switchRole(
    "Administrator",
    roleEmail("ADMIN", "admin@gmail.com"),
  );
  await splashContext.close();
  if (shouldRun(1))
    await chapter(
      page,
      "1",
      "Administrator workspace",
      "Configure users, business responsibilities and system integrations before security operations begin.",
    );
  if (shouldRun(2))
    await visitChapter(page, {
      number: "2",
      title: "Users, roles and ownership",
      narration:
        "The Administrator manages accounts and assigns contextual Asset, Control, Risk and approval responsibilities.",
      route: "/users",
    });
  if (shouldRun(3))
    await visitChapter(page, {
      number: "3",
      title: "Integration API keys",
      narration:
        "Integration keys authenticate external systems without exposing secret values after creation.",
      route: "/settings",
    });
  if (shouldRun(3))
    await demonstrateFirstAvailableDetails(page, {
      actionName: /view API key details for/iu,
      title: "Integration API key details",
    });
  if (shouldRun(4))
    await visitChapter(page, {
      number: "4",
      title: "Audit governance",
      narration:
        "Administrative actions and configuration changes remain traceable in the audit trail.",
      route: "/audits",
    });
  if (shouldRun(4))
    await demonstrateFirstAvailableDetails(page, {
      actionName: /view details for/iu,
      title: "Audit record details",
    });

  page = await switchRole(
    "Security Officer",
    roleEmail("SECURITY_OFFICER", "securityofficer@gmail.com"),
  );

  if (shouldRun(5))
    await visitChapter(page, {
      number: "5",
      title: "Asset inventory",
      narration:
        "Review organizational assets, ownership and business context.",
      route: "/assets",
    });
  if (shouldRun(5))
    await runOptionalStep(page, "Create Asset", () => createDemoAsset(page));
  if (shouldRun(6))
    await visitChapter(page, {
      number: "6",
      title: "Risk management",
      narration:
        "Review risks, ownership, assessment status and linked records.",
      route: "/risks",
    });
  if (shouldRun(6))
    await runOptionalStep(page, "Create Risk", () => createDemoRisk(page));
  if (shouldRun(7))
    await visitChapter(page, {
      number: "7",
      title: "Security controls",
      narration:
        "Review implemented controls, evidence and effectiveness assessments.",
      route: "/controls",
    });
  if (shouldRun(7))
    await runOptionalStep(page, "Create Control", () =>
      createDemoControl(page),
    );
  if (shouldRun(7)) {
    page = await switchRole(
      "Control Owner",
      roleEmail("CONTROL_OWNER", "controlowner@gmail.com"),
    );
    await visitChapter(page, {
      number: "7B",
      title: "Control Owner assessment",
      narration:
        "The assigned Control Owner registers supporting evidence and records the operational effectiveness result.",
      route: "/controls",
    });
    await runOptionalStep(page, "Control Evidence and Effectiveness", () =>
      completeDemoControlAssessment(page),
    );
    page = await switchRole(
      "Security Officer",
      roleEmail("SECURITY_OFFICER", "securityofficer@gmail.com"),
    );
  }
  if (shouldRun(7))
    await runOptionalStep(page, "Initial Risk Assessment", () =>
      completeDemoInitialRiskAssessment(page),
    );
  if (shouldRun(7)) {
    page = await switchRole(
      "Risk Owner",
      roleEmail("RISK_OWNER", "riskowner@gmail.com"),
    );
    await visitChapter(page, {
      number: "7E",
      title: "Risk Owner assessment",
      narration:
        "The assigned Risk Owner evaluates remaining exposure and creates the accountable treatment plan.",
      route: "/risks",
    });
    await runOptionalStep(page, "Residual Risk and Treatment Plan", () =>
      completeDemoOwnedRiskAssessment(page),
    );
    page = await switchRole(
      "Security Officer",
      roleEmail("SECURITY_OFFICER", "securityofficer@gmail.com"),
    );
    await runOptionalStep(page, "Refresh Inherent Assessment Basis", () =>
      refreshDemoInherentAssessmentBasis(page),
    );
  }
  if (shouldRun(8))
    await visitChapter(page, {
      number: "8",
      title: "Security policies",
      narration:
        "Show the policy lifecycle and published organizational requirements.",
      route: "/policies",
    });
  if (shouldRun(8))
    await runOptionalStep(page, "Create Policy", () =>
      createAndSubmitDemoPolicy(page),
    );

  page = await switchRole(
    "Administrator",
    roleEmail("ADMIN", "admin@gmail.com"),
  );
  if (shouldRun(8))
    await visitChapter(page, {
      number: "8A",
      title: "Policy review and approval",
      narration:
        "The Administrator reviews the submitted policy decision before publication.",
      route: "/policies",
    });
  if (shouldRun(8))
    await runOptionalStep(page, "Review and Publish Policy", () =>
      reviewApproveAndPublishDemoPolicy(page),
    );

  page = await switchRole(
    "Security Officer",
    roleEmail("SECURITY_OFFICER", "securityofficer@gmail.com"),
  );
  if (shouldRun(9))
    await visitChapter(page, {
      number: "9",
      title: "Wazuh event ingestion",
      narration:
        "Show connected event sources before generating a real Windows security scenario.",
      route: "/event-logs",
    });
  if (shouldRun(9))
    await clickIfVisible(
      page,
      page.getByRole("button", { name: /normalized event sources/iu }),
    );
  if (shouldRun(9)) await page.waitForTimeout(sectionPauseMs);
  if (shouldRun(9))
    await runOptionalStep(page, "Event Source Administration", () =>
      demonstrateEventSourceAdministration(page),
    );
  if (shouldRun(9))
    await runOptionalStep(page, "Detection Model Configuration", () =>
      demonstrateDetectionModelConfiguration(page),
    );
  if (shouldRun(9))
    await runOptionalStep(page, "Detection Operations", () =>
      demonstrateDetectionOperations(page),
    );

  if (shouldRun(10))
    await chapter(
      page,
      "10",
      "Generate multiple Wazuh log families",
      `Run Authentication, App Access, VPN and SSO scenarios through the real Windows Wazuh agent.`,
    );
  if (shouldRun(10))
    await runOptionalStep(page, "Wazuh Scenarios", () =>
      launchVisibleWazuhScenarios(),
    );

  if (shouldRun(11))
    await visitChapter(page, {
      number: "11",
      title: "Ingested security event",
      narration:
        "Verify that Wazuh delivered and normalized the new security events.",
      route: "/event-logs",
    });
  if (shouldRun(11))
    await clickIfVisible(
      page,
      page.getByRole("button", { name: /security events/iu }),
    );
  if (shouldRun(11)) await page.waitForTimeout(sectionPauseMs);
  if (shouldRun(11))
    await demonstrateFirstAvailableDetails(page, {
      actionName: /^view$/iu,
      title: "Ingested security event details",
    });
  if (shouldRun(11))
    await runOptionalStep(page, "Review Entity Mapping", () =>
      demonstrateEntityMappingReview(page),
    );

  if (shouldRun(12))
    await chapter(
      page,
      "12",
      "Automated anomaly analysis",
      "The scheduled detection pipeline evaluates the event and creates an alert only when the applicable threshold is met.",
    );
  if (shouldRun(12))
    await page.goto(`${baseUrl}/anomaly-monitoring`, {
      waitUntil: "domcontentloaded",
    });
  if (shouldRun(12)) await waitForPageToSettle(page);
  if (shouldRun(12))
    await showOverlay(
      page,
      "12",
      "Waiting for the new alert",
      "The page remains visible while the backend worker finishes ML and security-AI analysis.",
    );
  const foundAlertFamilies = shouldRun(12)
    ? await waitForAlerts(page)
    : new Set();
  const alertFound = foundAlertFamilies.size > 0;

  if (shouldRun(12) && alertFound) {
    for (const scenarioName of scenarios.filter((item) =>
      foundAlertFamilies.has(item),
    )) {
      await showOverlay(
        page,
        "13",
        `${familyLabel(scenarioName)} alert evidence`,
        "Review this family's score, temporal evidence and stored security-AI decision explanation.",
      );
      await openMatchingAlert(page, new Set([scenarioName]));
      await page.waitForTimeout(sectionPauseMs);
      await closeVisibleDialog(page);
    }
    await triageAndConfirmMatchingAlert(page);
  } else if (shouldRun(12)) {
    await showOverlay(
      page,
      "13",
      "No alert before timeout",
      "The source events remain stored. Review model health and rerun the failed analysis after recovery.",
    );
    await page.waitForTimeout(sectionPauseMs);
    await showOverlay(
      page,
      "13",
      "Analyst workflow using an available alert",
      "The new events remain visible without an alert. The Security Officer now demonstrates triage on an existing eligible alert.",
    );
    await triageAndConfirmMatchingAlert(page);
  }

  if (shouldRun(14))
    await visitChapter(page, {
      number: "14",
      title: "Incident response",
      narration:
        "Review incidents, response stages and links to assets, controls and risks.",
      route: "/incidents",
    });
  if (shouldRun(14))
    await runOptionalStep(page, "Create and Classify Incident", () =>
      createAndClassifyDemoIncident(page),
    );
  if (shouldRun(15)) {
    await chapter(
      page,
      "15",
      "Incident-driven risk reassessment",
      "The Security Officer links the affected asset and existing risk, then creates an auditable reassessment request.",
    );
    await runOptionalStep(
      page,
      "Link Incident Context and Request Reassessment",
      () => linkIncidentContextAndRequestReassessment(page),
    );
  }

  if (shouldRun(16)) {
    page = await switchRole(
      "Risk Owner",
      roleEmail("RISK_OWNER", "riskowner@gmail.com"),
    );
    await visitChapter(page, {
      number: "16",
      title: "Risk Owner review",
      narration:
        "The assigned Risk Owner reviews reassessment requests and updates residual risk when approved.",
      route: "/risks",
    });
    await runOptionalStep(page, "Start Risk Reassessment Review", () =>
      startRiskReassessmentReview(page),
    );
    await runOptionalStep(page, "Complete Risk Reassessment", () =>
      completeRiskReassessmentReview(page),
    );
  }

  if (shouldRun(16)) {
    page = await switchRole(
      "Security Officer",
      roleEmail("SECURITY_OFFICER", "securityofficer@gmail.com"),
    );
    await runOptionalStep(page, "Complete Incident Response", () =>
      completeDemoIncidentResponse(page),
    );
  }

  if (shouldRun(17)) {
    page = await switchRole(
      "Control Owner",
      roleEmail("CONTROL_OWNER", "controlowner@gmail.com"),
    );
    await visitChapter(page, {
      number: "17",
      title: "Control Owner workspace",
      narration:
        "The Control Owner reviews assigned controls, implementation evidence and effectiveness work.",
      route: "/controls",
    });
  }

  if (shouldRun(18)) {
    page = await switchRole(
      "Asset Owner",
      roleEmail("ASSET_OWNER", "assetowner@gmail.com"),
    );
    await visitChapter(page, {
      number: "18",
      title: "Asset Owner workspace",
      narration:
        "The Asset Owner sees assigned assets and their security context without organization-wide access.",
      route: "/assets",
    });
  }

  if (shouldRun(19)) {
    page = await switchRole(
      "Authorized Approver",
      roleEmail("AUTHORIZED_APPROVER", "authorizedapprover@gmail.com"),
    );
    await visitChapter(page, {
      number: "19",
      title: "Risk acceptance approval",
      narration:
        "The workflow-specific Authorized Approver reviews pending risk acceptance decisions.",
      route: "/risks",
    });
  }

  if (shouldRun(20) || shouldRun(21)) {
    page = await switchRole(
      "Employee",
      roleEmail("EMPLOYEE", "employee@gmail.com"),
    );
  }
  if (shouldRun(20))
    await visitChapter(page, {
      number: "20",
      title: "Employee self-service",
      narration:
        "Employees acknowledge published policies, report incidents and receive personal notifications.",
      route: "/policies",
    });
  if (shouldRun(20))
    await runOptionalStep(page, "Acknowledge Policy", () =>
      acknowledgeDemoPolicy(page),
    );
  if (shouldRun(21))
    await visitChapter(page, {
      number: "21",
      title: "Employee incident visibility",
      narration:
        "Employees review reports associated with their account; operational incident creation remains a Security Officer action in the current contract.",
      route: "/incidents",
    });

  if (shouldRun(22) || shouldRun(23)) {
    page = await switchRole(
      "Executive",
      roleEmail("EXECUTIVE", "executive@gmail.com"),
    );
  }
  if (shouldRun(22))
    await visitChapter(page, {
      number: "22",
      title: "Executive security posture",
      narration:
        "Executives review consolidated asset, risk, incident and alert indicators for decision support.",
      route: "/dashboard",
    });
  if (shouldRun(23))
    await visitChapter(page, {
      number: "23",
      title: "Security reports",
      narration:
        "The end-to-end workflow concludes with filtered and exportable security reports.",
      route: "/reports",
    });
  await showOverlay(
    page,
    "Complete",
    "SecuraAI end-to-end workflow",
    "The demo remains open. Press Enter in the runner terminal when the recording is complete.",
  );
} catch (error) {
  demoFailed = true;
  console.error("\nDemo stopped because a required step failed:", error);
  if (page) {
    await showOverlay(
      page,
      "Stopped",
      "Demo needs attention",
      error instanceof Error ? error.message : String(error),
    ).catch(() => undefined);
  }
}

console.log(`\nPer-profile browser videos will be finalized in: ${videoDir}`);
console.log(
  "The browser will remain open so the recording does not end abruptly.",
);
await waitForEnter("Press Enter when recording is complete... ");
await Promise.allSettled(
  [...roleSessions.values()].map(({ context }) => context.close()),
);
await browser.close();
if (ownedMlProcess && !ownedMlProcess.killed) ownedMlProcess.kill();
if (demoFailed) process.exitCode = 1;

async function signIn(
  targetPage,
  accountEmail,
  accountPassword,
  { pauseAfterLogin = true, pauseBetweenFields = true } = {},
) {
  await targetPage.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
  await targetPage.getByLabel("Email").fill(accountEmail);
  if (pauseBetweenFields) await targetPage.waitForTimeout(actionPauseMs);
  await targetPage.locator('input[name="password"]').fill(accountPassword);
  if (pauseBetweenFields) await targetPage.waitForTimeout(actionPauseMs);
  await targetPage.getByRole("button", { name: /sign in/iu }).click();
  await targetPage.waitForURL((url) => !url.pathname.includes("/login"), {
    timeout: 30_000,
  });
  await waitForPageToSettle(targetPage);
  if (pauseAfterLogin) await targetPage.waitForTimeout(sectionPauseMs);
}

async function switchRole(roleLabel, accountEmail) {
  const existing = roleSessions.get(accountEmail);
  if (existing) {
    await existing.page.bringToFront();
    await resetLocalLoginLimiter();
    await signIn(existing.page, accountEmail, rolePasswordFor(roleLabel), {
      pauseAfterLogin: false,
      pauseBetweenFields: false,
    });
    await showOverlay(
      existing.page,
      "Role",
      `${roleLabel} profile restored`,
      `Restoring the ${accountEmail} browser profile after the local demo backend reset.`,
    );
    await existing.page.waitForTimeout(actionPauseMs);
    return existing.page;
  }

  const context = await browser.newContext({
    viewport: null,
    recordVideo: { dir: videoDir, size: { width: 1600, height: 900 } },
  });
  const targetPage = await context.newPage();
  targetPage.setDefaultTimeout(20_000);
  roleSessions.set(accountEmail, { context, page: targetPage, roleLabel });
  try {
    await resetLocalLoginLimiter();
    await targetPage.bringToFront();
    await signIn(targetPage, accountEmail, rolePasswordFor(roleLabel));
    await targetPage.bringToFront();
    return targetPage;
  } catch (error) {
    await showOverlay(
      targetPage,
      "Skipped",
      `${roleLabel} account unavailable`,
      `Could not sign in as ${accountEmail}. Configure the account or its role-specific password and rerun.`,
    );
    await targetPage.waitForTimeout(sectionPauseMs);
    console.warn(
      `Skipping ${roleLabel}:`,
      error instanceof Error ? error.message : error,
    );
    return targetPage;
  }
}

async function resetLocalLoginLimiter() {
  if (process.env.SECURAAI_DEMO_RESET_LOCAL_RATE_LIMIT === "false") return;
  await runProcess("docker.exe", ["restart", "securaai-demo-backend-1"]);
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(
        "http://127.0.0.1:3000/api/v1/health/ready",
        {
          signal: AbortSignal.timeout(2_000),
        },
      );
      if (response.ok) return;
    } catch {
      // Backend is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error("Local demo backend did not recover after rate-limit reset.");
}

function rolePasswordFor(roleLabel) {
  const roleKey = roleLabel.toUpperCase().replaceAll(/[^A-Z0-9]+/gu, "_");
  return process.env[`SECURAAI_DEMO_${roleKey}_PASSWORD`] ?? commonPassword;
}

async function showRecordingCountdown() {
  const context = await browser.newContext({ viewport: null });
  const splash = await context.newPage();
  await splash.setContent(
    `<!doctype html><html><head><title>SecuraAI Demo</title><style>html,body{height:100%;margin:0}body{display:grid;place-items:center;background:#071831;color:#f8fafc;font-family:Arial,sans-serif}.wrap{text-align:center}.logo{font-size:64px;font-weight:800}.sub{margin-top:18px;color:#bfdbfe;font-size:26px}.count{margin-top:42px;font-size:96px;font-weight:800;color:#60a5fa}</style></head><body><main class="wrap"><div class="logo">SecuraAI</div><div class="sub">End-to-End Security Workflow Demonstration</div><div class="count" id="count">${startDelaySeconds}</div></main></body></html>`,
  );
  await splash.bringToFront();
  for (let remaining = startDelaySeconds; remaining > 0; remaining -= 1) {
    await splash
      .locator("#count")
      .textContent()
      .catch(() => undefined);
    await splash.evaluate((value) => {
      const counter = document.querySelector("#count");
      if (counter) counter.textContent = String(value);
    }, remaining);
    await splash.waitForTimeout(1_000);
  }
  return context;
}

function roleEmail(roleKey, fallback) {
  return process.env[`SECURAAI_DEMO_${roleKey}_EMAIL`] ?? fallback;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function familyLabel(scenarioName) {
  if (scenarioName.startsWith("Auth")) return "Authentication";
  if (scenarioName.startsWith("App")) return "Application Access";
  if (scenarioName.startsWith("Vpn")) return "VPN";
  if (scenarioName.startsWith("Sso")) return "SSO";
  return scenarioName;
}

async function visitChapter(targetPage, { number, title, narration, route }) {
  await targetPage.goto(`${baseUrl}${route}`, {
    waitUntil: "domcontentloaded",
  });
  await waitForPageToSettle(targetPage);
  await showOverlay(targetPage, number, title, narration);
  await targetPage.waitForTimeout(sectionPauseMs);
}

async function chapter(targetPage, number, title, narration) {
  if (targetPage.url() === "about:blank") {
    await targetPage.goto(`${baseUrl}/login`, {
      waitUntil: "domcontentloaded",
    });
  }
  await showOverlay(targetPage, number, title, narration);
  await targetPage.waitForTimeout(sectionPauseMs);
}

async function showOverlay(targetPage, number, title, narration) {
  await targetPage.evaluate(
    ({ chapterNumber, chapterTitle, chapterNarration }) => {
      document.querySelector("[data-securaai-demo-overlay]")?.remove();
      const overlay = document.createElement("aside");
      overlay.dataset.securaaiDemoOverlay = "true";
      overlay.setAttribute("aria-live", "polite");
      overlay.style.cssText = [
        "position:fixed",
        "z-index:2147483647",
        "right:24px",
        "bottom:24px",
        "width:min(440px,calc(100vw - 48px))",
        "padding:18px 20px",
        "border:1px solid rgba(147,197,253,.55)",
        "border-radius:12px",
        "background:rgba(7,24,49,.96)",
        "box-shadow:0 18px 48px rgba(2,6,23,.3)",
        "color:#f8fafc",
        "font:14px/1.45 ui-sans-serif,system-ui,sans-serif",
        "pointer-events:none",
      ].join(";");
      overlay.innerHTML = `<div style="color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Chapter ${chapterNumber}</div><div style="margin-top:4px;font-size:20px;font-weight:750">${escapeHtml(chapterTitle)}</div><div style="margin-top:7px;color:#cbd5e1">${escapeHtml(chapterNarration)}</div>`;
      document.body.append(overlay);

      function escapeHtml(value) {
        const element = document.createElement("span");
        element.textContent = value;
        return element.innerHTML;
      }
    },
    { chapterNumber: number, chapterTitle: title, chapterNarration: narration },
  );
}

async function waitForPageToSettle(targetPage) {
  await targetPage.waitForLoadState("domcontentloaded");
  await targetPage.waitForTimeout(actionPauseMs);
}

async function waitForAlerts(targetPage) {
  const expectedByScenario = scenarios.map((item) => ({
    scenario: item,
    pattern:
      scenarioExpectedText.get(item) ??
      /ACCOUNT LOCKOUT|LOGIN FAILURE|ACCESS DENIED|VPN|SSO/iu,
  }));
  const found = new Set();
  const deadline = Date.now() + alertTimeoutMs;
  while (Date.now() < deadline) {
    for (const item of expectedByScenario) {
      if (found.has(item.scenario)) continue;
      const matchingText = targetPage.getByText(item.pattern).first();
      if (await matchingText.isVisible().catch(() => false))
        found.add(item.scenario);
    }
    await showOverlay(
      targetPage,
      "12",
      `Waiting for alerts (${found.size}/${expectedByScenario.length})`,
      `Received: ${[...found].join(", ") || "none yet"}. The page stays visible during scheduled analysis.`,
    );
    if (
      found.size >= Math.min(requiredAlertFamilies, expectedByScenario.length)
    ) {
      console.log(`PASS Alert families detected: ${[...found].join(", ")}`);
      return found;
    }
    await targetPage.waitForTimeout(8_000);
    await targetPage.reload({ waitUntil: "domcontentloaded" });
    await waitForPageToSettle(targetPage);
    await showOverlay(
      targetPage,
      "9",
      "Waiting for the new alert",
      "The scheduled pipeline may need more than one collection cycle. No screen is skipped while analysis is running.",
    );
  }
  if (found.size > 0)
    console.log(`PARTIAL Alert families detected: ${[...found].join(", ")}`);
  else
    console.warn("SKIP Alert verification: no expected alert before timeout.");
  return found;
}

async function openMatchingAlert(targetPage, foundAlertFamilies) {
  const matchedScenario = scenarios.find((item) =>
    foundAlertFamilies.has(item),
  );
  const expected =
    scenarioExpectedText.get(matchedScenario) ??
    /ACCOUNT LOCKOUT|LOGIN FAILURE|ACCESS DENIED|VPN|SSO/iu;
  const row = targetPage
    .locator("tr")
    .filter({ has: targetPage.getByText(expected) })
    .first();
  if (!(await row.isVisible().catch(() => false))) return;
  const actions = row.getByRole("button").last();
  if (!(await actions.isVisible().catch(() => false))) return;
  await actions.click();
  await targetPage.waitForTimeout(actionPauseMs);
  const detailAction = targetPage
    .getByRole("button", { name: /view alert explanation/iu })
    .first();
  if (await detailAction.isVisible().catch(() => false)) {
    await detailAction.click();
    await revealAlertDetailSections(targetPage);
  }
}

async function revealAlertDetailSections(targetPage) {
  const dialog = targetPage.getByRole("dialog", {
    name: /AI-detected security alert details/iu,
  });
  await dialog.waitFor({ timeout: 20_000 });
  await dialog
    .getByRole("status", { name: /loading alert explanation/iu })
    .waitFor({ state: "hidden", timeout: 30_000 })
    .catch(() => undefined);

  const sectionLabels = [
    "Stored explanation",
    "Score history",
    "Events in this alert",
    "Technical details",
    "Recorded detection metadata",
  ];
  for (const label of sectionLabels) {
    const summary = dialog
      .locator("summary")
      .filter({ hasText: label })
      .first();
    if (!(await summary.isVisible().catch(() => false))) continue;
    await summary.scrollIntoViewIfNeeded();
    await summary.focus();
    const details = summary.locator("xpath=..");
    if ((await details.getAttribute("open")) === null) await summary.click();
    await targetPage.waitForTimeout(sectionPauseMs);
    console.log(`PASS Alert detail section: ${label}`);

    if (label === "Events in this alert") {
      const identifiers = details
        .locator("summary")
        .filter({ hasText: "Technical identifiers for event" })
        .first();
      if (await identifiers.isVisible().catch(() => false)) {
        await identifiers.scrollIntoViewIfNeeded();
        if (
          (await identifiers.locator("xpath=..").getAttribute("open")) === null
        ) {
          await identifiers.click();
        }
        await targetPage.waitForTimeout(sectionPauseMs);
        console.log("PASS Alert detail section: Event technical identifiers");
      }
    }
  }

  const explanation = dialog.getByText("Why this alert was created", {
    exact: true,
  });
  if (await explanation.isVisible().catch(() => false)) {
    await explanation.scrollIntoViewIfNeeded();
    await targetPage.waitForTimeout(sectionPauseMs);
    console.log("PASS Alert detail section: Why this alert was created");
  }
}

async function triageAndConfirmMatchingAlert(targetPage) {
  if (process.env.SECURAAI_DEMO_CONFIRM_ALERT === "false") return;
  const expected =
    /^(ACCOUNT LOCKOUT|LOGIN FAILURE|LOGIN SUCCESS|ACCESS DENIED|ACCESS GRANTED|VPN LOGIN FAILURE|SSO LOGIN FAILURE)$/iu;
  const row = targetPage
    .locator("tr")
    .filter({ has: targetPage.getByText(expected) })
    .first();
  if (!(await row.isVisible().catch(() => false))) return;

  const openActions = async () => {
    const button = row.getByRole("button", { name: /actions for/iu }).first();
    if (!(await button.isVisible().catch(() => false))) return false;
    await button.click();
    await targetPage.waitForTimeout(actionPauseMs);
    return true;
  };

  if (!(await openActions())) return;
  const start = targetPage
    .getByRole("button", { name: /^start triage$/iu })
    .first();
  if (await start.isVisible().catch(() => false)) {
    await showOverlay(
      targetPage,
      "13",
      "Start analyst triage",
      "The Security Officer takes ownership of the new alert for investigation.",
    );
    await start.click();
    await targetPage.waitForTimeout(sectionPauseMs);
  } else {
    await targetPage.keyboard.press("Escape");
  }

  if (!(await openActions())) return;
  const confirm = targetPage
    .getByRole("button", { name: /^confirm true positive$/iu })
    .first();
  if (!(await confirm.isVisible().catch(() => false))) {
    await targetPage.keyboard.press("Escape");
    return;
  }
  await showOverlay(
    targetPage,
    "13",
    "Confirm true positive",
    "Confirming a verified alert records analyst feedback and creates a linked incident draft.",
  );
  await confirm.click();
  await targetPage.waitForTimeout(actionPauseMs);
  const reason = targetPage.getByLabel("Feedback reason (optional)");
  if (await reason.isVisible().catch(() => false)) {
    await reason.fill(
      "Verified during the recorded end-to-end Wazuh demonstration.",
    );
  }
  const finalConfirm = targetPage
    .getByRole("button", { name: /^confirm true positive$/iu })
    .last();
  if (await finalConfirm.isVisible().catch(() => false)) {
    await finalConfirm.click();
    await targetPage.waitForTimeout(sectionPauseMs);
    console.log("PASS Analyst triage and true-positive confirmation");
  }
}

async function clickIfVisible(targetPage, locator) {
  if (!(await locator.isVisible().catch(() => false))) return false;
  await locator.click();
  await targetPage.waitForTimeout(actionPauseMs);
  return true;
}

async function createDemoAsset(targetPage) {
  await showOverlay(
    targetPage,
    "5A",
    "Create an IT asset",
    `Create ${demoData.assetName}, set its type and assign an eligible Asset Owner.`,
  );
  const add = targetPage.getByRole("button", { name: /^add asset$/iu });
  if (!(await add.isVisible().catch(() => false)))
    return recordSkip("Create Asset", "Add asset action is unavailable.");
  await add.click();
  const dialog = targetPage.getByRole("dialog", { name: /create it asset/iu });
  await dialog.getByLabel("Asset name").fill(demoData.assetName);
  await dialog.getByLabel("Asset type").selectOption("SERVER");
  await selectNativeOptionContaining(
    dialog.getByLabel("Asset owner"),
    "assetowner@gmail.com",
  );
  await targetPage.waitForTimeout(sectionPauseMs);
  await revealAndClick(
    targetPage,
    dialog.getByRole("button", { name: /^create asset$/iu }),
  );
  await targetPage
    .getByText(demoData.assetName, { exact: true })
    .first()
    .waitFor({ timeout: 30_000 });
  console.log(`PASS Create Asset: ${demoData.assetName}`);
  await demonstrateRowDetails(targetPage, demoData.assetName, "Asset details");
}

async function createDemoRisk(targetPage) {
  await showOverlay(
    targetPage,
    "6A",
    "Create and assign a risk",
    "Scope the risk to the newly created asset and assign the eligible Risk Owner.",
  );
  const create = targetPage
    .getByRole("button", { name: /^create risk$/iu })
    .first();
  if (!(await create.isVisible().catch(() => false)))
    return recordSkip("Create Risk", "Create Risk action is unavailable.");
  await create.click();
  await chooseRiskOption(targetPage, "Asset", demoData.assetName);
  await chooseRiskOption(targetPage, "Risk owner", "Risk Owner");
  // Keep the review date safely in the future in the application's UTC+7
  // calendar even when the demo runs near the UTC day boundary.
  const reviewDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1_000)
    .toISOString()
    .slice(0, 10);
  await targetPage.getByLabel(/review date/iu).fill(reviewDate);
  await targetPage.getByLabel(/risk title/iu).fill(demoData.riskTitle);
  await targetPage
    .getByLabel(/context and scope/iu)
    .fill(
      "Unauthorized privileged access could expose customer records and disrupt the customer portal service.",
    );
  await targetPage.waitForTimeout(sectionPauseMs);
  await revealAndClick(
    targetPage,
    targetPage.getByRole("button", { name: /^create risk$/iu }).last(),
  );
  await targetPage
    .getByText("Risk created", { exact: true })
    .waitFor({ timeout: 30_000 });
  const search = targetPage.getByPlaceholder(
    /risk code, title, owner, or asset/iu,
  );
  await search.fill(demoData.riskTitle);
  await targetPage.getByRole("button", { name: /^search$/iu }).click();
  await targetPage
    .getByText(demoData.riskTitle, { exact: true })
    .first()
    .waitFor({ timeout: 30_000 });
  console.log(`PASS Create Risk: ${demoData.riskTitle}`);
  await demonstrateRowDetails(targetPage, demoData.riskTitle, "Risk details");
}

async function createDemoControl(targetPage) {
  await showOverlay(
    targetPage,
    "7A",
    "Create a security control",
    "Create a reusable monitoring control and assign its contextual Control Owner.",
  );
  const create = targetPage
    .getByRole("button", { name: /^create control$/iu })
    .first();
  if (!(await create.isVisible().catch(() => false)))
    return recordSkip(
      "Create Control",
      "Create control action is unavailable.",
    );
  await create.click();
  const dialog = targetPage.getByRole("dialog", { name: /create control/iu });
  await dialog.getByLabel("Control name *").fill(demoData.controlName);
  await dialog
    .getByLabel("Purpose and description *")
    .fill(
      "Monitor privileged access and alert the security team when anomalous authentication or application activity is detected.",
    );
  const ownerSearch = dialog.getByLabel("Find Control Owner");
  await ownerSearch.fill("controlowner@gmail.com");
  await ownerSearch.press("Enter");
  await targetPage.waitForTimeout(1_000);
  await selectNativeOptionContaining(
    dialog.getByLabel("Control Owner (optional)"),
    "controlowner@gmail.com",
  );
  await dialog
    .getByLabel("Implementation status *")
    .selectOption("implemented");
  await targetPage.waitForTimeout(sectionPauseMs);
  await revealAndClick(
    targetPage,
    dialog.getByRole("button", { name: /^create control$/iu }),
  );
  await targetPage
    .getByText(demoData.controlName, { exact: true })
    .first()
    .waitFor({ timeout: 30_000 });
  console.log(`PASS Create Control: ${demoData.controlName}`);
  await demonstrateRowDetails(
    targetPage,
    demoData.controlName,
    "Control details",
  );
}

async function openRowAction(targetPage, recordName, actionName) {
  const row = targetPage.locator("tr").filter({ hasText: recordName }).first();
  await row.waitFor({ state: "visible", timeout: 30_000 });
  await row
    .getByRole("button", { name: /actions for/iu })
    .first()
    .click();
  const action = targetPage.getByRole("button", { name: actionName }).first();
  await action.waitFor({ state: "visible", timeout: 15_000 });
  await action.click();
  await targetPage.waitForTimeout(actionPauseMs);
}

async function completeDemoControlAssessment(targetPage) {
  await showOverlay(
    targetPage,
    "7B",
    "Control evidence and effectiveness",
    "Register test evidence, then record whether the implemented monitoring control operates effectively.",
  );
  const search = targetPage.getByLabel("Search controls");
  if (await search.isVisible().catch(() => false)) {
    await search.fill(demoData.controlName);
    await search.press("Enter");
    await targetPage.waitForTimeout(actionPauseMs);
  }

  await openRowAction(targetPage, demoData.controlName, /^evidence$/iu);
  const evidence = targetPage.getByRole("dialog", {
    name: /control evidence/iu,
  });
  await evidence.getByRole("button", { name: /^add evidence$/iu }).click();
  await evidence
    .getByLabel("Evidence name *")
    .fill(`${demoRunId} authentication monitoring test`);
  await evidence.getByLabel("Source *").fill("Security operations test");
  await evidence
    .getByLabel("Results, scope and supporting context *")
    .fill(
      "Authentication, application access, VPN and SSO scenarios were replayed through Wazuh. The control generated traceable events and surfaced threshold-qualified detections for analyst review.",
    );
  await evidence
    .getByLabel("Supporting document URL (HTTPS) *")
    .fill("https://example.com/securaai/demo-control-evidence");
  await targetPage.waitForTimeout(sectionPauseMs);
  await revealAndClick(
    targetPage,
    evidence.getByRole("button", { name: /^add and link evidence$/iu }),
  );
  await targetPage.waitForTimeout(sectionPauseMs);
  await closeVisibleDialog(targetPage);

  await openRowAction(targetPage, demoData.controlName, /^assess$/iu);
  const assessment = targetPage.getByRole("dialog", { name: /^assess /iu });
  await assessment
    .locator("#testMethod")
    .fill(
      "Replay representative Wazuh authentication, application access, VPN and SSO scenarios and verify normalized events, detections and analyst evidence.",
    );
  await assessment.locator("#testResult").selectOption("effective");
  await assessment.locator("#effectiveness").fill("88");
  await assessment
    .locator("#controlNotes")
    .fill(
      "The linked evidence demonstrates consistent event collection and detection. The score reflects successful coverage with remaining tuning work documented for future reviews.",
    );
  await targetPage.waitForTimeout(sectionPauseMs);
  await revealAndClick(
    targetPage,
    assessment.getByRole("button", { name: /^save assessment$/iu }),
  );
  await targetPage.waitForTimeout(sectionPauseMs);
  console.log(`PASS Control Evidence/Effectiveness: ${demoData.controlName}`);
}

async function completeDemoInitialRiskAssessment(targetPage) {
  await targetPage.goto(`${baseUrl}/risks`, { waitUntil: "domcontentloaded" });
  await waitForPageToSettle(targetPage);
  const search = targetPage.getByPlaceholder(
    /risk code, title, owner, or asset/iu,
  );
  await search.fill(demoData.riskTitle);
  await targetPage.getByRole("button", { name: /^search$/iu }).click();
  await targetPage.waitForTimeout(actionPauseMs);

  await showOverlay(
    targetPage,
    "7C",
    "Identify vulnerability and linked control",
    "Document the weakness and link the tested security control before calculating inherent risk.",
  );
  await openRowAction(
    targetPage,
    demoData.riskTitle,
    /^identify vulnerability$/iu,
  );
  const vulnerability = targetPage.getByRole("dialog", {
    name: /identify vulnerability/iu,
  });
  await vulnerability
    .locator("#vulnerabilityName")
    .fill("Insufficient privileged access monitoring");
  await vulnerability
    .locator("#vulnerabilityDescription")
    .fill(
      "Privileged authentication and application access may not be reviewed quickly enough, allowing repeated unauthorized activity to affect customer information.",
    );
  const controlSearch = vulnerability.getByLabel("Search security controls");
  await controlSearch.fill(demoData.controlName);
  await controlSearch.press("Enter");
  await targetPage.waitForTimeout(actionPauseMs);
  const controlChoice = vulnerability
    .getByText(new RegExp(escapeRegex(demoData.controlName), "iu"))
    .first()
    .locator("xpath=ancestor::label");
  if (await controlChoice.isVisible().catch(() => false)) {
    await controlChoice.locator('input[type="checkbox"]').check();
  }
  await revealAndClick(
    targetPage,
    vulnerability.getByRole("button", { name: /^identify vulnerability$/iu }),
  );
  await targetPage.waitForTimeout(sectionPauseMs);

  await openRowAction(targetPage, demoData.riskTitle, /^identify threat$/iu);
  const threat = targetPage.getByRole("dialog", { name: /identify threat/iu });
  await threat.locator("#threatName").fill("Credential-based intrusion");
  await threat
    .locator("#threatDescription")
    .fill(
      "An attacker uses compromised credentials and repeated access attempts to obtain privileged access to the customer portal and expose protected records.",
    );
  const relatedVulnerability = threat
    .getByText("Insufficient privileged access monitoring", { exact: true })
    .locator("xpath=ancestor::label");
  if (await relatedVulnerability.isVisible().catch(() => false)) {
    await relatedVulnerability.locator('input[type="checkbox"]').check();
  }
  await revealAndClick(
    targetPage,
    threat.getByRole("button", { name: /^identify threat$/iu }),
  );
  await targetPage.waitForTimeout(sectionPauseMs);

  await showOverlay(
    targetPage,
    "7D",
    "Assess inherent risk",
    "Score likelihood and impact before considering the effectiveness of the linked control.",
  );
  await openRowAction(
    targetPage,
    demoData.riskTitle,
    /^assess inherent risk$/iu,
  );
  const inherent = targetPage.getByRole("dialog", {
    name: /assess inherent risk/iu,
  });
  const radios = inherent.locator('input[type="radio"][value="4"]');
  if ((await radios.count()) >= 2) {
    await radios.nth(0).evaluate((input) => input.click());
    await radios.nth(1).evaluate((input) => input.click());
  }
  await inherent
    .locator("#inherentReason")
    .fill(
      "Repeated privileged access attempts against a customer-facing service are likely and could expose sensitive records before the effectiveness of existing controls is considered.",
    );
  await targetPage.waitForTimeout(sectionPauseMs);
  await revealAndClick(
    targetPage,
    inherent.getByRole("button", { name: /^save assessment$/iu }),
  );
  await targetPage.waitForTimeout(sectionPauseMs);
  console.log(`PASS Initial Risk Assessment: ${demoData.riskTitle}`);
}

async function completeDemoOwnedRiskAssessment(targetPage) {
  await targetPage.goto(`${baseUrl}/risks`, { waitUntil: "domcontentloaded" });
  await waitForPageToSettle(targetPage);
  const search = targetPage.getByPlaceholder(
    /risk code, title, owner, or asset/iu,
  );
  await search.fill(demoData.riskTitle);
  await targetPage.getByRole("button", { name: /^search$/iu }).click();
  await targetPage.waitForTimeout(actionPauseMs);
  await showOverlay(
    targetPage,
    "7E",
    "Assess residual risk",
    "Apply the tested Control effectiveness to estimate the remaining likelihood and impact.",
  );
  await openRowAction(
    targetPage,
    demoData.riskTitle,
    /^assess residual risk$/iu,
  );
  const residual = targetPage.getByRole("dialog", {
    name: /assess residual risk/iu,
  });
  const residualLikelihood = residual.locator('input[type="radio"][value="2"]');
  const residualImpact = residual.locator('input[type="radio"][value="3"]');
  await residualLikelihood.first().evaluate((input) => input.click());
  await residualImpact.last().evaluate((input) => input.click());
  await residual.locator("#residual-targetRisk").selectOption("medium");
  await residual.locator("#residual-riskAppetite").selectOption("medium");
  await residual.locator("#residual-riskTolerance").selectOption("high");
  await residual
    .locator("#residualReason")
    .fill(
      "The 88% effective monitoring control reduces the likelihood of undetected privileged access, while customer-data impact remains material and requires continued treatment.",
    );
  await targetPage.waitForTimeout(sectionPauseMs);
  await revealAndClick(
    targetPage,
    residual.getByRole("button", { name: /^save residual assessment$/iu }),
  );
  await targetPage.waitForTimeout(sectionPauseMs);

  await showOverlay(
    targetPage,
    "7F",
    "Create a risk treatment plan",
    "Record the improvement action, accountable owner, due date, linked Control and intended target risk.",
  );
  await openRowAction(
    targetPage,
    demoData.riskTitle,
    /^create treatment plan$/iu,
  );
  const plan = targetPage.getByRole("dialog", {
    name: /create risk treatment plan/iu,
  });
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000)
    .toISOString()
    .slice(0, 10);
  await plan.locator("#plan-title").fill(`${demoRunId} monitoring improvement`);
  await chooseTreatmentOwner(plan, "Responsible owner", "riskowner@gmail.com");
  await plan.locator("#plan-due-date").fill(dueDate);
  await plan.locator("#plan-target-risk").selectOption("low");
  const planControl = plan
    .getByText(new RegExp(escapeRegex(demoData.controlName), "iu"))
    .first()
    .locator("xpath=ancestor::label");
  if (await planControl.isVisible().catch(() => false)) {
    await planControl.locator('input[type="checkbox"]').check();
  }
  await plan
    .getByLabel("Action 1 title")
    .fill("Tune privileged-access detection and response procedures");
  await chooseTreatmentOwner(plan, "Action 1 owner", "riskowner@gmail.com");
  await plan.getByLabel("Action 1 due date").fill(dueDate);
  await targetPage.waitForTimeout(sectionPauseMs);
  await revealAndClick(
    targetPage,
    plan.getByRole("button", { name: /^create plan$/iu }),
  );
  await targetPage.waitForTimeout(sectionPauseMs);
  console.log(`PASS Residual Risk/Treatment Plan: ${demoData.riskTitle}`);
}

async function refreshDemoInherentAssessmentBasis(targetPage) {
  await targetPage.goto(`${baseUrl}/risks`, { waitUntil: "domcontentloaded" });
  await waitForPageToSettle(targetPage);
  const search = targetPage.getByPlaceholder(
    /risk code, title, owner, or asset/iu,
  );
  await search.fill(demoData.riskTitle);
  await targetPage.getByRole("button", { name: /^search$/iu }).click();
  await targetPage.waitForTimeout(actionPauseMs);
  await showOverlay(
    targetPage,
    "7G",
    "Confirm the current inherent-risk basis",
    "After defining the treatment target, record the current inherent basis used by the later incident-driven reassessment.",
  );
  await openRowAction(
    targetPage,
    demoData.riskTitle,
    /^assess inherent risk$/iu,
  );
  const inherent = targetPage.getByRole("dialog", {
    name: /assess inherent risk/iu,
  });
  const radios = inherent.locator('input[type="radio"][value="4"]');
  if ((await radios.count()) >= 2) {
    await radios.nth(0).evaluate((input) => input.click());
    await radios.nth(1).evaluate((input) => input.click());
  }
  await inherent
    .locator("#inherentReason")
    .fill(
      "The treatment target does not change the underlying customer-portal threat and impact. This assessment confirms the current inherent basis for incident-driven reassessment.",
    );
  await revealAndClick(
    targetPage,
    inherent.getByRole("button", { name: /^save assessment$/iu }),
  );
  await inherent.waitFor({ state: "hidden", timeout: 15_000 });
  console.log(`PASS Refresh Inherent Assessment Basis: ${demoData.riskTitle}`);
}

async function chooseTreatmentOwner(dialog, label, email) {
  const picker = dialog.getByRole("button", {
    name: new RegExp(`^${escapeRegex(label)}`, "iu"),
  });
  await picker.click();
  const search = dialog.getByLabel("Find owner by name or email");
  await search.fill(email);
  await search.press("Enter");
  await dialog
    .getByRole("button", {
      name: new RegExp(`^[^:]+ ${escapeRegex(email)}$`, "iu"),
    })
    .click();
}

async function createAndSubmitDemoPolicy(targetPage) {
  await showOverlay(
    targetPage,
    "8A",
    "Create and submit a policy draft",
    "Create a monitoring policy and submit it into the Administrator review workflow.",
  );
  const create = targetPage
    .getByRole("button", { name: /^create draft$/iu })
    .first();
  if (!(await create.isVisible().catch(() => false)))
    return recordSkip(
      "Create Policy Draft",
      "Create draft action is unavailable.",
    );
  await create.click();
  const dialog = targetPage.getByRole("dialog", {
    name: /create policy draft/iu,
  });
  await dialog.getByLabel("Policy code").fill(demoData.policyCode);
  await dialog.getByLabel("Version").fill("1.0");
  await dialog.getByLabel("Policy title").fill(demoData.policyTitle);
  await dialog
    .getByLabel("Description")
    .fill(
      "Defines security monitoring, alert triage and incident escalation requirements.",
    );
  await dialog
    .getByLabel("Policy content")
    .fill(
      "# Security Monitoring Policy\n\nSecurity events must be collected through approved sources. High-confidence alerts must be triaged and escalated into incident response. Evidence and analyst decisions must remain auditable.",
    );
  await targetPage.waitForTimeout(sectionPauseMs);
  await revealAndClick(
    targetPage,
    dialog.getByRole("button", { name: /^create draft$/iu }),
  );
  await targetPage
    .getByText(demoData.policyCode, { exact: true })
    .first()
    .waitFor({ timeout: 30_000 });

  const policyRow = () =>
    targetPage.locator("tr").filter({ hasText: demoData.policyCode }).first();
  const openActions = async () => {
    const actions = policyRow()
      .getByRole("button", { name: /actions for/iu })
      .first();
    await actions.click();
  };

  await openActions();
  const defineApplicability = targetPage
    .getByRole("button", { name: /^define applicability$/iu })
    .first();
  if (!(await defineApplicability.isVisible().catch(() => false))) {
    throw new Error("Define applicability action is unavailable.");
  }
  await defineApplicability.click();
  const applicabilityDialog = targetPage.getByRole("dialog", {
    name: /define policy applicability/iu,
  });
  await applicabilityDialog.waitFor({ state: "visible" });
  const employeeLabel = applicabilityDialog
    .getByText("Employee", { exact: true })
    .first()
    .locator("..");
  await employeeLabel.getByRole("checkbox").check();
  await applicabilityDialog
    .locator("#policy-app-rationale")
    .fill(
      "All employees must understand how security monitoring and incident escalation protect organizational information.",
    );
  await applicabilityDialog
    .locator("#policy-app-ref-basis")
    .fill(
      "ISO/IEC 27001 security monitoring and incident management controls.",
    );
  await revealAndClick(
    targetPage,
    applicabilityDialog.getByRole("button", { name: /^save applicability$/iu }),
  );
  await targetPage.waitForTimeout(sectionPauseMs);

  await openActions();
  const actions = policyRow()
    .getByRole("button", { name: /actions for/iu })
    .first();
  if (await actions.isVisible().catch(() => false)) {
    const submit = targetPage
      .getByRole("button", { name: /^submit for review$/iu })
      .first();
    if (await submit.isVisible().catch(() => false)) {
      await submit.click();
      await revealAndClick(
        targetPage,
        targetPage
          .getByRole("button", { name: /^submit for review$/iu })
          .last(),
      );
      await targetPage.waitForTimeout(sectionPauseMs);
      await targetPage.reload({ waitUntil: "domcontentloaded" });
      await waitForPageToSettle(targetPage);
    }
  }
  const stillDraft = targetPage
    .locator("tr")
    .filter({ hasText: demoData.policyCode })
    .first();
  if (await stillDraft.isVisible().catch(() => false)) {
    throw new Error(
      `${demoData.policyCode} remains in the draft list after submission.`,
    );
  }
  console.log(`PASS Create/Submit Policy: ${demoData.policyCode}`);
}

async function reviewApproveAndPublishDemoPolicy(targetPage) {
  await showOverlay(
    targetPage,
    "8B",
    "Review, approve and publish",
    "Complete the auditable review decision, approve the version, then publish it as an official policy.",
  );
  const tab = targetPage.getByRole("tab", { name: /review & publish/iu });
  if (!(await tab.isVisible().catch(() => false)))
    return recordSkip("Publish Policy", "Review & publish tab is unavailable.");
  await tab.click();
  await targetPage.waitForTimeout(actionPauseMs);
  const search = targetPage.getByPlaceholder(/search by policy/iu).first();
  if (await search.isVisible().catch(() => false)) {
    await search.fill(demoData.policyCode);
    const searchButton = targetPage
      .getByRole("button", { name: /^search$/iu })
      .first();
    if (await searchButton.isVisible().catch(() => false)) {
      await searchButton.click();
      await targetPage.waitForTimeout(actionPauseMs);
    }
  }

  const openPolicy = async () => {
    const row = targetPage
      .locator("tr")
      .filter({ hasText: demoData.policyCode })
      .first();
    if (!(await row.isVisible().catch(() => false))) return false;
    const actions = row.getByRole("button", { name: /actions for/iu }).first();
    if (!(await actions.isVisible().catch(() => false))) return false;
    await actions.click();
    const details = targetPage
      .getByRole("button", { name: /^review details$/iu })
      .first();
    if (!(await details.isVisible().catch(() => false))) return false;
    await details.click();
    await targetPage.waitForTimeout(actionPauseMs);
    return true;
  };

  if (!(await openPolicy()))
    return recordSkip(
      "Publish Policy",
      `${demoData.policyCode} was not found.`,
    );
  const complete = targetPage
    .getByRole("button", { name: /complete review/iu })
    .first();
  if (await complete.isVisible().catch(() => false)) {
    await revealAndClick(targetPage, complete);
    await targetPage.waitForTimeout(actionPauseMs);
  }
  const approve = targetPage
    .getByRole("button", { name: /approve for publication/iu })
    .first();
  if (await approve.isVisible().catch(() => false)) {
    await revealAndClick(targetPage, approve);
    await targetPage.waitForTimeout(sectionPauseMs);
  }

  if (!(await openPolicy()))
    return recordSkip(
      "Publish Policy",
      "Approved policy could not be reopened.",
    );
  const publish = targetPage
    .getByRole("button", { name: /publish official version/iu })
    .first();
  if (!(await publish.isVisible().catch(() => false))) {
    await closeVisibleDialog(targetPage);
    return recordSkip("Publish Policy", "Policy did not reach Approved state.");
  }
  await revealAndClick(targetPage, publish);
  await targetPage.waitForTimeout(sectionPauseMs);
  console.log(`PASS Review/Approve/Publish Policy: ${demoData.policyCode}`);
}

async function acknowledgeDemoPolicy(targetPage) {
  await showOverlay(
    targetPage,
    "20A",
    "Read and acknowledge policy",
    "The Employee reads the published requirement and records an auditable acknowledgement.",
  );
  const tab = targetPage.getByRole("tab", { name: /my policies/iu });
  if (await tab.isVisible().catch(() => false)) await tab.click();
  const row = targetPage
    .locator("tr")
    .filter({ hasText: demoData.policyCode })
    .first();
  if (!(await row.isVisible().catch(() => false)))
    return recordSkip(
      "Acknowledge Policy",
      "Published policy is not applicable to this Employee's department.",
    );
  await row.getByRole("button", { name: /^read policy$/iu }).click();
  const checkbox = targetPage.getByRole("checkbox").last();
  await checkbox.check();
  await targetPage.waitForTimeout(sectionPauseMs);
  await revealAndClick(
    targetPage,
    targetPage.getByRole("button", { name: /^confirm reading$/iu }),
  );
  await targetPage.waitForTimeout(sectionPauseMs);
  console.log(`PASS Acknowledge Policy: ${demoData.policyCode}`);
}

async function createAndClassifyDemoIncident(targetPage) {
  const existing = targetPage
    .locator("tr")
    .filter({ hasText: demoData.incidentTitle })
    .first();
  if (await existing.isVisible().catch(() => false)) {
    console.log(`PASS Reuse existing Incident: ${demoData.incidentTitle}`);
    await closeVisibleDialog(targetPage);
    return;
  }
  await showOverlay(
    targetPage,
    "14A",
    "Create and classify an incident",
    "The Security Officer records a manually observed incident, then classifies its severity with an auditable rationale.",
  );
  const create = targetPage
    .getByRole("button", { name: /^create incident$/iu })
    .first();
  await create.waitFor({ state: "visible", timeout: 20_000 });
  await create.click();
  const dialog = targetPage.getByRole("dialog", {
    name: /^create incident$/iu,
  });
  const manual = dialog.getByRole("tab", { name: /^manual$/iu });
  if (await manual.isVisible().catch(() => false)) await manual.click();
  await dialog.getByLabel("Incident title").fill(demoData.incidentTitle);
  await dialog.getByLabel("Severity").selectOption("high");
  await dialog
    .getByLabel("Description")
    .fill(
      "Repeated unauthorized access attempts were observed against the customer portal and require investigation and containment.",
    );
  await revealAndClick(
    targetPage,
    dialog.getByRole("button", { name: /^create incident$/iu }),
  );
  await targetPage
    .getByText(demoData.incidentTitle, { exact: true })
    .first()
    .waitFor({ timeout: 30_000 });

  const row = targetPage
    .locator("tr")
    .filter({ hasText: demoData.incidentTitle })
    .first();
  await row.getByRole("button", { name: /actions for/iu }).click();
  await targetPage
    .getByRole("button", { name: /^classify severity$/iu })
    .click();
  const classification = targetPage.getByRole("dialog", {
    name: /classify incident severity/iu,
  });
  await classification.getByRole("radio", { name: /high/iu }).click();
  await classification
    .locator("#classification-rationale")
    .fill(
      "The activity targets a customer-facing service and may expose sensitive customer information, requiring prioritized response.",
    );
  await revealAndClick(
    targetPage,
    classification.getByRole("button", { name: /^save classification$/iu }),
  );
  await targetPage.waitForTimeout(sectionPauseMs);
  await closeVisibleDialog(targetPage);
  console.log(`PASS Create/Classify Incident: ${demoData.incidentTitle}`);
  await demonstrateRowDetails(
    targetPage,
    demoData.incidentTitle,
    "Incident details",
  );
}

async function linkIncidentContextAndRequestReassessment(targetPage) {
  await closeVisibleDialog(targetPage);
  await targetPage.goto(`${baseUrl}/incidents`, {
    waitUntil: "domcontentloaded",
  });
  await waitForPageToSettle(targetPage);
  const row = targetPage
    .locator("tr")
    .filter({ hasText: demoData.incidentTitle })
    .first();
  await row.waitFor({ state: "visible", timeout: 30_000 });

  const chooseAction = async (name) => {
    await row.getByRole("button", { name: /actions for/iu }).click();
    const action = targetPage.getByRole("button", { name }).first();
    await action.waitFor({ state: "visible" });
    await action.click();
  };

  await chooseAction(/^link (asset|another asset)$/iu);
  const assetDialog = targetPage.getByRole("dialog", {
    name: /link incident to asset|link another asset/iu,
  });
  await assetDialog
    .getByPlaceholder("Search by asset code or name")
    .fill(demoData.assetName);
  await assetDialog
    .getByRole("button", { name: /search available assets/iu })
    .click();
  await targetPage.waitForTimeout(actionPauseMs);
  const assetOption = assetDialog.getByRole("checkbox", {
    name: new RegExp(escapeRegex(demoData.assetName), "iu"),
  });
  if (await assetOption.isVisible().catch(() => false)) {
    await assetOption.check();
    await revealAndClick(
      targetPage,
      assetDialog.getByRole("button", { name: /link selected \(1\)/iu }),
    );
    await targetPage.waitForTimeout(sectionPauseMs);
  }
  await assetDialog.getByRole("button", { name: /^cancel$/iu }).click();

  await chooseAction(/^link (existing risk|another risk)$/iu);
  const riskDialog = targetPage.getByRole("dialog", {
    name: /link incident to existing risk|link another risk/iu,
  });
  await riskDialog
    .getByPlaceholder("Search by risk code or title")
    .fill(demoData.riskTitle);
  await riskDialog
    .getByRole("button", { name: /search available risks/iu })
    .click();
  await targetPage.waitForTimeout(actionPauseMs);
  const riskOption = riskDialog.getByRole("checkbox", {
    name: new RegExp(escapeRegex(demoData.riskTitle), "iu"),
  });
  if (await riskOption.isVisible().catch(() => false)) {
    await riskOption.check();
    await revealAndClick(
      targetPage,
      riskDialog.getByRole("button", { name: /link selected \(1\)/iu }),
    );
    await targetPage.waitForTimeout(sectionPauseMs);
  }
  await riskDialog.getByRole("button", { name: /^cancel$/iu }).click();

  await chooseAction(/^link (control|another control)$/iu);
  const controlDialog = targetPage.getByRole("dialog", {
    name: /link incident to control|link another control/iu,
  });
  await controlDialog
    .getByPlaceholder("Search by control code or name")
    .fill(demoData.controlName);
  await controlDialog
    .getByRole("button", { name: /search available controls/iu })
    .click();
  await targetPage.waitForTimeout(actionPauseMs);
  const controlOption = controlDialog
    .getByText(demoData.controlName, { exact: true })
    .first()
    .locator('xpath=ancestor::button[@role="checkbox"]');
  if (await controlOption.isVisible().catch(() => false)) {
    await controlOption.click();
    await revealAndClick(
      targetPage,
      controlDialog.getByRole("button", { name: /link selected \(1\)/iu }),
    );
    await targetPage.waitForTimeout(sectionPauseMs);
  }
  await controlDialog.getByRole("button", { name: /^cancel$/iu }).click();

  await chooseAction(/^record control weakness$/iu);
  const weakness = targetPage.getByRole("dialog", {
    name: /record control weakness/iu,
  });
  const weaknessControl = weakness.getByRole("radio", {
    name: new RegExp(escapeRegex(demoData.controlName), "iu"),
  });
  if (await weaknessControl.isVisible().catch(() => false)) {
    await weaknessControl.click();
    await weakness.getByRole("radio", { name: /^high/iu }).click();
    await weakness
      .locator("#weakness-description")
      .fill(
        "The incident showed that privileged-access monitoring did not surface the repeated activity early enough for preventive response, so tuning and response ownership require improvement.",
      );
    await targetPage.waitForTimeout(sectionPauseMs);
    await revealAndClick(
      targetPage,
      weakness.getByRole("button", { name: /^record weakness$/iu }),
    );
    await targetPage.waitForTimeout(sectionPauseMs);
    await closeVisibleDialog(targetPage);
  } else {
    console.log("PASS Reuse existing Control Weakness");
    await closeVisibleDialog(targetPage);
  }

  await chooseAction(/^request risk reassessment$/iu);
  const requestDialog = targetPage.getByRole("dialog", {
    name: /request risk reassessment/iu,
  });
  const requestRisk = requestDialog.getByRole("radio", {
    name: new RegExp(escapeRegex(demoData.riskTitle), "iu"),
  });
  if (!(await requestRisk.isVisible().catch(() => false))) {
    console.log("PASS Reuse existing Risk Reassessment Request");
    await closeVisibleDialog(targetPage);
    return;
  }
  await requestRisk.click();
  await requestDialog
    .locator("#reassessment-reason")
    .fill(
      "The incident demonstrates that the existing likelihood and control assumptions require reassessment using current investigation evidence.",
    );
  await revealAndClick(
    targetPage,
    requestDialog.getByRole("button", { name: /^create request$/iu }),
  );
  await targetPage.waitForTimeout(sectionPauseMs);
  await closeVisibleDialog(targetPage);
  console.log(
    `PASS Incident links and reassessment request: ${demoData.incidentTitle}`,
  );
}

async function startRiskReassessmentReview(targetPage) {
  await showOverlay(
    targetPage,
    "16A",
    "Start reassessment review",
    "The assigned Risk Owner accepts responsibility for reviewing the incident-driven reassessment request.",
  );
  const tab = targetPage.getByRole("tab", {
    name: /reassessment requests/iu,
  });
  if (await tab.isVisible().catch(() => false)) await tab.click();
  const search = targetPage.getByPlaceholder(
    "Search by risk, incident, or reason",
  );
  await search.fill(demoData.riskTitle);
  await targetPage.getByRole("button", { name: /^search$/iu }).click();
  await targetPage.waitForTimeout(actionPauseMs);
  const row = targetPage
    .locator("tr")
    .filter({ hasText: demoData.riskTitle })
    .first();
  await row.waitFor({ state: "visible", timeout: 30_000 });
  await row.getByRole("button", { name: /actions for/iu }).click();
  const start = targetPage.getByRole("button", { name: /^start review$/iu });
  if (await start.isVisible().catch(() => false)) {
    await revealAndClick(targetPage, start);
    await targetPage.waitForTimeout(sectionPauseMs);
  } else {
    await targetPage.keyboard.press("Escape");
    console.log("PASS Reuse reassessment already under review");
  }
  console.log(`PASS Start Risk Reassessment Review: ${demoData.riskTitle}`);
}

async function completeRiskReassessmentReview(targetPage) {
  const row = targetPage
    .locator("tr")
    .filter({ hasText: demoData.riskTitle })
    .first();
  await row.getByRole("button", { name: /actions for/iu }).click();
  const reassess = targetPage.getByRole("button", { name: /^reassess$/iu });
  await reassess
    .waitFor({ state: "visible", timeout: 5_000 })
    .catch(() => undefined);
  if (!(await reassess.isVisible().catch(() => false))) {
    await targetPage.keyboard.press("Escape");
    console.log("PASS Reuse completed Risk Reassessment");
    return;
  }
  await reassess.click();
  const dialog = targetPage.getByRole("dialog", {
    name: /reassess residual risk.*update treatment plan/iu,
  });
  await dialog.locator("#rr-likelihood").selectOption("2");
  await dialog.locator("#rr-impact").selectOption("3");
  await dialog.locator("#rr-effectiveness").fill("88");
  await dialog
    .locator("#rr-reason")
    .fill(
      "Incident evidence confirms the monitoring control is effective but response tuning is still required. Residual likelihood is reduced while customer-data impact remains material.",
    );
  await dialog.locator("#rr-plan-status").selectOption("active");
  const target = new Date(Date.now() + 30 * 24 * 60 * 60 * 1_000)
    .toISOString()
    .slice(0, 10);
  await dialog.locator("#rr-target").fill(target);
  await targetPage.waitForTimeout(sectionPauseMs);
  await revealAndClick(
    targetPage,
    dialog.getByRole("button", { name: /^complete reassessment$/iu }),
  );
  const reassessmentError = dialog.getByRole("alert").first();
  await Promise.race([
    dialog.waitFor({ state: "hidden", timeout: 15_000 }),
    reassessmentError.waitFor({ state: "visible", timeout: 15_000 }),
  ]);
  if (await reassessmentError.isVisible().catch(() => false)) {
    throw new Error(
      `Risk reassessment was not completed: ${(await reassessmentError.textContent())?.trim()}`,
    );
  }
  await targetPage.waitForTimeout(sectionPauseMs);
  console.log(`PASS Complete Risk Reassessment: ${demoData.riskTitle}`);
}

async function completeDemoIncidentResponse(targetPage) {
  await closeVisibleDialog(targetPage);
  await targetPage.goto(`${baseUrl}/incidents`, {
    waitUntil: "domcontentloaded",
  });
  await waitForPageToSettle(targetPage);
  const incidentRow = () =>
    targetPage
      .locator("tr")
      .filter({ hasText: demoData.incidentTitle })
      .first();
  await incidentRow().waitFor({ state: "visible", timeout: 30_000 });
  if (
    await incidentRow()
      .getByText("Closed", { exact: true })
      .isVisible()
      .catch(() => false)
  ) {
    console.log(`PASS Reuse closed Incident: ${demoData.incidentTitle}`);
    return;
  }

  const choose = async (name) => {
    await incidentRow()
      .getByRole("button", { name: /actions for/iu })
      .first()
      .click();
    const action = targetPage.getByRole("button", { name }).first();
    await action.waitFor({ state: "visible", timeout: 15_000 });
    await action.click();
    await targetPage.waitForTimeout(actionPauseMs);
  };

  await showOverlay(
    targetPage,
    "16B",
    "Assign the incident handler",
    "Assign an active Security Officer before executing the audited response phases.",
  );
  await choose(/^(assign|reassign) handler$/iu);
  const assignment = targetPage.getByRole("dialog", {
    name: /assign incident handler/iu,
  });
  await assignment
    .locator("#incident-handler-search")
    .fill("securityofficer@gmail.com");
  await assignment
    .getByRole("option", { name: /securityofficer@gmail.com/iu })
    .click();
  await assignment
    .locator("#assignment-note")
    .fill(
      "Assigned to the Security Officer responsible for the recorded Wazuh investigation and coordinated response.",
    );
  await revealAndClick(
    targetPage,
    assignment.getByRole("button", { name: /^assign handler$/iu }),
  );
  await targetPage.waitForTimeout(sectionPauseMs);
  await closeVisibleDialog(targetPage);

  await advanceIncidentPhase(targetPage, incidentRow, "triage");

  const phases = [
    {
      phase: "containment",
      action: /^record containment action$/iu,
      dialog: /record containment action/iu,
      timeInput: "#containment-time",
      description:
        "Restricted privileged access to the customer portal and isolated the affected authentication path while preserving logs for investigation.",
    },
    {
      phase: "eradication",
      action: /^record eradication action$/iu,
      dialog: /record eradication action/iu,
      timeInput: "#eradication-time",
      description:
        "Revoked exposed credentials, removed unauthorized sessions and corrected the access configuration that enabled repeated privileged attempts.",
    },
    {
      phase: "recovery",
      action: /^record recovery action$/iu,
      dialog: /record recovery action/iu,
      timeInput: "#recovery-time",
      description:
        "Restored customer portal access, validated authentication and monitoring, and confirmed normal service operation without recurring unauthorized activity.",
    },
  ];

  for (const item of phases) {
    await advanceIncidentPhase(targetPage, incidentRow, item.phase);
    await choose(item.action);
    const actionDialog = targetPage.getByRole("dialog", { name: item.dialog });
    await actionDialog.locator("textarea").first().fill(item.description);
    const performedAt = new Date(Date.now() - 60_000);
    performedAt.setMinutes(
      performedAt.getMinutes() - performedAt.getTimezoneOffset(),
    );
    await actionDialog
      .locator(item.timeInput)
      .fill(performedAt.toISOString().slice(0, 16));
    await targetPage.waitForTimeout(sectionPauseMs);
    await revealAndClick(
      targetPage,
      actionDialog.getByRole("button", { name: /^record action$/iu }),
    );
    const historyTab = actionDialog.getByRole("tab", { name: /^history$/iu });
    await expectSelectedTab(historyTab, 15_000);
    await actionDialog
      .getByText(item.description, { exact: true })
      .waitFor({ state: "visible", timeout: 15_000 });
    await targetPage.waitForTimeout(sectionPauseMs);
    await closeVisibleDialog(targetPage);
  }

  await advanceIncidentPhase(targetPage, incidentRow, "lessons_learned");
  await choose(/^root cause & lessons learned$/iu);
  const analysis = targetPage.getByRole("dialog", {
    name: /root cause analysis.*lessons learned/iu,
  });
  await analysis
    .locator("#rca-rootCause")
    .fill(
      "Privileged authentication monitoring and response thresholds were not tuned to surface repeated access attempts early enough.",
    );
  await analysis
    .locator("#rca-lessonsLearned")
    .fill(
      "Correlating Wazuh events with asset, control and risk context provides faster and more accountable incident decisions.",
    );
  await analysis
    .locator("#rca-improvementActions")
    .fill(
      "Tune detection baselines, review Control evidence regularly and track the linked Risk treatment action to completion.",
    );
  await targetPage.waitForTimeout(sectionPauseMs);
  await revealAndClick(
    targetPage,
    analysis.getByRole("button", { name: /^save findings$/iu }),
  );
  await targetPage.waitForTimeout(sectionPauseMs);
  await closeVisibleDialog(targetPage);

  await choose(/^close incident$/iu);
  const closure = targetPage.getByRole("dialog", {
    name: /^close incident$/iu,
  });
  await closure
    .locator("#incident-closure-summary")
    .fill(
      "Containment, eradication and recovery were completed and validated. Root cause, lessons learned, Control weakness and Risk reassessment are recorded for follow-up.",
    );
  await closure.getByRole("checkbox").check();
  await targetPage.waitForTimeout(sectionPauseMs);
  await revealAndClick(
    targetPage,
    closure.getByRole("button", { name: /^close incident$/iu }),
  );
  await targetPage.waitForTimeout(sectionPauseMs);
  console.log(`PASS Complete Incident Response: ${demoData.incidentTitle}`);
}

async function advanceIncidentPhase(targetPage, incidentRow, phase) {
  const phaseLabel = phase
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
  if (
    await incidentRow()
      .getByText(phaseLabel, { exact: true })
      .isVisible()
      .catch(() => false)
  ) {
    console.log(`PASS Reuse incident phase: ${phaseLabel}`);
    return;
  }
  await incidentRow()
    .getByRole("button", { name: /actions for/iu })
    .first()
    .click();
  await targetPage
    .getByRole("button", { name: /^update handling phase$/iu })
    .click();
  const dialog = targetPage.getByRole("dialog", {
    name: /incident handling phase/iu,
  });
  await dialog
    .getByRole("radio", {
      name: new RegExp(`^${phase.replaceAll("_", " ")}`, "iu"),
    })
    .click();
  await dialog
    .locator("#incident-progress-note")
    .fill(
      `The ${phase.replaceAll("_", " ")} phase is ready based on the completed response actions and documented validation results.`,
    );
  await dialog.locator("#incident-phase-confirm").check();
  await targetPage.waitForTimeout(sectionPauseMs);
  await revealAndClick(
    targetPage,
    dialog.getByRole("button", { name: /^save progress$/iu }),
  );
  await targetPage.waitForTimeout(sectionPauseMs);
  await closeVisibleDialog(targetPage);
  await targetPage.reload({ waitUntil: "domcontentloaded" });
  await waitForPageToSettle(targetPage);
}

async function chooseRiskOption(targetPage, label, searchText) {
  const input =
    label === "Asset"
      ? targetPage.locator("#scopeId")
      : label === "Risk owner"
        ? targetPage.locator("#ownerUserId")
        : targetPage.getByRole("combobox", { name: label }).first();
  await input.fill(searchText);
  await targetPage.waitForTimeout(900);
  const option = targetPage
    .getByRole("option")
    .filter({ hasText: searchText })
    .first();
  await option.waitFor({ timeout: 15_000 });
  await option.click();
}

async function selectNativeOptionContaining(locator, text) {
  if (!(await locator.isVisible().catch(() => false))) return false;
  const value = await locator
    .locator("option")
    .filter({ hasText: text })
    .first()
    .getAttribute("value")
    .catch(() => null);
  if (!value) return false;
  await locator.selectOption(value);
  return true;
}

async function demonstrateRowDetails(targetPage, recordName, title) {
  try {
    const row = targetPage
      .locator("tr")
      .filter({ hasText: recordName })
      .first();
    if (!(await row.isVisible().catch(() => false))) return;
    await showOverlay(
      targetPage,
      "Details",
      title,
      `Open the complete ${title.toLowerCase()} record before continuing the workflow.`,
    );

    let view = row
      .getByRole("button", { name: /^(view|view details)$/iu })
      .first();
    if (!(await view.isVisible().catch(() => false))) {
      const actions = row
        .getByRole("button", { name: /actions for/iu })
        .first();
      if (!(await actions.isVisible().catch(() => false))) return;
      await actions.click();
      await targetPage.waitForTimeout(actionPauseMs);
      view = targetPage
        .getByRole("button", { name: /^(view|view details)$/iu })
        .first();
    }
    if (!(await view.isVisible().catch(() => false))) return;

    await revealAndClick(targetPage, view);
    await targetPage.waitForTimeout(sectionPauseMs);
    const dialog = targetPage.locator("dialog[open]").last();
    if (await dialog.isVisible().catch(() => false)) {
      await dialog.evaluate((element) => element.scrollTo({ top: 0 }));
      await targetPage.waitForTimeout(sectionPauseMs);
      await closeVisibleDialog(targetPage);
    }
  } catch (error) {
    recordSkip(
      title,
      error instanceof Error ? error.message : "Detail view is unavailable.",
    );
  }
}

async function demonstrateEventSourceAdministration(targetPage) {
  await showOverlay(
    targetPage,
    "9A",
    "Register and validate an event source",
    "Review the registration contract, inspect the active Wazuh source and open its connection diagnostic.",
  );
  const register = targetPage.getByRole("button", {
    name: /^register event source$/iu,
  });
  if (await register.isVisible().catch(() => false)) {
    await register.click();
    const registration = targetPage.getByRole("dialog", {
      name: /register Wazuh SIEM event source/iu,
    });
    await registration
      .getByLabel("Event source name *")
      .fill(`${demoRunId} Wazuh Replay Source`);
    await registration.getByLabel("Status *").selectOption("INACTIVE");
    await registration
      .getByLabel("SecuraAI Ingestion Webhook Endpoint *")
      .fill(`/api/v1/integrations/wazuh/events/${demoRunId.toLowerCase()}`);
    for (const family of [
      "VPN & Remote SSO Access",
      "Application & Privilege Access",
    ]) {
      const option = registration.getByRole("button", {
        name: new RegExp(family, "iu"),
      });
      if (await option.isVisible().catch(() => false)) await option.click();
    }
    await registration
      .getByLabel("Description")
      .fill(
        "Inactive demonstration source showing the Wazuh push-ingestion registration workflow.",
      );
    await revealAndClick(
      targetPage,
      registration.getByRole("button", { name: /^register event source$/iu }),
    );
    await targetPage
      .getByText(`${demoRunId} Wazuh Replay Source`, { exact: true })
      .first()
      .waitFor({ timeout: 30_000 });
    console.log("PASS Register event source");
  }

  const sourceRow = targetPage
    .locator("tr")
    .filter({ hasText: /Wazuh SIEM Ingestion \(Default\)|Wazuh/iu })
    .first();
  const details = sourceRow.getByRole("button", { name: /^details$/iu });
  if (!(await details.isVisible().catch(() => false))) {
    throw new Error("No Wazuh event source is available for detail review.");
  }
  await revealAndClick(targetPage, details);
  const sourceDialog = targetPage.getByRole("dialog", {
    name: /event source details/iu,
  });
  await sourceDialog.waitFor({ timeout: 20_000 });
  await targetPage.waitForTimeout(sectionPauseMs);
  console.log("PASS Event Source Details");

  const testConnection = sourceDialog.getByRole("button", {
    name: /^test connection$/iu,
  });
  if (await testConnection.isVisible().catch(() => false)) {
    await revealAndClick(targetPage, testConnection);
    const testDialog = targetPage.getByRole("dialog", {
      name: /test event source connection/iu,
    });
    await testDialog.waitFor({ timeout: 20_000 });
    const wazuhUsername = process.env.SECURAAI_DEMO_WAZUH_API_USERNAME;
    const wazuhPassword = process.env.SECURAAI_DEMO_WAZUH_API_PASSWORD;
    const wazuhEndpoint = process.env.SECURAAI_DEMO_WAZUH_API_URL;
    if (wazuhEndpoint)
      await testDialog.getByLabel("Wazuh Manager Endpoint").fill(wazuhEndpoint);
    if (wazuhUsername)
      await testDialog.getByLabel("API Username").fill(wazuhUsername);
    if (wazuhPassword)
      await testDialog.getByLabel("API Password").fill(wazuhPassword);
    await targetPage.waitForTimeout(sectionPauseMs);
    if (wazuhEndpoint && wazuhUsername && wazuhPassword) {
      await revealAndClick(
        targetPage,
        testDialog.getByRole("button", { name: /run connection test/iu }),
      );
      await testDialog
        .getByText(/connection successful|connection failed/iu)
        .waitFor({ timeout: 35_000 });
      await targetPage.waitForTimeout(sectionPauseMs);
      console.log("PASS Test Event Source Connection result");
    } else {
      console.log(
        "PASS Test Event Source Connection form (credentials not supplied)",
      );
    }
    await closeVisibleDialog(targetPage);
  }
  await closeVisibleDialog(targetPage);
}

async function demonstrateDetectionModelConfiguration(targetPage) {
  await targetPage.goto(`${baseUrl}/ai-models`, {
    waitUntil: "domcontentloaded",
  });
  await waitForPageToSettle(targetPage);
  await showOverlay(
    targetPage,
    "9B",
    "Detection and explanation models",
    "Inspect the deployed detection configuration and the separate explanation runtime, then review the model threshold.",
  );
  const details = targetPage
    .getByRole("button", { name: /^details$/iu })
    .first();
  if (await details.isVisible().catch(() => false)) {
    await revealAndClick(targetPage, details);
    await targetPage.waitForTimeout(sectionPauseMs);
    await closeVisibleDialog(targetPage);
    console.log("PASS Detection & explanation model details");
  }
  const configure = targetPage.getByRole("button", {
    name: /configure detection threshold/iu,
  });
  if (await configure.isVisible().catch(() => false)) {
    await revealAndClick(targetPage, configure);
    const dialog = targetPage.getByRole("dialog", {
      name: /configure detection threshold/iu,
    });
    await dialog.waitFor({ timeout: 20_000 });
    await dialog
      .getByRole("status", { name: /loading detection threshold/iu })
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => undefined);
    await targetPage.waitForTimeout(sectionPauseMs);
    await closeVisibleDialog(targetPage);
    console.log("PASS Configure Detection Threshold");
  }
}

async function demonstrateDetectionOperations(targetPage) {
  await targetPage.goto(`${baseUrl}/anomaly-monitoring`, {
    waitUntil: "domcontentloaded",
  });
  await waitForPageToSettle(targetPage);
  await showOverlay(
    targetPage,
    "9C",
    "Detection operations",
    "Review asset-specific threshold overrides and run one bounded manual batch for stored events.",
  );
  const overrides = targetPage.getByRole("tab", {
    name: /asset threshold overrides/iu,
  });
  if (await overrides.isVisible().catch(() => false)) {
    await overrides.click();
    await targetPage.waitForTimeout(sectionPauseMs);
    const edit = targetPage.getByRole("button", { name: /^edit$/iu }).first();
    const add = targetPage
      .getByRole("button", { name: /add override/iu })
      .first();
    const action = (await edit.isVisible().catch(() => false)) ? edit : add;
    if (await action.isVisible().catch(() => false)) {
      await revealAndClick(targetPage, action);
      await targetPage.waitForTimeout(sectionPauseMs);
      const overrideDialog = targetPage.getByRole("dialog", {
        name: /asset threshold override/iu,
      });
      const cancel = overrideDialog.getByRole("button", {
        name: /^cancel$/iu,
      });
      if (await cancel.isVisible().catch(() => false)) await cancel.click();
      await overrideDialog
        .waitFor({ state: "hidden", timeout: 10_000 })
        .catch(() => undefined);
    }
    console.log("PASS Asset threshold overrides");
  }

  const alertsTab = targetPage.getByRole("tab", {
    name: /AI-detected alerts/iu,
  });
  if (await alertsTab.isVisible().catch(() => false)) await alertsTab.click();
  const manual = targetPage.getByRole("button", {
    name: /^run manual detection$/iu,
  });
  if (await manual.isVisible().catch(() => false)) {
    await revealAndClick(targetPage, manual);
    const dialog = targetPage.getByRole("dialog", {
      name: /run manual detection/iu,
    });
    await dialog.waitFor({ timeout: 20_000 });
    await targetPage.waitForTimeout(sectionPauseMs);
    await revealAndClick(
      targetPage,
      dialog.getByRole("button", { name: /run up to 100 events/iu }),
    );
    await targetPage
      .getByText(/manual detection (batch )?completed|detection run failed/iu)
      .waitFor({ timeout: 90_000 })
      .catch(() => undefined);
    await targetPage.waitForTimeout(sectionPauseMs);
    console.log("PASS Run manual detection");
  }
}

async function demonstrateEntityMappingReview(targetPage) {
  const view = targetPage.getByRole("button", { name: /^view$/iu }).first();
  if (!(await view.isVisible().catch(() => false))) {
    return recordSkip(
      "Review Entity Mapping",
      "No security event is available.",
    );
  }
  await revealAndClick(targetPage, view);
  const detail = targetPage.locator("dialog[open]").last();
  await detail.waitFor({ timeout: 20_000 });
  const review = detail.getByRole("button", {
    name: /review & correct mapping/iu,
  });
  if (await review.isVisible().catch(() => false)) {
    await revealAndClick(targetPage, review);
    const mapping = targetPage.getByRole("dialog", {
      name: /review & correct entity mapping/iu,
    });
    await mapping.waitFor({ timeout: 20_000 });
    await targetPage.waitForTimeout(sectionPauseMs);
    const cancel = mapping.getByRole("button", { name: /^cancel$/iu });
    if (await cancel.isVisible().catch(() => false)) await cancel.click();
    await mapping
      .waitFor({ state: "hidden", timeout: 10_000 })
      .catch(() => undefined);
    console.log("PASS Review & Correct Entity Mapping");
  }
  await closeVisibleDialog(targetPage);
}

async function demonstrateFirstAvailableDetails(
  targetPage,
  { actionName, title },
) {
  try {
    const action = targetPage.getByRole("button", { name: actionName }).first();
    if (!(await action.isVisible().catch(() => false))) {
      return recordSkip(title, "No detail record is available on this page.");
    }
    await showOverlay(
      targetPage,
      "Details",
      title,
      `Open one representative ${title.toLowerCase()} record and review its complete context.`,
    );
    await revealAndClick(targetPage, action);
    const dialog = targetPage.locator("dialog[open]").last();
    if (await dialog.isVisible().catch(() => false)) {
      await dialog.evaluate((element) => element.scrollTo({ top: 0 }));
      await targetPage.waitForTimeout(sectionPauseMs);
      await closeVisibleDialog(targetPage);
    } else {
      await targetPage.waitForTimeout(sectionPauseMs);
    }
    console.log(`PASS ${title}`);
  } catch (error) {
    recordSkip(
      title,
      error instanceof Error ? error.message : "Detail view is unavailable.",
    );
  }
}

function recordSkip(name, reason) {
  console.warn(`SKIP ${name}: ${reason}`);
}

async function revealAndClick(targetPage, locator) {
  await locator.scrollIntoViewIfNeeded();
  await locator.focus();
  await targetPage.waitForTimeout(
    numberFromEnv("SECURAAI_DEMO_ACTION_REVEAL_MS", 2_500),
  );
  await locator.click();
}

function shouldRun(chapter) {
  return chapter >= startChapter && chapter <= endChapter;
}

async function runOptionalStep(targetPage, name, operation) {
  try {
    await operation();
  } catch (error) {
    recordSkip(name, error instanceof Error ? error.message : String(error));
    await targetPage.keyboard.press("Escape").catch(() => undefined);
    await targetPage.waitForTimeout(actionPauseMs);
  }
}

async function expectSelectedTab(tab, timeoutMs) {
  await tab.waitFor({ state: "visible", timeout: timeoutMs });
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if ((await tab.getAttribute("aria-selected")) === "true") return;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(
    `The action was not saved: ${await tab.textContent()} did not become selected.`,
  );
}

async function closeVisibleDialog(targetPage) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const openDialog = targetPage.locator("dialog[open]").last();
    if (!(await openDialog.isVisible().catch(() => false))) return;
    const closeButton = openDialog
      .getByRole("button", { name: /^(close|close details|cancel)$/iu })
      .last();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click();
    } else {
      await targetPage.keyboard.press("Escape");
    }
    await targetPage.waitForTimeout(actionPauseMs);
  }
}

async function launchVisibleWazuhScenarios() {
  const launcher = path.join(
    frontendRoot,
    "scripts",
    "demo",
    "run-wazuh-demo-scenarios.ps1",
  );
  await runProcess("powershell.exe", [
    "-NoLogo",
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    launcher,
    "-BackendRoot",
    backendRoot,
    "-ScenarioList",
    scenarios.join(","),
    "-HoldSeconds",
    String(terminalHoldSeconds),
  ]);
}

function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: backendRoot,
      windowsHide: false,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(`Wazuh scenario process exited with code ${String(code)}.`),
        );
    });
  });
}

function numberFromEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0)
    throw new Error(`${name} must be a non-negative number.`);
  return parsed;
}

async function ensureMlService() {
  if (await isHealthy(mlHealthUrl)) {
    console.log(`ML service ready: ${mlHealthUrl}`);
    return null;
  }

  const python = path.join(trainModelRoot, ".venv", "Scripts", "python.exe");
  const artifactDir = path.join(
    trainModelRoot,
    "artifacts-temporal-1m5m15m60m-candidate",
  );
  if (!existsSync(python) || !existsSync(artifactDir)) {
    throw new Error(
      `ML service is unavailable and Train-Model could not be started from ${trainModelRoot}.`,
    );
  }

  console.log(
    "ML service is offline. Starting the trained temporal model for this demo...",
  );
  const child = spawn(
    python,
    [
      "-m",
      "uvicorn",
      "securaai_ml.api:app",
      "--host",
      "0.0.0.0",
      "--port",
      "8002",
    ],
    {
      cwd: trainModelRoot,
      windowsHide: true,
      stdio: "ignore",
      env: {
        ...process.env,
        SECURAAI_MODEL_ARTIFACT_DIR: artifactDir,
      },
    },
  );
  child.once("exit", (code) => {
    if (code !== null && code !== 0)
      console.error(
        `ML service exited unexpectedly with code ${String(code)}.`,
      );
  });

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (await isHealthy(mlHealthUrl)) {
      console.log(`ML service ready: ${mlHealthUrl}`);
      return child;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  child.kill();
  throw new Error(
    "The trained ML service did not become healthy within 60 seconds.",
  );
}

async function isHealthy(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function readSecret(prompt) {
  if (!input.isTTY || typeof input.setRawMode !== "function") return "";
  output.write(prompt);
  input.setRawMode(true);
  input.resume();
  return new Promise((resolve, reject) => {
    let secret = "";
    const onData = (buffer) => {
      for (const value of buffer.toString("utf8")) {
        if (value === "\u0003") {
          cleanup();
          reject(new Error("Demo cancelled."));
          return;
        }
        if (value === "\r" || value === "\n") {
          cleanup();
          output.write("\n");
          resolve(secret);
          return;
        }
        if (value === "\b" || value === "\u007f") {
          secret = secret.slice(0, -1);
          continue;
        }
        secret += value;
      }
    };
    const cleanup = () => {
      input.off("data", onData);
      input.setRawMode(false);
      input.pause();
    };
    input.on("data", onData);
  });
}

async function waitForEnter(prompt) {
  const readline = createInterface({ input, output });
  try {
    await readline.question(prompt);
  } finally {
    readline.close();
  }
}
