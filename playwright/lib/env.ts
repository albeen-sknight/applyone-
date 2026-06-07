import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadLocalEnv() {
  const envPath = resolve(".env");

  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = rest.join("=").trim();
    }
  }
}

export function getEnv() {
  loadLocalEnv();
  return {
    apiBase: process.env.APPLYONE_LOCAL_API || "http://127.0.0.1:8787",
    cvPath: process.env.APPLYONE_CV_PATH || "",
    headless: (process.env.PLAYWRIGHT_HEADLESS || "true").toLowerCase() !== "false"
  };
}
