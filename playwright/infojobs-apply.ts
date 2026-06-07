import { chromium } from "playwright";
import { parseCliOptions } from "./lib/cli";
import { getEnv } from "./lib/env";
import { fillSafeFields } from "./lib/forms";
import { loadRunData } from "./lib/profile";
import { createRunDir, screenshot, writeSummary } from "./lib/screenshots";
import { updateApplication } from "./lib/applyone-api";
import { humanDelay } from "./lib/delays";
import type { RunSummary } from "./lib/types";

async function main() {
  const options = parseCliOptions();
  const env = getEnv();
  const data = await loadRunData(env.apiBase, options);
  const runDir = await createRunDir("infojobs");
  const summary: RunSummary = {
    jobId: data.job.id || options.jobId,
    applicationId: data.application?.id || options.applicationId,
    url: data.url,
    platform: "infojobs",
    mode: "dry-run",
    status: "ready_to_apply",
    fieldsFilled: [],
    cvUploaded: false,
    stoppedBeforeSubmit: true,
    screenshots: [],
    errors: []
  };

  console.log("ApplyOne InfoJobs assisted dry-run");
  console.log(`Job: ${data.job.title} at ${data.job.company}`);
  console.log("No credentials are stored or entered. The script stops before final submission.");

  const browser = await chromium.launch({ headless: env.headless });
  const page = await browser.newPage();

  try {
    await page.goto(data.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await screenshot(page, runDir, "01-opened", summary);

    const applyButton = page.getByRole("button", { name: /inscribirme|apuntarme|solicitar|apply/i }).or(page.getByRole("link", { name: /inscribirme|apuntarme|solicitar|apply/i }));
    if ((await applyButton.count()) > 0) {
      console.log("InfoJobs apply entry detected; clicking to reach the safe review/form step.");
      await applyButton.first().click();
      await humanDelay();
      await screenshot(page, runDir, "02-after-apply-entry", summary);
    } else {
      console.log("No visible InfoJobs apply button found. Manual review may be required.");
    }

    if (await page.getByText(/inicia sesi|login|accede/i).count()) {
      throw new Error("InfoJobs login appears required. Please log in manually; credentials are not automated.");
    }

    const result = await fillSafeFields(page, data.profile, data.application, env.cvPath);
    summary.fieldsFilled = result.fieldsFilled;
    summary.cvUploaded = result.cvUploaded;
    await screenshot(page, runDir, "03-after-fill", summary);

    if (options.confirmSubmit) {
      console.log("--confirm-submit was provided, but Phase 4B InfoJobs script remains review-only.");
      console.log("Review manually; no final submit button was clicked.");
    }

    if (data.application?.id) {
      await updateApplication(env.apiBase, data.application.id, {
        status: "ready_to_apply",
        notes: `InfoJobs assisted dry-run stopped before submit. Fields: ${summary.fieldsFilled.join(", ") || "none"}.`
      });
    }
  } catch (error) {
    summary.status = "manual_required";
    summary.errors.push(error instanceof Error ? error.message : "Unknown automation error");
    console.log(`Manual review required: ${summary.errors.join("; ")}`);
    if (data.application?.id) {
      await updateApplication(env.apiBase, data.application.id, {
        status: "manual_required",
        notes: `InfoJobs assisted script could not continue safely: ${summary.errors.join("; ")}`
      });
    }
  } finally {
    await screenshot(page, runDir, "99-final", summary).catch(() => undefined);
    await writeSummary(runDir, summary);
    await browser.close();
  }

  console.log("Dry-run complete. No real application was submitted.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
