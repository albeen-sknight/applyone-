import type { JobPlatform, ScrapedJob, ScraperResult } from "../types/job";

export const searchVariants = [
  "Tecnico de soporte IT Madrid",
  "Help Desk Technician Madrid",
  "Service Desk Madrid",
  "Soporte informatico Madrid",
  "Tecnico sistemas junior Madrid",
  "Administrador de sistemas junior Madrid",
  "Administrador de redes junior Madrid",
  "Tecnico redes junior Madrid",
  "SOC analyst junior Madrid",
  "Ciberseguridad junior Madrid"
];

export function cleanText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function absoluteUrl(url: string, base: string) {
  try {
    return new URL(url, base).toString();
  } catch {
    return "";
  }
}

export async function fetchPublicPage(url: string) {
  const response = await fetch(url, {
    headers: {
      "accept": "text/html,application/xhtml+xml",
      "accept-language": "es-ES,es;q=0.9,en;q=0.8",
      "user-agent": "ApplyOne private job feed; respectful fetch; contact: albertosaeedi@gmail.com"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

export function uniqueJobs(jobs: ScrapedJob[]) {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    if (!job.url || seen.has(job.url)) {
      return false;
    }
    seen.add(job.url);
    return true;
  });
}

export function unavailable(platform: JobPlatform, error: unknown): ScraperResult {
  return {
    platform,
    jobs: [],
    error: error instanceof Error ? error.message : "Platform unavailable/manual check required"
  };
}
