import { chromium } from "playwright";
import { parseCliOptions } from "./lib/cli";
import { getEnv } from "./lib/env";
import { detectPlatform, fillSafeFields } from "./lib/forms";
import { loadRunData } from "./lib/profile";
import { createRunDir, screenshot, writeSummary } from "./lib/screenshots";
import { updateApplication } from "./lib/applyone-api";
import type { RunSummary } from "./lib/types";

async function main() {
  const options = parseCliOptions();
  const env = getEnv();
  const data = await loadRunData(env.apiBase, options);
  const platform = await detectPlatform(data.url);
  const runDir = await createRunDir(platform);
  const summary: RunSummary = {
    jobId: data.job.id || options.jobId,
    applicationId: data.application?.id || options.applicationId,
    url: data.url,
    platform,
    mode: "dry-run",
    status: "ready_to_apply",
    fieldsFilled: [],
    cvUploaded: false,
    stoppedBeforeSubmit: true,
    screenshots: [],
    errors: []
  };

  console.log(`ApplyOne assisted application dry-run`);
  console.log(`Platform: ${platform}`);
  console.log(`Job: ${data.job.title} at ${data.job.company}`);
  console.log(`URL: ${data.url}`);
  console.log("This script will stop before final submission.");

  const browser = await chromium.launch({ headless: env.headless });
  const page = await browser.newPage();

  try {
    await page.goto(data.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await screenshot(page, runDir, "01-opened", summary);

    const result = await fillSafeFields(page, data.profile, data.application, env.cvPath);
    summary.fieldsFilled = result.fieldsFilled;
    summary.cvUploaded = result.cvUploaded;
    await screenshot(page, runDir, "02-after-fill", summary);

    if (options.confirmSubmit) {
      console.log("--confirm-submit was provided, but Phase 4B generic script remains review-only.");
      console.log("Review the page manually. No submit button was clicked.");
    }

    await screenshot(page, runDir, "03-review-stop", summary);

    if (data.application?.id) {
      await updateApplication(env.apiBase, data.application.id, {
        status: "ready_to_apply",
        notes: `Assisted generic dry-run prepared fields: ${summary.fieldsFilled.join(", ") || "none"}. Stopped before submit.`
      });
    }
  } catch (error) {
    summary.status = "manual_required";
    summary.errors.push(error instanceof Error ? error.message : "Unknown automation error");
    console.log(`Manual review required: ${summary.errors.join("; ")}`);
    if (data.application?.id) {
      await updateApplication(env.apiBase, data.application.id, {
        status: "manual_required",
        notes: `Assisted generic script could not continue safely: ${summary.errors.join("; ")}`
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
