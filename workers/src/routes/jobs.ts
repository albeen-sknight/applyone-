import type { ApplyOneEnv } from "../env";
import { json } from "../index";
import { calculateMatchScore, getProfileSkills } from "../lib/matching";
import { scrapeIndeedEs } from "../scrapers/indeed_es";
import { scrapeInfoJobs } from "../scrapers/infojobs";
import { scrapeLinkedInJobs } from "../scrapers/linkedin";
import { scrapeTecnoempleo } from "../scrapers/tecnoempleo";
import type { JobPlatform, JobStatus, ScrapedJob, ScraperResult, StoredJob } from "../types/job";

type JobRow = {
  id: string;
  title: string;
  company: string | null;
  location: string | null;
  platform: string | null;
  source: string | null;
  url: string | null;
  source_url: string | null;
  description_raw: string | null;
  description_parsed: string | null;
  description: string | null;
  match_score: number | null;
  fit_score: number | null;
  posted_at: string | null;
  scraped_at: string | null;
  status: JobStatus;
};

type ScrapeSummary = {
  platforms: Array<{ platform: JobPlatform; found: number; status: "ok" | "error"; error?: string }>;
  inserted: number;
  updated: number;
  skippedDuplicates: number;
  errors: Array<{ platform: JobPlatform; error: string }>;
};

const allowedStatuses = new Set<JobStatus>(["new", "reviewed", "applied", "skipped"]);

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function ensureJobsTable(env: ApplyOneEnv) {
  await env.applyone_db
    .prepare(
      `CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        company TEXT,
        location TEXT,
        platform TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        description_raw TEXT,
        description_parsed TEXT,
        match_score REAL NOT NULL DEFAULT 0,
        posted_at TEXT,
        scraped_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    )
    .run();

  const table = await env.applyone_db.prepare("PRAGMA table_info(jobs)").all<{ name: string }>();
  const columns = new Set((table.results || []).map((column) => column.name));
  const columnDefinitions: Array<[string, string]> = [
    ["platform", "TEXT NOT NULL DEFAULT ''"],
    ["url", "TEXT"],
    ["source", "TEXT"],
    ["source_url", "TEXT"],
    ["description_raw", "TEXT"],
    ["description_parsed", "TEXT"],
    ["description", "TEXT"],
    ["match_score", "REAL NOT NULL DEFAULT 0"],
    ["fit_score", "INTEGER"],
    ["posted_at", "TEXT"],
    ["scraped_at", "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP"],
    ["raw_json", "TEXT NOT NULL DEFAULT '{}'"]
  ];
  const missingColumns = columnDefinitions.filter(([name]) => !columns.has(name));

  for (const [name, definition] of missingColumns) {
    await env.applyone_db.prepare(`ALTER TABLE jobs ADD COLUMN ${name} ${definition}`).run();
  }

  await env.applyone_db.prepare("CREATE INDEX IF NOT EXISTS idx_jobs_match_score ON jobs(match_score)").run();
  await env.applyone_db.prepare("CREATE INDEX IF NOT EXISTS idx_jobs_scraped_at ON jobs(scraped_at)").run();
  await env.applyone_db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_url ON jobs(url)").run();

  return new Set([...columns, ...missingColumns.map(([name]) => name)]);
}

function rowToJob(row: JobRow): StoredJob {
  return {
    id: row.id,
    title: row.title,
    company: row.company || "Empresa no indicada",
    location: row.location || "Madrid",
    platform: ((row.platform || row.source || "manual") as JobPlatform),
    url: row.url || row.source_url || "",
    description_raw: row.description_raw || row.description || "",
    description_parsed: row.description_parsed || undefined,
    match_score: Number(row.match_score ?? (row.fit_score ? row.fit_score / 100 : 0)),
    posted_at: row.posted_at || undefined,
    scraped_at: row.scraped_at || "",
    status: row.status
  };
}

function validStatus(value: string | null): JobStatus | null {
  return value && allowedStatuses.has(value as JobStatus) ? (value as JobStatus) : null;
}

function buildJobsQuery(request: Request) {
  const url = new URL(request.url);
  const where: string[] = [];
  const bindings: Array<string | number> = [];
  const minScore = Number(url.searchParams.get("minScore") || "0.5");
  const status = validStatus(url.searchParams.get("status"));
  const platform = url.searchParams.get("platform");
  const q = url.searchParams.get("q")?.trim();

  where.push("COALESCE(match_score, fit_score / 100.0, 0) > ?");
  bindings.push(Number.isFinite(minScore) ? minScore : 0.5);

  if (status) {
    where.push("status = ?");
    bindings.push(status);
  } else {
    where.push("status != 'skipped'");
  }

  if (platform) {
    where.push("COALESCE(platform, source) = ?");
    bindings.push(platform);
  }

  if (q) {
    where.push("(title LIKE ? OR company LIKE ? OR location LIKE ? OR description_raw LIKE ? OR description LIKE ?)");
    const term = `%${q}%`;
    bindings.push(term, term, term, term, term);
  }

  return { where, bindings };
}

async function listJobs(request: Request, env: ApplyOneEnv) {
  await ensureJobsTable(env);
  const { where, bindings } = buildJobsQuery(request);
  const result = await env.applyone_db
    .prepare(
      `SELECT
        id,
        title,
        company,
        location,
        platform,
        source,
        url,
        source_url,
        description_raw,
        description_parsed,
        description,
        match_score,
        fit_score,
        posted_at,
        scraped_at,
        status
      FROM jobs
      WHERE ${where.join(" AND ")}
      ORDER BY COALESCE(match_score, fit_score / 100.0, 0) DESC, COALESCE(scraped_at, updated_at, created_at) DESC
      LIMIT 100`
    )
    .bind(...bindings)
    .all<JobRow>();

  return json({ jobs: (result.results || []).map(rowToJob) });
}

async function getJob(request: Request, env: ApplyOneEnv, id: string) {
  await ensureJobsTable(env);
  const row = await env.applyone_db
    .prepare(
      `SELECT id, title, company, location, platform, source, url, source_url, description_raw, description_parsed, description, match_score, fit_score, posted_at, scraped_at, status
      FROM jobs
      WHERE id = ?`
    )
    .bind(id)
    .first<JobRow>();

  return row ? json(rowToJob(row)) : json({ error: "Job not found" }, { status: 404 });
}

async function findExistingByUrl(env: ApplyOneEnv, url: string) {
  return env.applyone_db.prepare("SELECT id FROM jobs WHERE COALESCE(url, source_url) = ?").bind(url).first<{ id: string }>();
}

async function saveJob(env: ApplyOneEnv, columns: Set<string>, job: ScrapedJob, matchScore: number) {
  const now = new Date().toISOString();
  const id = await sha256(job.url);
  const existing = await findExistingByUrl(env, job.url);
  const values: Record<string, string | number | null> = {
    id,
    title: job.title,
    company: job.company,
    location: job.location,
    platform: job.platform,
    source: job.platform,
    url: job.url,
    source_url: job.url,
    description_raw: job.description_raw,
    description_parsed: job.description_parsed || job.description_raw,
    description: job.description_raw,
    match_score: matchScore,
    fit_score: Math.round(matchScore * 100),
    posted_at: job.posted_at || null,
    scraped_at: now,
    status: "new",
    raw_json: JSON.stringify(job)
  };

  if (existing) {
    const updateColumns = ["title", "company", "location", "description_raw", "description_parsed", "description", "match_score", "fit_score", "posted_at", "scraped_at", "raw_json"].filter((column) =>
      columns.has(column)
    );
    await env.applyone_db
      .prepare(`UPDATE jobs SET ${updateColumns.map((column) => `${column} = ?`).join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(...updateColumns.map((column) => values[column]), existing.id)
      .run();
    return "updated" as const;
  }

  const insertColumns = Object.keys(values).filter((column) => columns.has(column));
  await env.applyone_db
    .prepare(`INSERT INTO jobs (${insertColumns.join(", ")}) VALUES (${insertColumns.map(() => "?").join(", ")})`)
    .bind(...insertColumns.map((column) => values[column]))
    .run();
  return "inserted" as const;
}

async function scrapeJobs(_request: Request, env: ApplyOneEnv) {
  const columns = await ensureJobsTable(env);
  const skills = await getProfileSkills(env);
  const summary: ScrapeSummary = { platforms: [], inserted: 0, updated: 0, skippedDuplicates: 0, errors: [] };
  const results: ScraperResult[] = await Promise.all([scrapeInfoJobs(), scrapeLinkedInJobs(), scrapeTecnoempleo(), scrapeIndeedEs()]);
  const seen = new Set<string>();

  for (const result of results) {
    summary.platforms.push({ platform: result.platform, found: result.jobs.length, status: result.error ? "error" : "ok", error: result.error });

    if (result.error) {
      summary.errors.push({ platform: result.platform, error: result.error });
    }

    for (const job of result.jobs) {
      if (seen.has(job.url)) {
        summary.skippedDuplicates += 1;
        continue;
      }

      seen.add(job.url);
      const matchScore = calculateMatchScore(job, skills);

      if (matchScore <= 0.5) {
        continue;
      }

      const status = await saveJob(env, columns, job, matchScore);
      summary[status] += 1;
    }
  }

  return json(summary);
}

async function updateJobStatus(request: Request, env: ApplyOneEnv, id: string) {
  await ensureJobsTable(env);
  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  const status = typeof body?.status === "string" ? validStatus(body.status) : null;

  if (!status) {
    return json({ error: "Invalid status" }, { status: 400 });
  }

  await env.applyone_db.prepare("UPDATE jobs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(status, id).run();
  return getJob(request, env, id);
}

async function importJob(request: Request, env: ApplyOneEnv) {
  const columns = await ensureJobsTable(env);
  const skills = await getProfileSkills(env);
  const body = (await request.json().catch(() => null)) as Partial<ScrapedJob> | null;

  if (!body?.title || !body?.url) {
    return json({ error: "title and url are required" }, { status: 400 });
  }

  const job: ScrapedJob = {
    title: body.title,
    company: body.company || "Empresa no indicada",
    location: body.location || "Madrid",
    platform: body.platform || "manual",
    url: body.url,
    description_raw: body.description_raw || body.description_parsed || body.title,
    description_parsed: body.description_parsed,
    posted_at: body.posted_at
  };
  const matchScore = calculateMatchScore(job, skills);
  const result = await saveJob(env, columns, job, matchScore);

  return json({ result, match_score: matchScore });
}

export function handleJobs(request: Request, env: ApplyOneEnv) {
  const url = new URL(request.url);
  const statusMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)\/status$/);
  const detailMatch = url.pathname.match(/^\/api\/jobs\/([^/]+)$/);

  if (request.method === "GET" && url.pathname === "/api/jobs") {
    return listJobs(request, env);
  }

  if (request.method === "POST" && url.pathname === "/api/jobs/scrape") {
    return scrapeJobs(request, env);
  }

  if (request.method === "POST" && url.pathname === "/api/jobs/import") {
    return importJob(request, env);
  }

  if (request.method === "PATCH" && statusMatch) {
    return updateJobStatus(request, env, statusMatch[1]);
  }

  if (request.method === "GET" && detailMatch) {
    return getJob(request, env, detailMatch[1]);
  }

  return json({ error: "Not found" }, { status: 404 });
}
