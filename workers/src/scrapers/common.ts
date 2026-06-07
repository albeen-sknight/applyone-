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
  let output = "";
  let tagName = "";
  let entity = "";
  let inTag = false;
  let inEntity = false;
  let ignoredTag: "script" | "style" | "noscript" | null = null;

  const append = (text: string) => {
    if (!ignoredTag) {
      output += text;
    }
  };

  const decodeEntity = (name: string) => {
    const normalized = name.toLowerCase();
    const named: Record<string, string> = {
      amp: "&",
      quot: "\"",
      apos: "'",
      "#39": "'",
      nbsp: " ",
      lt: "<",
      gt: " "
    };

    if (named[normalized]) {
      return named[normalized];
    }

    if (normalized.startsWith("#x")) {
      const codePoint = Number.parseInt(normalized.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : `&${name};`;
    }

    if (normalized.startsWith("#")) {
      const codePoint = Number.parseInt(normalized.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : `&${name};`;
    }

    return `&${name};`;
  };

  for (const char of value) {
    if (inTag) {
      if (char === ">") {
        const normalizedTag = tagName.trim().toLowerCase().replace(/^\//, "").split(/\s+/)[0];
        const closing = tagName.trim().startsWith("/");

        if (!closing && (normalizedTag === "script" || normalizedTag === "style" || normalizedTag === "noscript")) {
          ignoredTag = normalizedTag;
        } else if (closing && normalizedTag === ignoredTag) {
          ignoredTag = null;
        }

        append(" ");
        tagName = "";
        inTag = false;
      } else {
        tagName += char;
      }
      continue;
    }

    if (char === "<") {
      inTag = true;
      inEntity = false;
      entity = "";
      continue;
    }

    if (inEntity) {
      if (char === ";") {
        append(decodeEntity(entity));
        entity = "";
        inEntity = false;
      } else if (entity.length > 12 || /\s/.test(char)) {
        append(`&${entity}${char}`);
        entity = "";
        inEntity = false;
      } else {
        entity += char;
      }
      continue;
    }

    if (char === "&") {
      inEntity = true;
      entity = "";
      continue;
    }

    append(char);
  }

  if (inEntity) {
    append(`&${entity}`);
  }

  return output.split(/\s+/).join(" ").trim();
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
