import { generateCoverLetterWithGemini } from "../ai/gemini";
import type { ApplyOneEnv } from "../env";
import { json } from "../index";
import { ownerProfile } from "./profile";

type ApplicationStatus = "draft" | "ready_to_apply" | "manual_required" | "applied" | "viewed" | "interview" | "offer" | "rejected" | "no_reply";

type ApplicationRow = {
  id: string;
  job_id: string;
  applied_at: string | null;
  cover_letter: string | null;
  cover_letter_used: string | null;
  cv_version_used: string | null;
  form_platform: string | null;
  status: ApplicationStatus;
  notes: string | null;
  follow_up_date: string | null;
  auto_applied: number | null;
  created_at: string;
  updated_at: string;
  job_title: string | null;
  company: string | null;
  platform: string | null;
  url: string | null;
  location: string | null;
  description_raw: string | null;
  description_parsed: string | null;
  match_score: number | null;
};

const statuses = new Set<ApplicationStatus>(["draft", "ready_to_apply", "manual_required", "applied", "viewed", "interview", "offer", "rejected", "no_reply"]);

function isStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && statuses.has(value as ApplicationStatus);
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function ensureApplicationsTable(env: ApplyOneEnv) {
  await env.applyone_db
    .prepare(
      `CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        applied_at TEXT,
        cover_letter TEXT,
        cover_letter_used TEXT,
        cv_version_used TEXT,
        form_platform TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        notes TEXT,
        follow_up_date TEXT,
        auto_applied INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    )
    .run();

  const table = await env.applyone_db.prepare("PRAGMA table_info(applications)").all<{ name: string }>();
  const columns = new Set((table.results || []).map((column) => column.name));
  const columnDefinitions: Array<[string, string]> = [
    ["cover_letter_used", "TEXT"],
    ["cv_version_used", "TEXT"],
    ["form_platform", "TEXT"],
    ["follow_up_date", "TEXT"],
    ["auto_applied", "INTEGER NOT NULL DEFAULT 0"]
  ];
  const missing = columnDefinitions.filter(([name]) => !columns.has(name));

  for (const [name, definition] of missing) {
    await env.applyone_db.prepare(`ALTER TABLE applications ADD COLUMN ${name} ${definition}`).run();
  }

  await env.applyone_db.prepare("CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)").run();
  await env.applyone_db.prepare("CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id)").run();
}

function mapApplication(row: ApplicationRow) {
  return {
    id: row.id,
    job_id: row.job_id,
    applied_at: row.applied_at,
    cover_letter_used: row.cover_letter_used || row.cover_letter || "",
    cv_version_used: row.cv_version_used || "",
    form_platform: row.form_platform || row.platform || "manual",
    status: row.status,
    notes: row.notes || "",
    follow_up_date: row.follow_up_date || "",
    auto_applied: Boolean(row.auto_applied),
    created_at: row.created_at,
    updated_at: row.updated_at,
    job: {
      id: row.job_id,
      title: row.job_title || "Oferta sin título",
      company: row.company || "Empresa no indicada",
      platform: row.platform || "manual",
      url: row.url || "",
      location: row.location || "",
      description_raw: row.description_raw || "",
      description_parsed: row.description_parsed || "",
      match_score: Number(row.match_score || 0)
    }
  };
}

function selectApplicationsSql(where: string) {
  return `SELECT
    a.id,
    a.job_id,
    a.applied_at,
    a.cover_letter,
    a.cover_letter_used,
    a.cv_version_used,
    a.form_platform,
    a.status,
    a.notes,
    a.follow_up_date,
    a.auto_applied,
    a.created_at,
    a.updated_at,
    j.title AS job_title,
    j.company,
    COALESCE(j.platform, j.source) AS platform,
    COALESCE(j.url, j.source_url) AS url,
    j.location,
    j.description_raw,
    j.description_parsed,
    COALESCE(j.match_score, j.fit_score / 100.0, 0) AS match_score
  FROM applications a
  LEFT JOIN jobs j ON j.id = a.job_id
  ${where}
  ORDER BY COALESCE(a.applied_at, a.created_at) DESC`;
}

async function listApplications(request: Request, env: ApplyOneEnv) {
  await ensureApplicationsTable(env);
  const url = new URL(request.url);
  const where: string[] = [];
  const bindings: string[] = [];

  const status = url.searchParams.get("status");
  const platform = url.searchParams.get("platform");
  const q = url.searchParams.get("q")?.trim();

  if (isStatus(status)) {
    where.push("a.status = ?");
    bindings.push(status);
  }

  if (platform) {
    where.push("COALESCE(j.platform, j.source) = ?");
    bindings.push(platform);
  }

  if (q) {
    where.push("(j.title LIKE ? OR j.company LIKE ? OR a.notes LIKE ?)");
    bindings.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  const result = await env.applyone_db.prepare(selectApplicationsSql(where.length ? `WHERE ${where.join(" AND ")}` : "")).bind(...bindings).all<ApplicationRow>();
  return json({ applications: (result.results || []).map(mapApplication) });
}

async function getApplication(_request: Request, env: ApplyOneEnv, id: string) {
  await ensureApplicationsTable(env);
  const row = await env.applyone_db.prepare(selectApplicationsSql("WHERE a.id = ?")).bind(id).first<ApplicationRow>();
  return row ? json(mapApplication(row)) : json({ error: "Application not found" }, { status: 404 });
}

async function createApplication(request: Request, env: ApplyOneEnv) {
  await ensureApplicationsTable(env);
  const body = (await request.json().catch(() => null)) as { job_id?: unknown; status?: unknown; notes?: unknown; forceNew?: unknown } | null;
  const jobId = typeof body?.job_id === "string" ? body.job_id : "";

  if (!jobId) {
    return json({ error: "job_id is required" }, { status: 400 });
  }

  const existing = await env.applyone_db.prepare("SELECT id FROM applications WHERE job_id = ? ORDER BY created_at DESC LIMIT 1").bind(jobId).first<{ id: string }>();
  if (existing && !body?.forceNew) {
    return getApplication(request, env, existing.id);
  }

  const id = await sha256(`${jobId}:${Date.now()}`);
  const status = isStatus(body?.status) ? body.status : "draft";
  const notes = typeof body?.notes === "string" ? body.notes : "";
  await env.applyone_db
    .prepare("INSERT INTO applications (id, job_id, status, notes, auto_applied) VALUES (?, ?, ?, ?, 0)")
    .bind(id, jobId, status, notes)
    .run();

  return getApplication(request, env, id);
}

async function loadJob(env: ApplyOneEnv, jobId: string) {
  return env.applyone_db
    .prepare(
      `SELECT id, title, company, location, COALESCE(platform, source) AS platform, COALESCE(url, source_url) AS url,
        COALESCE(description_raw, description, '') AS description_raw,
        COALESCE(description_parsed, description, '') AS description_parsed,
        COALESCE(match_score, fit_score / 100.0, 0) AS match_score
      FROM jobs WHERE id = ?`
    )
    .bind(jobId)
    .first<Record<string, unknown>>();
}

async function loadProfileForLetter(env: ApplyOneEnv) {
  const row = await env.applyone_db.prepare("SELECT cv_structured, cv_raw_text FROM profile WHERE id = ?").bind("owner").first<{ cv_structured: string | null; cv_raw_text: string | null }>();
  let structured: unknown = null;

  if (row?.cv_structured) {
    try {
      structured = JSON.parse(row.cv_structured);
    } catch {
      structured = null;
    }
  }

  return {
    defaults: ownerProfile,
    cv_structured: structured,
    cv_raw_text_available: Boolean(row?.cv_raw_text),
    warning: structured ? "" : "No hay CV analizado todavía. Se usará el perfil base."
  };
}

async function generateCoverLetter(request: Request, env: ApplyOneEnv) {
  await ensureApplicationsTable(env);
  const body = (await request.json().catch(() => null)) as { job_id?: unknown } | null;
  const jobId = typeof body?.job_id === "string" ? body.job_id : "";

  if (!jobId) {
    return json({ error: "job_id is required" }, { status: 400 });
  }

  const job = await loadJob(env, jobId);
  if (!job) {
    return json({ error: "Job not found" }, { status: 404 });
  }

  try {
    const profile = await loadProfileForLetter(env);
    const coverLetter = await generateCoverLetterWithGemini({ profile, job, env });

    if (!coverLetter.trim()) {
      return json({ error: "Gemini devolvio una carta vacia." }, { status: 400 });
    }

    const app = await createApplication(new Request(request.url, { method: "POST", body: JSON.stringify({ job_id: jobId, status: "draft" }) }), env);
    const appData = (await app.json()) as { id?: string };

    if (appData.id) {
      await env.applyone_db
        .prepare("UPDATE applications SET cover_letter_used = ?, cover_letter = ?, cv_version_used = ?, form_platform = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(coverLetter, coverLetter, profile.cv_structured ? "parsed_cv" : "base_profile", String(job.platform || "manual"), appData.id)
        .run();
    }

    return json({ cover_letter: coverLetter, application_id: appData.id || "", warning: profile.warning });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "No se pudo generar la carta." }, { status: 400 });
  }
}

async function updateApplication(request: Request, env: ApplyOneEnv, id: string) {
  await ensureApplicationsTable(env);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const allowed = ["cover_letter_used", "status", "notes", "follow_up_date", "form_platform", "cv_version_used", "auto_applied"];
  const updates: string[] = [];
  const values: Array<string | number | null> = [];

  for (const key of allowed) {
    if (!body || !(key in body)) {
      continue;
    }
    if (key === "status" && !isStatus(body[key])) {
      return json({ error: "Invalid status" }, { status: 400 });
    }
    updates.push(`${key} = ?`);
    values.push(typeof body[key] === "boolean" ? (body[key] ? 1 : 0) : (body[key] as string | null));
  }

  if (updates.length === 0) {
    return getApplication(request, env, id);
  }

  await env.applyone_db.prepare(`UPDATE applications SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(...values, id).run();
  return getApplication(request, env, id);
}

async function markApplied(request: Request, env: ApplyOneEnv, id: string) {
  await ensureApplicationsTable(env);
  const now = new Date().toISOString();
  const row = await env.applyone_db.prepare("SELECT job_id FROM applications WHERE id = ?").bind(id).first<{ job_id: string }>();

  if (!row) {
    return json({ error: "Application not found" }, { status: 404 });
  }

  await env.applyone_db
    .prepare("UPDATE applications SET status = 'applied', applied_at = ?, auto_applied = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(now, id)
    .run();
  await env.applyone_db.prepare("UPDATE jobs SET status = 'applied', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(row.job_id).run();
  return getApplication(request, env, id);
}

async function stats(env: ApplyOneEnv) {
  await ensureApplicationsTable(env);
  const rows = await env.applyone_db.prepare("SELECT status, applied_at, created_at FROM applications").all<{ status: ApplicationStatus; applied_at: string | null; created_at: string }>();
  const applications = rows.results || [];
  const appliedLike = new Set(["applied", "viewed", "interview", "offer", "rejected", "no_reply"]);
  const responded = new Set(["viewed", "interview", "offer", "rejected"]);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const totalApplications = applications.filter((app) => appliedLike.has(app.status)).length;
  const responseCount = applications.filter((app) => responded.has(app.status)).length;
  const interviewsScheduled = applications.filter((app) => app.status === "interview").length;
  const thisWeekApplications = applications.filter((app) => new Date(app.applied_at || app.created_at) >= weekStart).length;

  return json({
    totalApplications,
    responseRate: totalApplications ? Number((responseCount / totalApplications).toFixed(2)) : 0,
    interviewsScheduled,
    thisWeekApplications
  });
}

export async function handleApplications(request: Request, env: ApplyOneEnv) {
  const url = new URL(request.url);
  const statusMatch = url.pathname.match(/^\/api\/applications\/([^/]+)\/status$/);
  const appliedMatch = url.pathname.match(/^\/api\/applications\/([^/]+)\/mark-applied$/);
  const followUpMatch = url.pathname.match(/^\/api\/applications\/([^/]+)\/follow-up$/);
  const detailMatch = url.pathname.match(/^\/api\/applications\/([^/]+)$/);

  if (request.method === "GET" && url.pathname === "/api/applications") return listApplications(request, env);
  if (request.method === "GET" && url.pathname === "/api/applications/stats") return stats(env);
  if (request.method === "POST" && url.pathname === "/api/applications") return createApplication(request, env);
  if (request.method === "POST" && url.pathname === "/api/applications/generate-cover-letter") return generateCoverLetter(request, env);
  if (request.method === "GET" && detailMatch) return getApplication(request, env, detailMatch[1]);
  if (request.method === "PUT" && detailMatch) return updateApplication(request, env, detailMatch[1]);
  if (request.method === "PATCH" && statusMatch) {
    const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
    return updateApplication(new Request(request.url, { method: "PUT", body: JSON.stringify({ status: body?.status }) }), env, statusMatch[1]);
  }
  if (request.method === "POST" && appliedMatch) return markApplied(request, env, appliedMatch[1]);
  if (request.method === "POST" && followUpMatch) return updateApplication(request, env, followUpMatch[1]);

  return json({ error: "Not found" }, { status: 404 });
}
