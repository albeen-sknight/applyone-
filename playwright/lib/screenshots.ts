import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { Page } from "playwright";
import type { RunSummary } from "./types";

export async function createRunDir(platform: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = resolve("playwright", ".runs", `${stamp}-${platform}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function screenshot(page: Page, runDir: string, name: string, summary: RunSummary) {
  const file = join(runDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  summary.screenshots.push(file);
  console.log(`Screenshot saved: ${file}`);
}

export async function writeSummary(runDir: string, summary: RunSummary) {
  const file = join(runDir, "summary.json");
  await writeFile(file, JSON.stringify(summary, null, 2), "utf8");
  console.log(`Summary saved: ${file}`);
}
