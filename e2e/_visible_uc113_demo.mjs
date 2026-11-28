import { chromium } from "@playwright/test";
import readline from "node:readline";

const baseURL = process.env.SECURAAI_DEMO_BASE_URL ?? "http://localhost:3001";
const demoEmail = process.env.SECURAAI_DEMO_EMAIL;
const demoPassword = process.env.SECURAAI_DEMO_PASSWORD;

if (!demoEmail || !demoPassword) {
  throw new Error(
    "Set SECURAAI_DEMO_EMAIL and SECURAAI_DEMO_PASSWORD before running this demo.",
  );
}
const browser = await chromium.launch({ headless: false, slowMo: 700 });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
const wait = (ms = 1400) => page.waitForTimeout(ms);
let cleanup;

try {
  await page.goto(`${baseURL}/login`);
  await wait();
  await page.getByLabel("Email").fill(demoEmail);
  await page.locator('input[name="password"]').fill(demoPassword);
  await wait();
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => url.pathname !== "/login", {
    timeout: 15_000,
  });
  await wait();
  await page.goto(`${baseURL}/incidents`);
  await page.getByRole("heading", { name: "Security incidents" }).waitFor();
  const actions = page.getByRole("button", { name: /^Actions for / });
  await actions.first().waitFor({ timeout: 15_000 });
  await wait();

  let opened = false;
  for (let i = 0; i < (await actions.count()); i += 1) {
    await actions.nth(i).click();
    const action = page.getByRole("button", {
      name: /^(Link risk|Link another risk)$/,
    });
    if (await action.isVisible().catch(() => false)) {
      await wait();
      await action.click();
      opened = true;
      break;
    }
    await page.keyboard.press("Escape");
  }
  if (!opened) throw new Error("No open incident offered Link risk");

  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await page.waitForFunction(
    () => Boolean(document.querySelector('dialog[open] [role="checkbox"]')),
    undefined,
    { timeout: 15_000 },
  );
  await wait(2200);
  const candidate = dialog.getByRole("checkbox").first();
  const text = await candidate.innerText();
  const riskCode =
    text
      .split(/\s+/u)
      .find((part) => part.startsWith("RSK-") || part.startsWith("RISK-")) ??
    text.split(/\s+/u)[0];
  const search = dialog.getByPlaceholder("Search by risk code or title");
  await search.fill(riskCode);
  await dialog.getByRole("button", { name: "Search available risks" }).click();
  await wait(1800);
  await dialog.getByRole("checkbox").first().click();
  await wait(1800);

  const postPromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      /\/api\/incidents\/[^/]+\/risks$/u.test(new URL(response.url()).pathname),
  );
  await dialog.getByRole("button", { name: "Link selected (1)" }).click();
  const linked = await postPromise;
  const payload = await linked.json();
  const incidentId = payload?.data?.incident?.id ?? payload?.incident?.id;
  const riskId = payload?.data?.risk?.id ?? payload?.risk?.id;
  cleanup = { incidentId, riskId };
  await page.getByText("Links saved").waitFor();
  await wait(2500);

  await search.fill("");
  await dialog.getByRole("button", { name: "Search available risks" }).click();
  const linkedSearch = dialog.getByPlaceholder("Search linked risks");
  await linkedSearch.fill(riskCode);
  await dialog.getByRole("button", { name: "Search linked risks" }).click();
  await wait(2200);
  const linkedSection = dialog
    .getByRole("heading", { name: "Linked risks" })
    .locator("xpath=ancestor::section");
  await linkedSection.getByRole("button", { name: "Unlink" }).click();
  await wait(2200);
  const deletePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" &&
      response.url().includes("/risks/"),
  );
  await linkedSection.getByRole("button", { name: "Remove link" }).click();
  const removed = await deletePromise;
  if (removed.status() !== 204)
    throw new Error(`Unexpected unlink response ${removed.status()}`);
  cleanup = undefined;
  await page.getByText("Risk unlinked").waitFor();
  await wait(2500);
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await wait();
  console.log("VISIBLE_UC113_DEMO_COMPLETE_AND_DATA_RESTORED");
  console.log(
    "Browser remains open. Press Enter in this terminal session to close it.",
  );
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  await new Promise((resolve) => rl.once("line", resolve));
  rl.close();
} finally {
  if (cleanup?.incidentId && cleanup?.riskId) {
    await page.request
      .delete(
        `${baseURL}/api/incidents/${cleanup.incidentId}/risks/${cleanup.riskId}`,
      )
      .catch(() => undefined);
  }
  await context.close();
  await browser.close();
}
